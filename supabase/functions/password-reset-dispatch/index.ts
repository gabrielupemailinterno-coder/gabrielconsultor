// Compat wrapper: keeps the old endpoint working while forwarding to the
// new emit-password-link function, which dispatches through the events
// catalog (user.password_reset_link) so a webhook can be configured in
// Integrações → API & Webhooks.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const ok = () =>
    new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  if (req.method !== "POST") return ok();

  try {
    const body = await req.json().catch(() => ({}));
    await fetch(`${SUPABASE_URL}/functions/v1/emit-password-link`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SERVICE_ROLE}`,
      },
      body: JSON.stringify({ ...body, kind: "reset" }),
    });
  } catch (e) {
    console.error("password-reset-dispatch forward failed", e);
  }
  return ok();
});
