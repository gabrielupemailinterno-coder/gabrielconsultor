// Public proxy for the BotConversa lead webhook.
// Called from public forms; the actual webhook URL/token stays server-side
// in BOTCONVERSA_WEBHOOK_URL instead of being shipped in the client bundle.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const url = Deno.env.get("BOTCONVERSA_WEBHOOK_URL");
  if (!url) {
    return new Response(JSON.stringify({ error: "not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: any = {};
  try { body = await req.json(); } catch { /* empty */ }
  const nome = typeof body?.nome === "string" ? body.nome.slice(0, 200) : "";
  const telefone = typeof body?.telefone === "string" ? body.telefone.slice(0, 40) : "";
  if (!nome || !telefone) {
    return new Response(JSON.stringify({ error: "nome and telefone required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, telefone }),
    });
    return new Response(JSON.stringify({ ok: r.ok, status: r.status }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String((e as Error).message ?? e) }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
