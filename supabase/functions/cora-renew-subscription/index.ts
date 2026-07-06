import { createClient } from "npm:@supabase/supabase-js@2";

const CORA_BASE = "https://api.cora.com.br";
const TOKEN_URL = "https://matls-clients.api.cora.com.br/token";

function getCoraClient() {
  const cert = Deno.env.get("CORA_CERT_PEM");
  const key = Deno.env.get("CORA_PRIVATE_KEY");
  if (!cert || !key) throw new Error("CORA_CERT_PEM ou CORA_PRIVATE_KEY não configurados");
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
  if (!res.ok) throw new Error(`CORA token error ${res.status}: ${text}`);
  const data = JSON.parse(text);
  if (!data.access_token) throw new Error("CORA não retornou access_token");
  return data.access_token as string;
}

async function coraApi<T>(
  client: Deno.HttpClient,
  token: string,
  method: string,
  path: string,
  body?: unknown,
  idempotencyKey?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    accept: "application/json",
  };
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  const res = await fetch(`${CORA_BASE}${path}`, {
    method,
    client,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`CORA API ${method} ${path} error ${res.status}: ${text}`);
  return text ? (JSON.parse(text) as T) : ({} as T);
}

Deno.serve(async (req) => {
  try {
    // Basic cron authorization check
    const authHeader = req.headers.get("Authorization") ?? "";
    const cronToken = Deno.env.get("CORA_RENEW_CRON_TOKEN");
    if (cronToken && !authHeader.endsWith(cronToken)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const windowStart = new Date();
    const windowEnd = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    const { data: profiles } = await supabase
      .from("score_profiles")
      .select("*")
      .eq("plan", "mensal")
      .eq("plan_status", "active")
      .lte("plan_expires_at", windowEnd.toISOString())
      .gte("plan_expires_at", windowStart.toISOString());

    const results: Array<{ user_id: string; invoice_id?: string; error?: string }> = [];
    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ processed: 0, results: [] }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const client = getCoraClient();
    const coraToken = await getCoraToken(client);

    for (const profile of profiles) {
      try {
        const cleanCpf = String(profile.cpf).replace(/\D/g, "");
        const cleanCep = String(profile.postal_code).replace(/\D/g, "");
        const docType = cleanCpf.length === 11 ? "CPF" : "CNPJ";
        const dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
        const dueDateStr = dueDate.toISOString().slice(0, 10);

        const invoiceBody = {
          code: `score_${profile.user_id}_mensal_${Date.now()}`,
          customer: {
            name: String(profile.full_name).slice(0, 60),
            email: String(profile.email).slice(0, 60),
            document: { identity: cleanCpf, type: docType },
            address: {
              street: profile.address,
              number: profile.address_number,
              district: profile.province,
              city: profile.city,
              state: profile.state,
              complement: profile.address_complement || "N/A",
              zip_code: cleanCep,
            },
          },
          services: [
            { name: "Score Comercial - Plano Mensal", description: "Renovação mensal Score Comercial", amount: 970 },
          ],
          payment_terms: { due_date: dueDateStr },
          payment_forms: ["PIX"],
        };

        const invoice = await coraApi<Record<string, any>>(
          client,
          coraToken,
          "POST",
          "/v2/invoices/",
          invoiceBody,
          crypto.randomUUID(),
        );

        const invoiceId = invoice.id as string;
        const emv = (invoice.pix as any)?.emv as string;
        const qrUrl = ((invoice.payment_options as any)?.bank_slip as any)?.url as string;

        await supabase.from("score_profiles").update({
          payment_status: "pending",
          plan_status: "pending",
          cora_invoice_id: invoiceId,
          cora_status: invoice.status as string,
          cora_due_date: dueDateStr,
          cora_emv: emv,
          cora_qr_code_url: qrUrl,
        }).eq("user_id", profile.user_id);

        results.push({ user_id: profile.user_id, invoice_id: invoiceId });
      } catch (err: any) {
        console.error(`renew error for ${profile.user_id}`, err);
        results.push({ user_id: profile.user_id, error: err.message });
      }
    }

    return new Response(JSON.stringify({ processed: profiles.length, results }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("cora-renew-subscription error", err);
    return new Response(
      JSON.stringify({ error: String((err as Error).message ?? err) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
