import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const TOKEN = Deno.env.get("GPT_MAKER_API_TOKEN");

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "missing auth" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "unauthorized" }, 401);
    const userId = userData.user.id;

    if (!TOKEN) return json({ error: "GPT_MAKER_API_TOKEN não configurado" }, 400);
    const { contactId } = await req.json();
    if (!contactId) return json({ error: "contactId required" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: contact } = await admin
      .from("contacts")
      .select("*, campaigns(*)")
      .eq("id", contactId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!contact) return json({ error: "contact not found" }, 404);
    if (contact.status === "sent") return json({ ok: true, skipped: true });

    const campaign = (contact as any).campaigns;
    if (campaign.status === "cancelled") {
      await admin.from("contacts").update({ status: "cancelled" }).eq("id", contactId);
      return json({ ok: true, cancelled: true });
    }

    const { data: settings } = await admin
      .from("settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (!settings?.channel_id) return json({ error: "channel_id não configurado" }, 400);

    let message: string = campaign.message;
    message = message
      .replaceAll("{{nome}}", contact.name ?? "")
      .replaceAll("{{telefone}}", contact.phone_e164)
      .replaceAll("{{empresa}}", contact.empresa ?? "");
    if (campaign.add_optout && settings.optout_text) {
      message = `${message}\n\n${settings.optout_text}`;
    }

    const url = `https://api.gptmaker.ai/v2/channel/${settings.channel_id}/start-conversation`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    let apiOk = false;
    let errorMsg: string | null = null;
    try {
      const resp = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({ phone: contact.phone_e164, message }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const text = await resp.text();
      if (!resp.ok) errorMsg = `HTTP ${resp.status}: ${text.slice(0, 300)}`;
      else {
        try {
          apiOk = JSON.parse(text).success !== false;
        } catch {
          apiOk = true;
        }
      }
    } catch (e) {
      errorMsg = e instanceof Error ? (e.name === "AbortError" ? "timeout" : e.message) : String(e);
    }

    if (apiOk) {
      await admin
        .from("contacts")
        .update({ status: "sent", sent_at: new Date().toISOString(), error_message: null })
        .eq("id", contactId);
      const { data: fresh } = await admin
        .from("campaigns")
        .select("sent_count")
        .eq("id", campaign.id)
        .maybeSingle();
      await admin
        .from("campaigns")
        .update({ sent_count: (fresh?.sent_count ?? 0) + 1 })
        .eq("id", campaign.id);
      await admin.from("campaign_logs").insert({
        campaign_id: campaign.id,
        contact_id: contactId,
        user_id: userId,
        status: "sent",
        message: "enviado",
      });
      return json({ ok: true });
    } else {
      await admin
        .from("contacts")
        .update({ status: "error", error_message: errorMsg ?? "erro desconhecido" })
        .eq("id", contactId);
      const { data: freshE } = await admin
        .from("campaigns")
        .select("error_count")
        .eq("id", campaign.id)
        .maybeSingle();
      await admin
        .from("campaigns")
        .update({ error_count: (freshE?.error_count ?? 0) + 1 })
        .eq("id", campaign.id);
      await admin.from("campaign_logs").insert({
        campaign_id: campaign.id,
        contact_id: contactId,
        user_id: userId,
        status: "error",
        message: errorMsg,
      });
      return json({ ok: false, error: errorMsg }, 200);
    }
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
