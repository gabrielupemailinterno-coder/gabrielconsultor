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
  if (!r.ok) throw new Error(`HTTP ${r.status} on ${path}: ${text.slice(0, 200)}`);
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (!TOKEN) return json({ error: "GPT_MAKER_API_TOKEN não configurado" }, 400);

  console.log("[discover] token len=", TOKEN.length, "prefix=", TOKEN.slice(0, 6), "suffix=", TOKEN.slice(-4), "hasSpace=", /\s/.test(TOKEN));

  try {
    const wsResp = await api("/v2/workspaces");
    const workspaces: any[] = Array.isArray(wsResp) ? wsResp : wsResp.data ?? wsResp.workspaces ?? [];
    const channels: any[] = [];
    const agents: any[] = [];

    for (const ws of workspaces) {
      const wsId = ws.id ?? ws.workspaceId;
      if (!wsId) continue;
      try {
        const chResp = await api(`/v2/workspace/${wsId}/channels?page=1&pageSize=50`);
        const list: any[] = Array.isArray(chResp) ? chResp : chResp.data ?? chResp.items ?? [];
        for (const c of list)
          channels.push({
            id: c.id,
            name: c.name ?? c.title ?? "(sem nome)",
            type: c.type ?? null,
            workspaceId: wsId,
          });
      } catch (_) {}
      try {
        const agResp = await api(`/v2/workspace/${wsId}/agents?page=1&pageSize=50`);
        const list: any[] = Array.isArray(agResp) ? agResp : agResp.data ?? agResp.items ?? [];
        for (const a of list)
          agents.push({
            id: a.id,
            name: a.name ?? "(sem nome)",
            type: a.type ?? null,
            workspaceId: wsId,
          });
      } catch (_) {}
    }

    return json({
      workspaces: workspaces.map((w: any) => ({ id: w.id ?? w.workspaceId, name: w.name })),
      channels,
      agents,
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
