// deno-lint-ignore-file no-explicit-any
// Public endpoint that emits standardized events for a newly created lead.
// Anyone can call it, but the payload is always rebuilt server-side from the
// `leads` row so clients cannot spoof the event body. The allowed events are
// hard-coded and non-destructive (fan-out to configured webhooks only).
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function isScoreLead(lead: any): boolean {
  const p = String(lead.product_interest || "").toLowerCase();
  const l = String(lead.landing_page || "").toLowerCase();
  const s = String(lead.source_path || "").toLowerCase();
  return (
    p === "score_comercial" ||
    l === "score_comercial" ||
    s.startsWith("/scoreapp") ||
    s.includes("score")
  );
}

function buildPayload(eventName: string, lead: any) {
  return {
    event_name: eventName,
    lead_id: lead.id,
    name: lead.name,
    phone: lead.phone,
    phone_normalized: (lead.phone || "").replace(/\D/g, ""),
    profile_type: lead.answers?.profile || lead.answers?.profile_type || null,
    company: lead.company_name || null,
    product_interest: lead.product_interest || null,
    landing_page: lead.landing_page || null,
    source_path: lead.source_path || lead.source || null,
    partner_code: lead.partner_code || null,
    utm_source: lead.utm_source || null,
    utm_medium: lead.utm_medium || null,
    utm_campaign: lead.utm_campaign || null,
    utm_term: lead.utm_term || null,
    utm_content: lead.utm_content || null,
    created_at: lead.created_at,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  const leadId: string | undefined = body?.lead_id;
  if (!leadId || typeof leadId !== "string") {
    return json({ error: "lead_id_required" }, 400);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: lead, error } = await admin
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .maybeSingle();
  if (error) return json({ error: error.message }, 500);
  if (!lead) return json({ error: "lead_not_found" }, 404);

  // Always fire the generic event; add the Score-specific one when applicable.
  const events: string[] = ["lead.created"];
  if (isScoreLead(lead)) events.push("score.lead.created");

  const dispatched: Record<string, { count: number; error?: string }> = {};
  for (const eventKey of events) {
    const payload = buildPayload(eventKey, lead);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/integrations-dispatch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SERVICE_ROLE}`,
        },
        body: JSON.stringify({ event: eventKey, data: payload }),
      });
      const j = await res.json().catch(() => ({} as any));
      dispatched[eventKey] = { count: j?.dispatched ?? 0 };
    } catch (e) {
      dispatched[eventKey] = { count: 0, error: String((e as any)?.message || e) };
    }
  }

  return json({ ok: true, lead_id: leadId, events, dispatched });
});
