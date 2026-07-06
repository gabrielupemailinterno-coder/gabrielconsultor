import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";

const CORA_BASE = "https://api.cora.com.br";
const TOKEN_URL = "https://matls-clients.api.cora.com.br/token";

const prices: Record<string, { amount: number; description: string; recurring: boolean }> = {
  mensal: { amount: 970, description: "Score Comercial - Plano Mensal", recurring: true },
  semestral: { amount: 4970, description: "Score Comercial - Plano Semestral", recurring: false },
};

const bodySchema = z.object({
  plan_key: z.enum(["mensal", "semestral"]),
  terms_accepted: z.boolean().refine((v) => v === true, { message: "Aceite os termos" }),
});

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
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return new Response(JSON.stringify({ error: "Sessão expirada. Faça login novamente." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData?.user) {
      return new Response(JSON.stringify({ error: "Sessão inválida. Faça login novamente." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = authData.user.id;
    const email = authData.user.email ?? "";

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { plan_key, terms_accepted } = parsed.data;
    const plan = prices[plan_key];

    const { data: profile } = await supabase
      .from("score_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (!profile) {
      return new Response(JSON.stringify({ error: "Perfil não encontrado." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const missing: string[] = [];
    if (!profile.full_name) missing.push("nome completo");
    if (!profile.cpf) missing.push("CPF");
    if (!profile.postal_code) missing.push("CEP");
    if (!profile.address) missing.push("endereço");
    if (!profile.address_number) missing.push("número");
    if (!profile.province) missing.push("bairro");
    if (!profile.city) missing.push("cidade");
    if (!profile.state) missing.push("UF");
    if (missing.length) {
      return new Response(JSON.stringify({ error: `Complete seus dados: ${missing.join(", ")}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cleanCpf = String(profile.cpf).replace(/\D/g, "");
    const cleanCep = String(profile.postal_code).replace(/\D/g, "");
    const docType = cleanCpf.length === 11 ? "CPF" : "CNPJ";

    const client = getCoraClient();
    const coraToken = await getCoraToken(client);

    const idempotencyKey = crypto.randomUUID();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);
    const dueDateStr = dueDate.toISOString().slice(0, 10);

    const invoiceBody: Record<string, unknown> = {
      code: `score_${userId}_${plan_key}_${Date.now()}`,
      customer: {
        name: profile.full_name.slice(0, 60),
        email: email.slice(0, 60),
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
        { name: plan.description, description: plan.description.slice(0, 100), amount: plan.amount },
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
      idempotencyKey,
    );

    const invoiceId = invoice.id as string;
    const emv = (invoice.pix as any)?.emv as string;
    const qrUrl = ((invoice.payment_options as any)?.bank_slip as any)?.url as string;

    let subscriptionId: string | null = null;
    if (plan.recurring) {
      const subBody = {
        invoice_id: invoiceId,
        frequency: "MONTHLY",
        occurrences: 12,
      };
      const sub = await coraApi<Record<string, any>>(client, coraToken, "POST", "/v2/subscriptions/", subBody);
      subscriptionId = (sub.id as string) ?? null;
    }

    await supabase.from("score_profiles").update({
      plan: plan_key,
      payment_status: "pending",
      plan_status: "pending",
      cora_customer_id: null,
      cora_invoice_id: invoiceId,
      cora_subscription_id: subscriptionId,
      cora_status: invoice.status as string,
      cora_due_date: dueDateStr,
      cora_emv: emv,
      cora_qr_code_url: qrUrl,
    }).eq("user_id", userId);

    return new Response(
      JSON.stringify({
        invoiceId,
        subscriptionId,
        emv,
        qrCodeUrl: qrUrl,
        amount: plan.amount,
        dueDate: dueDateStr,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("cora-pix-checkout error", err);
    return new Response(
      JSON.stringify({ error: String((err as Error).message ?? err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
