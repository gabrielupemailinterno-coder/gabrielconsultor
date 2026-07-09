// deno-lint-ignore-file no-explicit-any
// Emits standardized meeting lifecycle events for the mentoring flow.
// Payload is always rebuilt server-side from the `meetings` + `mentees` rows,
// so callers cannot spoof the event body. Allowed events are hard-coded and
// non-destructive (fan-out to configured webhooks only).
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Fixed Meet link used by the mentoring practice.
const FIXED_MEET_LINK = "https://meet.google.com/ofe-ktpb-hgb";

const ALLOWED_KINDS = new Set(["scheduled", "completed"]);

function normalizePhoneBR(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) return `+${digits}`;
  if (digits.length === 10 || digits.length === 11) return `+55${digits}`;
  return `+${digits}`;
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

  const meetingId: string | undefined = body?.meeting_id;
  const kind: string | undefined = body?.kind;
  if (!meetingId || typeof meetingId !== "string") return json({ error: "meeting_id_required" }, 400);
  if (!kind || !ALLOWED_KINDS.has(kind)) return json({ error: "invalid_kind" }, 400);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: meeting, error } = await admin
    .from("meetings")
    .select("id, mentee_id, sequence, title, status, scheduled_at, meet_link")
    .eq("id", meetingId)
    .maybeSingle();
  if (error) return json({ error: error.message }, 500);
  if (!meeting) return json({ error: "meeting_not_found" }, 404);

  const { data: mentee } = await admin
    .from("mentees")
    .select("id, full_name, phone")
    .eq("id", meeting.mentee_id)
    .maybeSingle();
  if (!mentee) return json({ error: "mentee_not_found" }, 404);

  const eventKey = kind === "completed" ? "mentee.meeting_completed" : "mentee.meeting_scheduled";
  const payload: Record<string, unknown> = {
    nome: mentee.full_name || "",
    telefone_normalizado: normalizePhoneBR(mentee.phone),
  };
  if (kind === "scheduled") {
    // Agendamento agora acontece no BotConversa; mantido apenas para chamadas legadas.
    payload.link_meet = FIXED_MEET_LINK;
    payload.meeting_id = meeting.id;
    payload.sequence = meeting.sequence;
    payload.title = meeting.title;
    payload.scheduled_at = meeting.scheduled_at;
  }
  if (kind === "completed") {
    // Sem link_meet — o BotConversa gera um novo Meet a cada agendamento.
    payload.meeting_id = meeting.id;
    payload.sequence = meeting.sequence;
    payload.title = meeting.title;
  }

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
    return json({ ok: true, event: eventKey, dispatched: j?.dispatched ?? 0 });
  } catch (e) {
    return json({ ok: false, event: eventKey, error: String((e as any)?.message || e) }, 500);
  }
});
