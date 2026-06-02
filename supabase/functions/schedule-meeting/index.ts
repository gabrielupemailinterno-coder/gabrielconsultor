import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const GATEWAY = "https://connector-gateway.lovable.dev/google_calendar/calendar/v3";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "unauthorized" }, 401);
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: claims } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (!claims?.claims) return json({ error: "unauthorized" }, 401);

    const { meeting_id, scheduled_at, mentee_email } = await req.json();
    if (!meeting_id || !scheduled_at || !mentee_email) return json({ error: "missing fields" }, 400);

    // Fetch the meeting (RLS ensures mentee owns it)
    const { data: meeting, error: mErr } = await supabase
      .from("meetings").select("id,title,description,mentee_id").eq("id", meeting_id).single();
    if (mErr || !meeting) return json({ error: "meeting not found" }, 404);

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const calKey = Deno.env.get("GOOGLE_CALENDAR_API_KEY");

    if (!lovableKey || !calKey) {
      // Connector not linked yet — save schedule without calendar event
      await supabase.from("meetings").update({ scheduled_at, status: "scheduled" }).eq("id", meeting_id);
      return json({ ok: true, calendar_skipped: true, reason: "google_calendar connector not linked" });
    }

    const start = new Date(scheduled_at);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const event = {
      summary: meeting.title,
      description: meeting.description ?? "Mentoria Comercial 1:1",
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
      attendees: [{ email: mentee_email }],
      conferenceData: {
        createRequest: { requestId: `mt-${meeting_id}-${Date.now()}`, conferenceSolutionKey: { type: "hangoutsMeet" } },
      },
    };

    const calRes = await fetch(`${GATEWAY}/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": calKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    });
    const calData = await calRes.json();
    if (!calRes.ok) {
      console.error("calendar error", calRes.status, calData);
      throw new Error("calendar: " + JSON.stringify(calData));
    }

    const meetLink = calData.hangoutLink ?? calData.conferenceData?.entryPoints?.find((e: any) => e.entryPointType === "video")?.uri ?? null;

    await supabase.from("meetings").update({
      scheduled_at, status: "scheduled", google_event_id: calData.id, meet_link: meetLink,
    }).eq("id", meeting_id);

    return json({ ok: true, google_event_id: calData.id, meet_link: meetLink });
  } catch (err) {
    console.error("schedule-meeting error", err);
    return json({ error: String((err as Error).message ?? err) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
