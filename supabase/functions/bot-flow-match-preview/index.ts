// Recebe { message } e retorna qual fluxo/gatilho casaria, sem executar nada.
// Útil para debugar por que uma frase não está disparando o fluxo esperado.
import { createClient } from "npm:@supabase/supabase-js@2";
import { BotFlow, matchFlowDebug } from "../_shared/bot-engine.ts";
import { requireAdminOrService } from "../_shared/require-admin.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const authCheck = await requireAdminOrService(req, corsHeaders);
  if (authCheck instanceof Response) return authCheck;

  let body: any;
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "invalid json" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const message = String(body?.message ?? "");
  if (!message) {
    return new Response(JSON.stringify({ error: "message required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: flowsRows } = await admin.from("bot_flows")
    .select("id, name, triggers, graph, priority, is_active").eq("is_active", true);
  const flows: BotFlow[] = (flowsRows || []).map((r: any) => ({
    id: r.id, name: r.name, triggers: r.triggers || [], graph: r.graph, priority: r.priority || 0,
  }));

  const md = matchFlowDebug(flows, message);
  return new Response(JSON.stringify({
    ok: true,
    message,
    matched: md ? { flow_id: md.flow.id, flow_name: md.flow.name, priority: md.flow.priority, trigger: md.trigger } : null,
    checked_flows: flows
      .sort((a, b) => b.priority - a.priority)
      .map((f) => ({ id: f.id, name: f.name, priority: f.priority, triggers: f.triggers })),
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
