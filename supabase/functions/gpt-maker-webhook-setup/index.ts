// Gerencia o webhook onNewMessage do agente GPT Maker.
// GET  -> retorna webhooks atualmente configurados no agente
// POST -> aponta o onNewMessage para o nosso whatsapp-inbound com o token
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const JWKS_URL = `${SUPABASE_URL}/auth/v1/.well-known/jwks.json`;
const GPT_TOKEN = Deno.env.get("GPT_MAKER_API_TOKEN");
const WEBHOOK_TOKEN = Deno.env.get("GPT_MAKER_WEBHOOK_TOKEN");

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function requireAdmin(req: Request): Promise<{ userId: string } | Response> {
  const auth = req.headers.get("Authorization") || "";
  const jwt = auth.replace(/^Bearer\s+/i, "");
  if (!jwt) return json({ error: "unauthorized" }, 401);
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: u, error } = await admin.auth.getUser(jwt);
  if (error || !u?.user) return json({ error: "unauthorized" }, 401);
  const { data: role } = await admin.from("user_roles").select("role").eq("user_id", u.user.id).eq("role", "admin").maybeSingle();
  if (!role) return json({ error: "forbidden" }, 403);
  return { userId: u.user.id };
}

async function getAgentId(userId: string): Promise<string | null> {
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data } = await admin
    .from("settings")
    .select("agent_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (data?.agent_id) return data.agent_id;

  // Fallback para projetos com mais de um admin: usa a configuração válida
  // mais recente, em vez de depender de um "primeiro admin" arbitrário.
  const { data: configured } = await admin
    .from("settings")
    .select("agent_id, updated_at")
    .not("agent_id", "is", null)
    .neq("agent_id", "")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return configured?.agent_id || null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const check = await requireAdmin(req);
  if (check instanceof Response) return check;
  if (!GPT_TOKEN) return json({ error: "GPT_MAKER_API_TOKEN não configurado" }, 500);
  if (!WEBHOOK_TOKEN) return json({ error: "GPT_MAKER_WEBHOOK_TOKEN não configurado" }, 500);

  const agentId = await getAgentId(check.userId);
  if (!agentId) return json({ error: "agent_id não configurado em settings" }, 400);

  const inboundUrl = `${SUPABASE_URL}/functions/v1/whatsapp-inbound?token=${encodeURIComponent(WEBHOOK_TOKEN)}`;

  if (req.method === "GET") {
    const r = await fetch(`https://api.gptmaker.ai/v2/agent/${agentId}/webhooks`, {
      headers: { Authorization: `Bearer ${GPT_TOKEN}` },
    });
    const t = await r.text();
    let parsed: any = null;
    try { parsed = JSON.parse(t); } catch { parsed = t; }
    return json({
      ok: r.ok,
      status: r.status,
      agentId,
      current: parsed,
      expected_url: inboundUrl,
      is_configured: !!(parsed?.onNewMessage && String(parsed.onNewMessage).includes("whatsapp-inbound")),
    }, r.ok ? 200 : 502);
  }

  if (req.method === "POST") {
    // Buscamos webhooks atuais para preservar outros campos
    const cur = await fetch(`https://api.gptmaker.ai/v2/agent/${agentId}/webhooks`, {
      headers: { Authorization: `Bearer ${GPT_TOKEN}` },
    });
    let currentBody: any = {};
    try { currentBody = await cur.json(); } catch { currentBody = {}; }

    const payload = { ...currentBody, onNewMessage: inboundUrl };
    const r = await fetch(`https://api.gptmaker.ai/v2/agent/${agentId}/webhooks`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${GPT_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const t = await r.text();
    return json({
      ok: r.ok,
      status: r.status,
      agentId,
      onNewMessage: inboundUrl,
      response: t.slice(0, 500),
    }, r.ok ? 200 : 502);
  }

  return json({ error: "method not allowed" }, 405);
});
