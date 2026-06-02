import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const ASAAS_BASE = "https://api.asaas.com/v3";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("ASAAS_API_KEY");
    if (!apiKey) throw new Error("ASAAS_API_KEY not set");

    const { name, email, phone, cpfCnpj, plan_slug = "mentoria-comercial-3m" } = await req.json();
    if (!name || !email || !cpfCnpj) {
      return new Response(JSON.stringify({ error: "name, email and cpfCnpj are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const headers = { "access_token": apiKey, "Content-Type": "application/json" };

    // 1. Create or find customer
    const findRes = await fetch(`${ASAAS_BASE}/customers?cpfCnpj=${encodeURIComponent(cpfCnpj)}`, { headers });
    const findData = await findRes.json();
    let customerId = findData?.data?.[0]?.id;
    if (!customerId) {
      const createCust = await fetch(`${ASAAS_BASE}/customers`, {
        method: "POST", headers,
        body: JSON.stringify({ name, email, phone, cpfCnpj, externalReference: plan_slug }),
      });
      const cust = await createCust.json();
      if (!createCust.ok) throw new Error("asaas customer: " + JSON.stringify(cust));
      customerId = cust.id;
    }

    // 2. Create installment payment (3x R$197 — credit card via checkout)
    const dueDate = new Date(); dueDate.setDate(dueDate.getDate() + 3);
    const paymentBody = {
      customer: customerId,
      billingType: "UNDEFINED", // allows user to pick card/pix/boleto at checkout
      installmentCount: 3,
      installmentValue: 197.00,
      dueDate: dueDate.toISOString().slice(0, 10),
      description: "Mentoria Comercial 1:1 — 3 meses (3x R$ 197,00)",
      externalReference: `mentoria:${email}`,
    };
    const payRes = await fetch(`${ASAAS_BASE}/payments`, { method: "POST", headers, body: JSON.stringify(paymentBody) });
    const pay = await payRes.json();
    if (!payRes.ok) throw new Error("asaas payment: " + JSON.stringify(pay));

    return new Response(JSON.stringify({ invoiceUrl: pay.invoiceUrl, paymentId: pay.id, customerId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("create-checkout error", err);
    return new Response(JSON.stringify({ error: String((err as Error).message ?? err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
