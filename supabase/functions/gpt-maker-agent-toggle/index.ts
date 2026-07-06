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

function parseJsonOrText(text: string): any {
  try { return JSON.parse(text); } catch { return text; }
}

function extractActive(payload: any): boolean | null {
  const seen = new Set<any>();
  const visit = (value: any): boolean | null => {
    if (!value || typeof value !== "object" || seen.has(value)) return null;
    seen.add(value);

    for (const key of ["isActive", "active", "enabled", "activated"]) {
      if (typeof value[key] === "boolean") return value[key];
      if (typeof value[key] === "string") {
        const normalized = value[key].trim().toLowerCase();
        if (["true", "active", "enabled", "1"].includes(normalized)) return true;
        if (["false", "inactive", "disabled", "0"].includes(normalized)) return false;
      }
    }

    for (const key of ["status", "state"]) {
      if (typeof value[key] === "string") {
        const normalized = value[key].trim().toLowerCase();
        if (["active", "enabled", "online", "running"].includes(normalized)) return true;
        if (["inactive", "disabled", "offline", "stopped"].includes(normalized)) return false;
      }
    }

    for (const child of Object.values(value)) {
      const found = visit(child);
      if (found !== null) return found;
    }
    return null;
  };
  return visit(payload);
}

async function readAgent(agentId: string): Promise<{ ok: boolean; status: number; active: boolean | null; raw: any }> {
  const r = await fetch(`https://api.gptmaker.ai/v2/agent/${agentId}`, {
    headers: { Authorization: `Bearer ${GPT_TOKEN}` },
  });
  const text = await r.text();
  const raw = parseJsonOrText(text);
  return { ok: r.ok, status: r.status, active: extractActive(raw), raw };
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
    const agent = await readAgent(agentId);
    return json({ ok: agent.ok, status: agent.status, agentId, isActive: agent.active, raw: agent.raw }, agent.ok ? 200 : 200);
  }

  if (req.method === "POST") {
    let body: any = {};
    try { body = await req.json(); } catch {}
    const active = !!body?.active;

    // 1) Checa estado atual — evita chamar a API se já está no estado desejado
    // (GPT Maker responde 500 "System Error" em transições no-op).
    let currentActive: boolean | null = null;
    try {
      const cur = await readAgent(agentId);
      currentActive = cur.active;
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
        const verify = await readAgent(agentId);
        const nowActive = verify.active;
        if (verify.ok && nowActive === active) {
          return json({ ok: true, status: 200, agentId, active, recovered: true, response: t.slice(0, 300) });
        }
        if (r.status >= 500 && active === true && (nowActive === true || currentActive === true || nowActive === null)) {
          return json({ ok: false, status: r.status, agentId, active, isActive: nowActive ?? currentActive, fallback: true, response: t.slice(0, 500) });
        }
      } catch { /* cai no retorno de erro */ }
    }

    return json({ ok: r.ok, status: r.status, agentId, active, isActive: active, fallback: !r.ok, response: t.slice(0, 500) }, r.ok ? 200 : 200);
  }

  return json({ error: "method not allowed" }, 405);
});
