const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const TOKEN = Deno.env.get("GPT_MAKER_API_TOKEN");

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function api(path: string) {
  const r = await fetch(`https://api.gptmaker.ai${path}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  const text = await r.text();
  return { ok: r.ok, status: r.status, body: text };
}

import { requireAdminOrService } from "../_shared/require-admin.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  // Admin-only utility: exposes contact identifiers (phone numbers) from GPT Maker.
  const auth = await requireAdminOrService(req, corsHeaders);
  if (auth instanceof Response) return auth;
  if (!TOKEN) return json({ error: "GPT_MAKER_API_TOKEN não configurado" }, 400);


  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").toLowerCase().trim();
  const groupsOnly = url.searchParams.get("groups") !== "0";

  try {
    const wsResp = await api("/v2/workspaces");
    if (!wsResp.ok) return json({ error: `workspaces: HTTP ${wsResp.status}` }, 500);
    const workspaces: any[] = (() => {
      try {
        const j = JSON.parse(wsResp.body);
        return Array.isArray(j) ? j : j.data ?? j.workspaces ?? [];
      } catch {
        return [];
      }
    })();

    const matches: any[] = [];
    const debug: any[] = [];

    for (const ws of workspaces) {
      const wsId = ws.id ?? ws.workspaceId;
      if (!wsId) continue;
      let page = 1;
      while (page <= 5) {
        const path = `/v2/workspace/${wsId}/chats?page=${page}&pageSize=100`;
        const r = await api(path);
        let chats: any[] = [];
        try {
          const j = JSON.parse(r.body);
          chats = Array.isArray(j) ? j : j.data ?? j.items ?? [];
        } catch {}
        debug.push({ path, status: r.status, count: chats.length });
        if (!r.ok || chats.length === 0) break;
        for (const c of chats) {
          const id = c.id ?? c.chatId;
          const name = c.name ?? c.title ?? "(sem nome)";
          const isGroup = (typeof id === "string" && id.endsWith("@g.us")) || c.isGroup === true;
          if (groupsOnly && !isGroup) continue;
          if (q && !name.toLowerCase().includes(q)) continue;
          matches.push({
            id,
            name,
            type: isGroup ? "group" : "individual",
            isGroup,
            workspaceId: wsId,
          });
        }
        if (chats.length < 100) break;
        page++;
      }
    }

    return json({ total: matches.length, matches, debug });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
