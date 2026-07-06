// Webhook público chamado pelo GPT Maker quando o usuário responde no WhatsApp.
// Requer header X-Webhook-Token = GPT_MAKER_WEBHOOK_TOKEN.
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendWhatsApp, normalizePhone, todayBRT } from "../_shared/gpt-maker.ts";
import { parseWhatsAppLog } from "../_shared/whatsapp-parser.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_TOKEN = Deno.env.get("GPT_MAKER_WEBHOOK_TOKEN");

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function computeDayScore(log: any): { score: number; label: string } {
  const alvoAtiv = 40;
  const atividades = (log.ligacoes || 0) + (log.whatsapps || 0);
  const vol = Math.min(1, atividades / alvoAtiv) * 30;
  const prosp = Math.min(1, (log.prospeccoes || 0) / 5) * 15;
  const reun = Math.min(1, (log.reunioes_agendadas || 0) / 2) * 20;
  const fech = (log.vendas || 0) > 0 ? 35 : (log.propostas || 0) > 0 ? 15 : (log.apresentacoes || 0) > 0 ? 8 : 0;
  const score = Math.round(vol + prosp + reun + fech);
  const label = score < 30 ? "Fraco" : score < 55 ? "Regular" : score < 75 ? "Bom" : score < 90 ? "Ótimo" : "Excelente";
  return { score, label };
}

async function getAdminSettings(admin: any) {
  const { data: adminRole } = await admin.from("user_roles").select("user_id").eq("role", "admin").limit(1).maybeSingle();
  if (!adminRole) return null;
  const { data: settings } = await admin.from("settings").select("*").eq("user_id", adminRole.user_id).maybeSingle();
  return settings;
}

async function computeStreak(admin: any, userId: string): Promise<number> {
  const { data } = await admin.from("score_daily_logs").select("date").eq("user_id", userId).order("date", { ascending: false }).limit(365);
  if (!data || data.length === 0) return 0;
  const set = new Set((data as any[]).map((d) => d.date));
  const today = todayBRT();
  let streak = 0;
  const start = new Date(today + "T00:00:00Z");
  for (let i = 0; i < 365; i++) {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (set.has(key)) streak++;
    else if (i > 0) break;
    else continue;
  }
  return streak;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
  if (!WEBHOOK_TOKEN) return json({ error: "webhook token not configured" }, 500);
  const token = req.headers.get("x-webhook-token") ?? req.headers.get("X-Webhook-Token");
  if (token !== WEBHOOK_TOKEN) return json({ error: "unauthorized" }, 401);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "invalid json" }, 400); }

  // Aceita vários formatos do GPT Maker
  const rawPhone: string = body.phone || body.from || body.contact?.phone || body.chat?.phone || "";
  const message: string = body.message || body.text || body.body || body.content || "";
  if (!rawPhone || !message) return json({ error: "phone and message required" }, 400);

  const phone = normalizePhone(rawPhone);
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  // Log inbound
  await admin.from("score_whatsapp_messages").insert({
    phone, direction: "in", kind: "inbound", payload: { message, raw: body },
  });

  // Localiza perfil por telefone (busca com/sem 55, últimos 10 dígitos)
  const last10 = phone.slice(-11);
  const { data: profiles } = await admin.from("score_profiles").select("user_id, full_name, phone").limit(200);
  const profile = (profiles || []).find((p: any) => normalizePhone(p.phone || "").endsWith(last10));

  const settings = await getAdminSettings(admin);
  const channelId = settings?.channel_id;

  if (!profile) {
    if (channelId) {
      await sendWhatsApp(channelId, phone, "Olá! Não encontrei seu cadastro no Score Comercial. Acesse a plataforma e complete seu perfil com esse número de WhatsApp.");
    }
    return json({ ok: false, error: "profile not found" });
  }

  const parsed = parseWhatsAppLog(message);
  if (!parsed.ok || !parsed.log) {
    if (channelId) {
      const help =
`Não entendi seu registro 🤔

Responde no formato:

Ligações: 20
WhatsApps: 30
Reuniões: 3
Apresentações: 2
Propostas: 1
Vendas: 1
Valor: 12500

Ou registre pelo app: https://gabrielconsultor.com/scoreapp/registrar`;
      await sendWhatsApp(channelId, phone, help);
      await admin.from("score_whatsapp_messages").insert({
        user_id: profile.user_id, phone, direction: "out", kind: "reply_help", payload: { message: help },
      });
    }
    return json({ ok: false, error: "parse failed" });
  }

  const date = todayBRT();
  const log = parsed.log;

  // Upsert score_daily_logs (unique user_id + date)
  const { error: upErr } = await admin.from("score_daily_logs").upsert({
    user_id: profile.user_id,
    date,
    ...log,
  }, { onConflict: "user_id,date" });

  if (upErr) {
    console.error("upsert log error", upErr);
    if (channelId) await sendWhatsApp(channelId, phone, "Recebi seus números, mas tive um problema para salvar. Tenta de novo em alguns minutos?");
    return json({ ok: false, error: upErr.message });
  }

  // Zera penalidade de inatividade
  await admin.from("score_profiles").update({ inactivity_penalty_days: 0 }).eq("user_id", profile.user_id);

  const { score, label } = computeDayScore(log);
  const streak = await computeStreak(admin, profile.user_id);

  const firstName = (profile.full_name || "").split(" ")[0] || "";
  const streakLine = streak >= 2 ? `\n🔥 Streak: ${streak} dias consecutivos!` : "";
  const reply =
`Score de hoje: ${score}/100 (${label}) ✅${streakLine}

Continua firme${firstName ? `, ${firstName}` : ""}. Amanhã eu volto pra puxar seu registro.`;

  if (channelId) {
    const r = await sendWhatsApp(channelId, phone, reply);
    await admin.from("score_whatsapp_messages").insert({
      user_id: profile.user_id, phone, direction: "out", kind: "reply_ok",
      payload: { message: reply, score, label, streak }, error: r.ok ? null : r.error,
    });
  }

  return json({ ok: true, score, label, streak, matched: parsed.matched });
});
