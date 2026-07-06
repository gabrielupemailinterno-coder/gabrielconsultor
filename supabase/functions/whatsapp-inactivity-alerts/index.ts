// Cron 10h BRT (13:00 UTC) diário: alertas para inatividade de 2, 5 e 10 dias.
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendWhatsApp, normalizePhone, todayBRT } from "../_shared/gpt-maker.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const DEFAULTS: Record<string, string> = {
  alert_2: `{{nome}}, você está há 2 dias sem atualizar seu Score.

Sem número, você volta a vender no achismo. Registra rapidinho agora e mantém sua sequência.`,
  alert_5: `{{nome}}, seu diagnóstico está ficando incompleto — 5 dias sem registro.

Quer voltar hoje com um registro rápido? Manda os números aqui ou registra em https://gabrielconsultor.com/scoreapp/registrar`,
  alert_10: `{{nome}}, seu Score caiu porque você ficou 10 dias sem atualizar.

O sistema começou a penalizar sua nota. Bora recuperar? Responde aqui mesmo com seus números de hoje.`,
};

function json(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function daysSince(dateISO: string | null, today: string): number {
  if (!dateISO) return 9999;
  const a = new Date(dateISO + "T00:00:00Z").getTime();
  const b = new Date(today + "T00:00:00Z").getTime();
  return Math.max(0, Math.round((b - a) / 86400000));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const testPhone = req.method === "POST" ? (await req.json().catch(() => ({}))).testPhone : null;

  const { data: adminRole } = await admin.from("user_roles").select("user_id").eq("role", "admin").limit(1).maybeSingle();
  const { data: settings } = await admin.from("settings").select("*").eq("user_id", adminRole?.user_id).maybeSingle();
  if (!settings?.channel_id) return json({ error: "channel_id not configured" }, 400);
  if (!testPhone && !settings.whatsapp_ritual_enabled) return json({ ok: true, skipped: "ritual disabled" });

  const templates = (settings.whatsapp_templates as any) || {};
  const today = todayBRT();
  const delay = (settings.delay_seconds ?? 3) * 1000;

  if (testPhone) {
    const phone = normalizePhone(testPhone);
    const out: any[] = [];
    for (const kind of ["alert_2", "alert_5", "alert_10"]) {
      const msg = (templates[kind] || DEFAULTS[kind]).replaceAll("{{nome}}", "amigo");
      const r = await sendWhatsApp(settings.channel_id, phone, msg);
      await admin.from("score_whatsapp_messages").insert({
        phone, direction: "out", kind: `${kind}_test`,
        payload: { message: msg }, error: r.ok ? null : r.error,
      });
      out.push({ kind, ok: r.ok, error: r.error });
      if (delay > 0) await sleep(delay);
    }
    return json({ ok: true, test: true, results: out });
  }

  const { data: profiles } = await admin
    .from("score_profiles")
    .select("user_id, full_name, phone")
    .eq("whatsapp_opt_in", true)
    .not("phone", "is", null);

  const results: any[] = [];

  for (const p of (profiles ?? []) as any[]) {
    const phone = normalizePhone(p.phone || "");
    if (!phone) continue;

    const { data: lastLog } = await admin
      .from("score_daily_logs").select("date")
      .eq("user_id", p.user_id).order("date", { ascending: false }).limit(1).maybeSingle();
    const days = daysSince(lastLog?.date ?? null, today);

    let kind: string | null = null;
    if (days === 10) kind = "alert_10";
    else if (days === 5) kind = "alert_5";
    else if (days === 2) kind = "alert_2";
    if (!kind) continue;

    // Deduplicação: já mandou esse alerta nas últimas 24h?
    const since = new Date(Date.now() - 22 * 3600 * 1000).toISOString();
    const { data: dup } = await admin
      .from("score_whatsapp_messages").select("id")
      .eq("user_id", p.user_id).eq("kind", kind).gte("created_at", since).limit(1);
    if (dup && dup.length > 0) continue;

    if (kind === "alert_10") {
      await admin.from("score_profiles").update({ inactivity_penalty_days: days }).eq("user_id", p.user_id);
    }

    const first = (p.full_name || "").split(" ")[0] || "";
    const template = templates[kind] || DEFAULTS[kind];
    const msg = template.replaceAll("{{nome}}", first);
    const r = await sendWhatsApp(settings.channel_id, phone, msg);
    await admin.from("score_whatsapp_messages").insert({
      user_id: p.user_id, phone, direction: "out", kind,
      payload: { message: msg, days }, error: r.ok ? null : r.error,
    });
    results.push({ user_id: p.user_id, kind, days, ok: r.ok });
    if (delay > 0) await sleep(delay);
  }

  return json({ ok: true, alerts: results.length, results });
});
