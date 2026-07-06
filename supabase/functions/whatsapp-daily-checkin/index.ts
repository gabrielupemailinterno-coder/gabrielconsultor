// Cron 18h BRT (21:00 UTC) seg-sab: manda check-in para quem opted-in e ainda não registrou hoje.
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendWhatsApp, normalizePhone, todayBRT } from "../_shared/gpt-maker.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const DEFAULT_TEMPLATE = `Fala {{nome}}! Bora fechar seu Score de hoje?

Responde nesse formato (ou só os números na ordem):

Ligações: 
WhatsApps: 
Reuniões: 
Apresentações: 
Propostas: 
Vendas: 
Valor vendido: 

Se não vendeu hoje, manda "0".`;

function json(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const testPhone = req.method === "POST" ? (await req.json().catch(() => ({}))).testPhone : null;

  const { data: adminRole } = await admin.from("user_roles").select("user_id").eq("role", "admin").limit(1).maybeSingle();
  if (!adminRole) return json({ error: "no admin" }, 400);
  const { data: settings } = await admin.from("settings").select("*").eq("user_id", adminRole.user_id).maybeSingle();
  if (!settings?.channel_id) return json({ error: "channel_id not configured" }, 400);
  if (!testPhone && !settings.whatsapp_ritual_enabled) return json({ ok: true, skipped: "ritual disabled" });

  const templates = (settings.whatsapp_templates as any) || {};
  const template: string = templates.checkin || DEFAULT_TEMPLATE;
  const today = todayBRT();

  if (testPhone) {
    const msg = template.replaceAll("{{nome}}", "amigo");
    const r = await sendWhatsApp(settings.channel_id, normalizePhone(testPhone), msg);
    await admin.from("score_whatsapp_messages").insert({
      phone: normalizePhone(testPhone), direction: "out", kind: "checkin_test",
      payload: { message: msg }, error: r.ok ? null : r.error,
    });
    return json(r);
  }

  const { data: profiles } = await admin
    .from("score_profiles")
    .select("user_id, full_name, phone, whatsapp_opt_in")
    .eq("whatsapp_opt_in", true)
    .not("phone", "is", null);

  const results: any[] = [];
  const delay = (settings.delay_seconds ?? 3) * 1000;

  for (const p of (profiles ?? []) as any[]) {
    const phone = normalizePhone(p.phone || "");
    if (!phone) continue;
    // Pulou se já registrou hoje
    const { data: existing } = await admin
      .from("score_daily_logs")
      .select("id").eq("user_id", p.user_id).eq("date", today).maybeSingle();
    if (existing) { results.push({ user_id: p.user_id, skipped: "already logged" }); continue; }

    const first = (p.full_name || "").split(" ")[0] || "";
    const msg = template.replaceAll("{{nome}}", first);
    const r = await sendWhatsApp(settings.channel_id, phone, msg);
    await admin.from("score_whatsapp_messages").insert({
      user_id: p.user_id, phone, direction: "out", kind: "checkin",
      payload: { message: msg }, error: r.ok ? null : r.error,
    });
    if (r.ok) {
      await admin.from("score_profiles").update({ whatsapp_last_checkin_at: new Date().toISOString() }).eq("user_id", p.user_id);
    }
    results.push({ user_id: p.user_id, ok: r.ok, error: r.error });
    if (delay > 0) await sleep(delay);
  }

  return json({ ok: true, sent: results.length, results });
});
