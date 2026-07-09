// deno-lint-ignore-file no-explicit-any
// POST /api/events — endpoint público autenticado por Bearer (DISPATCH_SECRET)
// para receber eventos de sistemas externos (ex.: BotConversa) e atualizar o
// estado interno + refazer o fan-out para os webhooks configurados.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DISPATCH_SECRET = Deno.env.get("DISPATCH_SECRET") || "";

function digitsOnly(v: unknown): string {
  return String(v ?? "").replace(/\D/g, "");
}

function normalizePhoneBR(raw: unknown): string | null {
  const d = digitsOnly(raw);
  if (!d) return null;
  if (d.startsWith("55") && (d.length === 12 || d.length === 13)) return `+${d}`;
  if (d.length === 10 || d.length === 11) return `+55${d}`;
  return `+${d}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  // Bearer auth
  const auth = req.headers.get("authorization") || "";
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  if (!DISPATCH_SECRET || token !== DISPATCH_SECRET) {
    return json({ error: "unauthorized" }, 401);
  }

  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }

  const eventType: string = String(body?.event_type || "").trim();
  if (!eventType) return json({ error: "event_type_required" }, 400);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  if (eventType === "mentee.meeting_scheduled") {
    const phoneNorm = normalizePhoneBR(body?.telefone_normalizado);
    const when = String(body?.meeting_datetime || "").trim();
    const link = String(body?.meeting_link || "").trim();
    if (!phoneNorm) return json({ error: "telefone_normalizado_required" }, 400);
    if (!when) return json({ error: "meeting_datetime_required" }, 400);
    if (!link) return json({ error: "meeting_link_required" }, 400);

    const whenDate = new Date(when);
    if (isNaN(whenDate.getTime())) return json({ error: "invalid_meeting_datetime" }, 400);

    // Find mentee by phone digits (index-friendly)
    const phoneDigits = digitsOnly(phoneNorm);
    const { data: mentees, error: findErr } = await admin
      .from("mentees")
      .select("id, full_name, phone")
      .not("phone", "is", null);
    if (findErr) return json({ error: findErr.message }, 500);
    const match = (mentees ?? []).find((m: any) => digitsOnly(m.phone) === phoneDigits
      || digitsOnly(m.phone).endsWith(phoneDigits.slice(-11)));
    if (!match) return json({ error: "mentee_not_found", telefone_normalizado: phoneNorm }, 404);

    const { error: updErr } = await admin
      .from("mentees")
      .update({
        next_meeting_at: whenDate.toISOString(),
        next_meeting_link: link,
        next_meeting_source: "botconversa",
      })
      .eq("id", match.id);
    if (updErr) return json({ error: updErr.message }, 500);

    // Fan-out to configured webhooks
    const dispatchPayload = {
      nome: match.full_name || "",
      telefone_normalizado: phoneNorm,
      meeting_datetime: whenDate.toISOString(),
      meeting_link: link,
      mentee_id: match.id,
      source: "botconversa",
    };
    let dispatched = 0;
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/integrations-dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE_ROLE}` },
        body: JSON.stringify({ event: "mentee.meeting_scheduled", data: dispatchPayload }),
      });
      const j = await res.json().catch(() => ({} as any));
      dispatched = j?.dispatched ?? 0;
    } catch { /* swallow */ }

    return json({
      ok: true,
      event: "mentee.meeting_scheduled",
      mentee_id: match.id,
      next_meeting_at: whenDate.toISOString(),
      dispatched,
    });
  }

  // Generic manual event fan-out (kept from testing docs)
  const eventName = eventType;
  const payload = body?.payload ?? {};
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/integrations-dispatch`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE_ROLE}` },
      body: JSON.stringify({ event: eventName, data: payload }),
    });
    const j = await res.json().catch(() => ({} as any));
    return json({ ok: true, event: eventName, dispatched: j?.dispatched ?? 0 });
  } catch (e) {
    return json({ ok: false, error: String((e as any)?.message || e) }, 500);
  }
});
