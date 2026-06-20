import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TOKEN = Deno.env.get("GPT_MAKER_API_TOKEN");

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function sendToPhone(channelId: string, phone: string, message: string) {
  try {
    const r = await fetch(`https://api.gptmaker.ai/v2/channel/${channelId}/start-conversation`, {
      method: "POST",
      headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ phone, message }),
    });
    const t = await r.text();
    return r.ok ? { ok: true } : { ok: false, error: `HTTP ${r.status}: ${t.slice(0, 300)}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

async function sendToGroup(chatId: string, message: string) {
  try {
    const r = await fetch(
      `https://api.gptmaker.ai/v2/chat/${encodeURIComponent(chatId)}/send-message`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      },
    );
    const t = await r.text();
    return r.ok ? { ok: true } : { ok: false, error: `HTTP ${r.status}: ${t.slice(0, 300)}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (!TOKEN) return json({ error: "GPT_MAKER_API_TOKEN não configurado" }, 400);

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: due, error } = await admin
    .from("campaign_steps")
    .select("*, campaigns(*)")
    .eq("status", "pending")
    .lte("scheduled_at", new Date().toISOString())
    .limit(20);
  if (error) return json({ error: error.message }, 500);
  if (!due || due.length === 0) return json({ ok: true, processed: 0 });

  const results: any[] = [];
  for (const step of due) {
    const camp = (step as any).campaigns;
    if (!camp || camp.status === "cancelled" || camp.status === "paused") continue;
    await admin.from("campaign_steps").update({ status: "sending" }).eq("id", step.id);

    const { data: settings } = await admin
      .from("settings")
      .select("*")
      .eq("user_id", step.user_id)
      .maybeSingle();
    if (!settings?.channel_id) {
      await admin
        .from("campaign_steps")
        .update({ status: "error", error_message: "channel_id não configurado" })
        .eq("id", step.id);
      continue;
    }

    let msg = step.message as string;
    if (step.add_optout && settings.optout_text) msg = `${msg}\n\n${settings.optout_text}`;

    let okCount = 0;
    let errCount = 0;
    let lastErr: string | null = null;

    if (camp.destination_type === "group" && camp.group_id) {
      const r = await sendToGroup(camp.group_id, msg);
      if (r.ok) okCount = 1;
      else {
        errCount = 1;
        lastErr = r.error ?? null;
      }
      await admin.from("campaign_logs").insert({
        campaign_id: camp.id,
        user_id: step.user_id,
        status: r.ok ? "sent" : "error",
        message: r.ok ? `passo ${step.step_order} → grupo` : `passo ${step.step_order} grupo: ${r.error}`,
      });
    } else {
      const { data: contacts } = await admin
        .from("contacts")
        .select("*")
        .eq("campaign_id", camp.id);
      const delay = (settings.delay_seconds ?? 3) * 1000;
      for (const c of contacts ?? []) {
        const m = msg
          .replaceAll("{{nome}}", c.name ?? "")
          .replaceAll("{{telefone}}", c.phone_e164)
          .replaceAll("{{empresa}}", c.empresa ?? "");
        const r = await sendToPhone(settings.channel_id, c.phone_e164, m);
        if (r.ok) {
          okCount++;
          await admin
            .from("contacts")
            .update({ status: "sent", sent_at: new Date().toISOString() })
            .eq("id", c.id);
        } else {
          errCount++;
          lastErr = r.error ?? null;
          await admin
            .from("contacts")
            .update({ status: "error", error_message: r.error })
            .eq("id", c.id);
        }
        await admin.from("campaign_logs").insert({
          campaign_id: camp.id,
          contact_id: c.id,
          user_id: step.user_id,
          status: r.ok ? "sent" : "error",
          message: r.ok ? `passo ${step.step_order}` : `passo ${step.step_order}: ${r.error}`,
        });
        if (delay > 0) await sleep(delay);
      }
    }

    await admin
      .from("campaign_steps")
      .update({
        status: errCount > 0 && okCount === 0 ? "error" : "sent",
        sent_at: new Date().toISOString(),
        error_message: lastErr,
      })
      .eq("id", step.id);

    const { data: remaining } = await admin
      .from("campaign_steps")
      .select("id")
      .eq("campaign_id", camp.id)
      .eq("status", "pending");
    if (!remaining || remaining.length === 0) {
      await admin.from("campaigns").update({ status: "done" }).eq("id", camp.id);
    }
    results.push({ step: step.id, okCount, errCount });
  }

  return json({ ok: true, processed: results.length, results });
});
