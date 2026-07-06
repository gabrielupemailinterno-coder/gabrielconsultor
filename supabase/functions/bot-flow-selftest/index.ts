// Simula uma mensagem chegando no whatsapp-inbound sem depender da GPT Maker.
// Chamada pelo admin para testar rapidamente se um gatilho inicia o fluxo.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_TOKEN = Deno.env.get("GPT_MAKER_WEBHOOK_TOKEN");

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const auth = req.headers.get("Authorization") || "";
  const jwt = auth.replace(/^Bearer\s+/i, "");
  if (!jwt) return json({ error: "unauthorized" }, 401);
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: u } = await admin.auth.getUser(jwt);
  if (!u?.user) return json({ error: "unauthorized" }, 401);
  const { data: role } = await admin.from("user_roles").select("role")
    .eq("user_id", u.user.id).eq("role", "admin").maybeSingle();
  if (!role) return json({ error: "forbidden" }, 403);

  let body: any = {};
  try { body = await req.json(); } catch {}
  const phone: string = body.phone || "";
  const email: string = body.email || "";
  const message: string = body.message || "registrar";
  const resetSession: boolean = !!body.resetSession;
  if (!phone && !email) return json({ error: "phone ou email obrigatório" }, 400);

  // Limpa sessão para começar do zero no teste, se pedido
  if (resetSession && phone) {
    await admin.from("bot_sessions").delete().eq("phone", phone.replace(/\D/g, ""));
  }

  if (!WEBHOOK_TOKEN) return json({ error: "GPT_MAKER_WEBHOOK_TOKEN não configurado" }, 500);

  const url = `${SUPABASE_URL}/functions/v1/whatsapp-inbound?token=${encodeURIComponent(WEBHOOK_TOKEN)}`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, email, message }),
  });
  const t = await r.text();
  let parsed: any = null;
  try { parsed = JSON.parse(t); } catch { parsed = t; }
  return json({ ok: r.ok, status: r.status, inbound: parsed }, 200);
});
