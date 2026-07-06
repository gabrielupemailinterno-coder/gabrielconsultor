// Liga/desliga o agente da GPT Maker.
// GET  -> retorna status atual (isActive)
// POST { active: boolean } -> ativa ou inativa o agente
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GPT_TOKEN = Deno.env.get("GPT_MAKER_API_TOKEN");

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
  const { data: role } = await admin
    .from("user_roles").select("role")
    .eq("user_id", u.user.id).eq("role", "admin").maybeSingle();
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

  const agentId = await getAgentId(check.userId);
  if (!agentId) return json({ error: "agent_id não configurado em settings" }, 400);

  if (req.method === "GET") {
    const r = await fetch(`https://api.gptmaker.ai/v2/agent/${agentId}`, {
      headers: { Authorization: `Bearer ${GPT_TOKEN}` },
    });
    const t = await r.text();
    let parsed: any = null;
    try { parsed = JSON.parse(t); } catch { parsed = t; }
    const isActive = !!(parsed?.isActive ?? parsed?.active);
    return json({ ok: r.ok, status: r.status, agentId, isActive, raw: parsed }, r.ok ? 200 : 502);
  }

  if (req.method === "POST") {
    let body: any = {};
    try { body = await req.json(); } catch {}
    const active = !!body?.active;

    // 1) Checa estado atual — evita chamar a API se já está no estado desejado
    // (GPT Maker responde 500 "System Error" em transições no-op).
    try {
      const cur = await fetch(`https://api.gptmaker.ai/v2/agent/${agentId}`, {
        headers: { Authorization: `Bearer ${GPT_TOKEN}` },
      });
      const ct = await cur.text();
      let cparsed: any = null;
      try { cparsed = JSON.parse(ct); } catch {}
      const currentActive = !!(cparsed?.isActive ?? cparsed?.active);
      if (cur.ok && currentActive === active) {
        return json({ ok: true, status: 200, agentId, active, noop: true, response: "already in desired state" });
      }
    } catch { /* segue para o PUT */ }

    const path = active ? "active" : "inactive";
    const r = await fetch(`https://api.gptmaker.ai/v2/agent/${agentId}/${path}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${GPT_TOKEN}` },
    });
    const t = await r.text();

    // Se falhou, revalida — se agora está no estado alvo, considera sucesso.
    if (!r.ok) {
      try {
        const verify = await fetch(`https://api.gptmaker.ai/v2/agent/${agentId}`, {
          headers: { Authorization: `Bearer ${GPT_TOKEN}` },
        });
        const vt = await verify.text();
        let vparsed: any = null;
        try { vparsed = JSON.parse(vt); } catch {}
        const nowActive = !!(vparsed?.isActive ?? vparsed?.active);
        if (verify.ok && nowActive === active) {
          return json({ ok: true, status: 200, agentId, active, recovered: true, response: t.slice(0, 300) });
        }
      } catch { /* cai no retorno de erro */ }
    }

    return json({ ok: r.ok, status: r.status, agentId, active, response: t.slice(0, 500) }, r.ok ? 200 : 502);
  }

  return json({ error: "method not allowed" }, 405);
});
