// Webhook público chamado pelo GPT Maker quando o usuário responde no WhatsApp.
// Requer header X-Webhook-Token = GPT_MAKER_WEBHOOK_TOKEN.
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendWhatsApp, normalizePhone, todayBRT } from "../_shared/gpt-maker.ts";
import { parseWhatsAppLog } from "../_shared/whatsapp-parser.ts";
import {
  BotFlow,
  BotSession,
  continueSession,
  isCancelCommand,
  matchFlow,
  matchFlowDebug,
  startSession,
  StepResult,
} from "../_shared/bot-engine.ts";

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
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
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

const SCORE_FIELDS = [
  "ligacoes", "whatsapps", "prospeccoes", "contatos_efetivos",
  "reunioes_agendadas", "apresentacoes", "propostas", "vendas", "valor_vendido",
];

function pickEmail(body: any): string {
  return String(body.email || body.user?.email || body.contact?.email || body.chat?.email || body.customer?.email || "")
    .trim()
    .toLowerCase();
}

async function getAdminSettings(admin: any) {
  const { data: adminRole } = await admin
    .from("user_roles").select("user_id").eq("role", "admin").limit(1).maybeSingle();
  if (!adminRole) return null;
  const { data: settings } = await admin.from("settings").select("*").eq("user_id", adminRole.user_id).maybeSingle();
  return settings;
}

async function computeStreak(admin: any, userId: string): Promise<number> {
  const { data } = await admin
    .from("score_daily_logs").select("date").eq("user_id", userId)
    .order("date", { ascending: false }).limit(365);
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

async function persistAndReply(
  admin: any,
  channelId: string | null,
  phone: string,
  profile: any,
  step: StepResult,
) {
  // 1) Se há log a salvar, salva com merge
  let scoreInfo: { score: number; label: string; streak: number } | null = null;
  if (step.saveLogFor) {
    const { date, log } = step.saveLogFor;
    const { data: existing } = await admin
      .from("score_daily_logs").select("*")
      .eq("user_id", profile.user_id).eq("date", date).maybeSingle();
    const merged: any = { user_id: profile.user_id, date };
    for (const f of SCORE_FIELDS) merged[f] = Number(log[f] ?? existing?.[f]) || 0;
    const { error: upErr } = await admin.from("score_daily_logs")
      .upsert(merged, { onConflict: "user_id,date" });
    if (upErr) console.error("upsert log error", upErr);
    if (step.markPenaltyZero) {
      await admin.from("score_profiles").update({ inactivity_penalty_days: 0 }).eq("user_id", profile.user_id);
    }
    const { score, label } = computeDayScore(merged);
    const streak = await computeStreak(admin, profile.user_id);
    scoreInfo = { score, label, streak };
  }

  // 2) Persistir sessão (upsert ou delete se encerrou)
  if (step.session) {
    await admin.from("bot_sessions").upsert(
      {
        phone,
        user_id: profile.user_id,
        flow_id: step.session.flow_id,
        current_node_id: step.session.current_node_id,
        variables: step.session.variables,
      },
      { onConflict: "phone" },
    );
  } else {
    await admin.from("bot_sessions").delete().eq("phone", phone);
  }

  // 3) Enviar mensagens (última pode ter placeholders de score)
  const streakLine = scoreInfo && scoreInfo.streak >= 2 ? `\n🔥 Streak: ${scoreInfo.streak} dias consecutivos!` : "";
  const finalMessages = step.messages.map((m) =>
    m
      .replace(/\{\{\s*score\s*\}\}/g, String(scoreInfo?.score ?? ""))
      .replace(/\{\{\s*score_label\s*\}\}/g, scoreInfo?.label ?? "")
      .replace(/\{\{\s*streak_line\s*\}\}/g, streakLine),
  );

  for (const msg of finalMessages) {
    if (!channelId) break;
    const r = await sendWhatsApp(channelId, phone, msg);
    await admin.from("score_whatsapp_messages").insert({
      user_id: profile.user_id,
      phone,
      direction: "out",
      kind: "bot_step",
      payload: { message: msg, ...(scoreInfo || {}) },
      error: r.ok ? null : r.error,
    });
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
  if (!WEBHOOK_TOKEN) return json({ error: "webhook token not configured" }, 500);
  const token = req.headers.get("x-webhook-token") ?? req.headers.get("X-Webhook-Token");
  if (token !== WEBHOOK_TOKEN) return json({ error: "unauthorized" }, 401);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "invalid json" }, 400); }

  const rawPhone: string = body.phone || body.from || body.contact?.phone || body.chat?.phone || "";
  const email = pickEmail(body);
  const message: string = body.message || body.text || body.body || body.content || "";
  if ((!rawPhone && !email) || !message) return json({ error: "phone/email and message required" }, 400);

  const phone = normalizePhone(rawPhone);
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  await admin.from("score_whatsapp_messages").insert({
    phone: phone || "unknown", direction: "in", kind: "inbound",
    payload: { message, email, raw: body },
  });

  const last10 = phone.slice(-11);
  const { data: profiles } = await admin.from("score_profiles").select("user_id, full_name, email, phone").limit(500);
  const profile = (profiles || []).find((p: any) => {
    const pp = normalizePhone(p.phone || "");
    const pe = String(p.email || "").trim().toLowerCase();
    return (phone && pp.endsWith(last10)) || (email && pe === email);
  });

  const settings = await getAdminSettings(admin);
  const channelId = settings?.channel_id || null;

  if (!profile) {
    if (channelId) await sendWhatsApp(channelId, phone,
      "Olá! Não encontrei seu cadastro no Score Comercial. Acesse a plataforma e complete seu perfil com esse número de WhatsApp.");
    return json({ ok: false, error: "profile not found" });
  }

  // Comando global: cancelar
  if (isCancelCommand(message)) {
    await admin.from("bot_sessions").delete().eq("phone", phone);
    if (channelId) await sendWhatsApp(channelId, phone, "Beleza, encerrei o registro. Quando quiser recomeçar, é só me chamar.");
    return json({ ok: true, cancelled: true });
  }

  // Busca sessão ativa
  const { data: sessionRow } = await admin.from("bot_sessions").select("*").eq("phone", phone).maybeSingle();

  // Se há sessão, continua o fluxo
  if (sessionRow && sessionRow.flow_id) {
    const { data: flowRow } = await admin.from("bot_flows").select("*").eq("id", sessionRow.flow_id).maybeSingle();
    if (flowRow) {
      const session: BotSession = {
        id: sessionRow.id,
        phone,
        user_id: profile.user_id,
        flow_id: flowRow.id,
        current_node_id: sessionRow.current_node_id,
        variables: sessionRow.variables || {},
      };
      const step = await continueSession(flowRow.graph, session, message, { profileName: profile.full_name });
      await persistAndReply(admin, channelId, phone, profile, step);
      return json({ ok: true, mode: "continue" });
    }
  }

  // Sem sessão: tenta match de trigger contra fluxos ativos
  const { data: flowsRows } = await admin.from("bot_flows")
    .select("id, name, triggers, graph, priority").eq("is_active", true);
  const flows: BotFlow[] = (flowsRows || []).map((r: any) => ({
    id: r.id, name: r.name, triggers: r.triggers || [], graph: r.graph, priority: r.priority || 0,
  }));
  const matched = matchFlow(flows, message);

  if (matched) {
    const step = await startSession(matched, phone, profile.user_id, { profileName: profile.full_name });
    await persistAndReply(admin, channelId, phone, profile, step);
    return json({ ok: true, mode: "start", flow: matched.name });
  }

  // Fallback: parser one-shot rotulado (comportamento antigo)
  const parsed = parseWhatsAppLog(message);
  if (parsed.ok && parsed.log && parsed.matched >= 4) {
    const date = todayBRT();
    const { data: existing } = await admin.from("score_daily_logs")
      .select("*").eq("user_id", profile.user_id).eq("date", date).maybeSingle();
    const merged: any = { user_id: profile.user_id, date };
    for (const f of SCORE_FIELDS) merged[f] = Number((parsed.log as any)[f] ?? existing?.[f]) || 0;
    await admin.from("score_daily_logs").upsert(merged, { onConflict: "user_id,date" });
    await admin.from("score_profiles").update({ inactivity_penalty_days: 0 }).eq("user_id", profile.user_id);
    const { score, label } = computeDayScore(merged);
    const streak = await computeStreak(admin, profile.user_id);
    const firstName = (profile.full_name || "").split(" ")[0] || "";
    const streakLine = streak >= 2 ? `\n🔥 Streak: ${streak} dias consecutivos!` : "";
    const reply = `Registrado ✅\n\nScore de hoje: ${score}/100 (${label})${streakLine}\n\nContinua firme${firstName ? `, ${firstName}` : ""}!`;
    if (channelId) {
      await sendWhatsApp(channelId, phone, reply);
      await admin.from("score_whatsapp_messages").insert({
        user_id: profile.user_id, phone, direction: "out", kind: "reply_ok",
        payload: { message: reply, score, label, streak },
      });
    }
    return json({ ok: true, mode: "bulk", score, label, streak });
  }

  // Nada casou: ajuda
  if (channelId) {
    const help = `Não entendi 🤔\n\nDiga *registrar* para começar o registro de hoje, ou *registrar do dia 12/03* para uma data específica (até 7 dias atrás).\n\nDigite *cancelar* a qualquer momento para sair.`;
    await sendWhatsApp(channelId, phone, help);
    await admin.from("score_whatsapp_messages").insert({
      user_id: profile.user_id, phone, direction: "out", kind: "reply_help", payload: { message: help },
    });
  }
  return json({ ok: false, error: "no match" });
});
