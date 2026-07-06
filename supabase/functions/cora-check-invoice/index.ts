import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const CORA_BASE = "https://matls-clients.api.cora.com.br";
const TOKEN_URL = "https://matls-clients.api.cora.com.br/token";

function getCoraClient() {
  const cert = Deno.env.get("CORA_CERT_PEM");
  const key = Deno.env.get("CORA_PRIVATE_KEY");
  if (!cert || !key) throw new Error("CORA cert/key não configurados");
  return Deno.createHttpClient({ cert, key });
}

async function getCoraToken(client: Deno.HttpClient): Promise<string> {
  const clientId = Deno.env.get("CORA_CLIENT_ID");
  if (!clientId) throw new Error("CORA_CLIENT_ID não configurado");
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    client,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: clientId }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`CORA token ${res.status}: ${text}`);
  return JSON.parse(text).access_token as string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: authData } = await supabase.auth.getUser(token);
    if (!authData?.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = authData.user.id;

    const { data: profile } = await supabase
      .from("score_profiles")
      .select("cora_invoice_id, plan, payment_status, plan_status, plan_expires_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (!profile?.cora_invoice_id) {
      return new Response(JSON.stringify({ paid: false, reason: "no_invoice" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const client = getCoraClient();
    const coraToken = await getCoraToken(client);
    const res = await fetch(`${CORA_BASE}/v2/invoices/${profile.cora_invoice_id}`, {
      client,
      headers: { Authorization: `Bearer ${coraToken}`, accept: "application/json" },
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`CORA GET invoice ${res.status}: ${text}`);
    const invoice = JSON.parse(text);
    const status = String(invoice.status ?? "").toUpperCase();
    const isPaid = ["PAID", "PAID_MANUALLY", "SETTLED", "CLOSED"].includes(status);

    if (isPaid && profile.payment_status !== "paid") {
      const planExpiresAt = profile.plan === "semestral"
        ? new Date(Date.now() + 180 * 864e5).toISOString()
        : new Date(Date.now() + 30 * 864e5).toISOString();
      await supabase.from("score_profiles").update({
        payment_status: "paid",
        plan_status: "active",
        cora_status: status,
        plan_expires_at: planExpiresAt,
      }).eq("user_id", userId);
    } else {
      await supabase.from("score_profiles").update({ cora_status: status }).eq("user_id", userId);
    }

    return new Response(JSON.stringify({ paid: isPaid, status }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("cora-check-invoice error", err);
    return new Response(JSON.stringify({ error: String((err as Error).message ?? err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
