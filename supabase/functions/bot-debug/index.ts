// Debug: retorna últimas mensagens e sessão do bot para um telefone.
import { createClient } from "npm:@supabase/supabase-js@2";
import { normalizePhone } from "../_shared/gpt-maker.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const url = new URL(req.url);
  const rawPhone = url.searchParams.get("phone") || "";
  const phone = normalizePhone(rawPhone);

  const { data: msgs } = await admin
    .from("score_whatsapp_messages")
    .select("created_at, direction, kind, phone, payload")
    .order("created_at", { ascending: false })
    .limit(30);

  const { data: sessions } = await admin
    .from("bot_sessions")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(10);

  const { data: sessionForPhone } = phone
    ? await admin.from("bot_sessions").select("*").eq("phone", phone).maybeSingle()
    : { data: null };

  return new Response(JSON.stringify({
    normalizedPhone: phone,
    sessionForPhone,
    sessions,
    msgs,
  }, null, 2), { headers: { ...cors, "Content-Type": "application/json" } });
});
