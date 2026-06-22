import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const GOOGLE_DRIVE_API_KEY = Deno.env.get("GOOGLE_DRIVE_API_KEY")!;

function pad(n: number) { return String(n).padStart(2, "0"); }
function toICSDate(d: Date) {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}
function escapeICS(s: string) {
  return (s || "").replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { meeting_id } = await req.json();
    if (!meeting_id) {
      return new Response(JSON.stringify({ error: "meeting_id obrigatório" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: meeting, error: mErr } = await supabase
      .from("meetings")
      .select("id, title, description, scheduled_at, meet_link, mentee_id")
      .eq("id", meeting_id)
      .maybeSingle();
    if (mErr || !meeting) {
      return new Response(JSON.stringify({ error: "Encontro não encontrado" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!meeting.scheduled_at) {
      return new Response(JSON.stringify({ error: "Encontro ainda não agendado" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: mentee } = await supabase.from("mentees").select("full_name, email").eq("id", meeting.mentee_id).maybeSingle();

    const start = new Date(meeting.scheduled_at);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const summary = `${meeting.title}${mentee?.full_name ? ` — ${mentee.full_name}` : ""}`;
    const descParts = [meeting.description ?? "", meeting.meet_link ? `Meet: ${meeting.meet_link}` : ""].filter(Boolean).join("\n");

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Gabriel Vieira//Mentoria//PT-BR",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${meeting.id}@gabrielconsultor.com`,
      `DTSTAMP:${toICSDate(new Date())}`,
      `DTSTART:${toICSDate(start)}`,
      `DTEND:${toICSDate(end)}`,
      `SUMMARY:${escapeICS(summary)}`,
      `DESCRIPTION:${escapeICS(descParts)}`,
      meeting.meet_link ? `URL:${meeting.meet_link}` : "",
      mentee?.email ? `ATTENDEE;CN=${escapeICS(mentee.full_name || mentee.email)}:mailto:${mentee.email}` : "",
      "END:VEVENT",
      "END:VCALENDAR",
    ].filter(Boolean).join("\r\n");

    const fileName = `${summary.replace(/[\\/:*?"<>|]/g, "-")}.ics`;
    const boundary = "lovable_boundary_" + crypto.randomUUID();
    const metadata = { name: fileName, mimeType: "text/calendar" };

    const body =
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: text/calendar; charset=UTF-8\r\n\r\n` +
      `${ics}\r\n` +
      `--${boundary}--`;

    const driveRes = await fetch(
      "https://connector-gateway.lovable.dev/google_drive/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": GOOGLE_DRIVE_API_KEY,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body,
      }
    );
    const driveJson = await driveRes.json();
    if (!driveRes.ok) {
      console.error("Drive upload failed", driveRes.status, driveJson);
      return new Response(JSON.stringify({ error: "Falha ao enviar para o Drive", details: driveJson }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ ok: true, file: driveJson }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
