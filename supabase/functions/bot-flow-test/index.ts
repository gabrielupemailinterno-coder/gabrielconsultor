// Simula a execução de um fluxo enviando as mensagens dele passo-a-passo para
// um número de teste (sem consumir input do usuário).
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendWhatsApp, normalizePhone } from "../_shared/gpt-maker.ts";
import { BotFlow, startSession } from "../_shared/bot-engine.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const { flowId, phone, name } = await req.json();
  if (!flowId || !phone) {
    return new Response(JSON.stringify({ error: "flowId and phone required" }), { status: 400, headers: corsHeaders });
  }

  const { data: flowRow } = await admin.from("bot_flows").select("*").eq("id", flowId).maybeSingle();
  if (!flowRow) return new Response(JSON.stringify({ error: "flow not found" }), { status: 404, headers: corsHeaders });

  const { data: adminRole } = await admin.from("user_roles").select("user_id").eq("role", "admin").limit(1).maybeSingle();
  const { data: settings } = await admin.from("settings").select("channel_id, delay_seconds")
    .eq("user_id", adminRole?.user_id).maybeSingle();
  const channelId = settings?.channel_id;
  if (!channelId) return new Response(JSON.stringify({ error: "channel_id not configured" }), { status: 400, headers: corsHeaders });

  const normalized = normalizePhone(phone);
  const flow: BotFlow = { id: flowRow.id, name: flowRow.name, triggers: flowRow.triggers, graph: flowRow.graph, priority: 0 };

  // Executa só até a primeira pergunta (ou fim) — mesmo comportamento real do bot.
  const step = await startSession(flow, normalized, adminRole?.user_id || null, { profileName: name || "Teste" });

  const sent: string[] = [];
  for (const msg of step.messages) {
    const preview = `[TESTE ${flow.name}]\n\n${msg}`;
    await sendWhatsApp(channelId, normalized, preview);
    sent.push(preview);
    await new Promise((r) => setTimeout(r, (settings?.delay_seconds ?? 2) * 1000));
  }
  return new Response(JSON.stringify({ ok: true, sent }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
