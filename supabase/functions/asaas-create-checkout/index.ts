import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const ASAAS_BASE = "https://api.asaas.com/v3";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("ASAAS_API_KEY");
    if (!apiKey) throw new Error("ASAAS_API_KEY not set");

    const {
      name, email, phone, cpfCnpj,
      postalCode, addressNumber, address, addressComplement, province, city, state,
      mentee_id,
      plan_slug = "mentoria-comercial-3m",
    } = await req.json();

    const missing: string[] = [];
    if (!name) missing.push("nome");
    if (!email) missing.push("e-mail");
    if (!cpfCnpj) missing.push("CPF");
    if (!phone) missing.push("WhatsApp");
    if (!postalCode) missing.push("CEP");
    if (!addressNumber) missing.push("número");
    if (!address) missing.push("endereço");
    if (!province) missing.push("bairro");
    if (!city) missing.push("cidade");
    if (!state) missing.push("UF");
    if (missing.length) {
      return new Response(JSON.stringify({ error: `Campos obrigatórios: ${missing.join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let installments = 3;
    let resolvedMenteeId: string | null = null;
    if (mentee_id) {
      const authHeader = req.headers.get("Authorization") ?? "";
      const token = authHeader.replace("Bearer ", "").trim();
      if (!token) {
        return new Response(JSON.stringify({ error: "Sessão expirada. Entre novamente no portal e tente pagar." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { data: authData, error: authError } = await supabase.auth.getUser(token);
      if (authError || !authData.user) {
        return new Response(JSON.stringify({ error: "Sessão inválida. Entre novamente no portal e tente pagar." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { data: mentee, error: menteeError } = await supabase
        .from("mentees")
        .select("id,user_id,access_mode,payment_status")
        .eq("id", mentee_id)
        .maybeSingle();
      if (menteeError || !mentee || mentee.user_id !== authData.user.id) {
        return new Response(JSON.stringify({ error: "Mentorado não encontrado para esta sessão." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (mentee.payment_status === "paid") {
        return new Response(JSON.stringify({ error: "Esse acesso já está marcado como pago." }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      resolvedMenteeId = mentee.id;
      installments = mentee.access_mode === "trial_then_paid" ? 2 : 3;
    }

    const headers = { "access_token": apiKey, "Content-Type": "application/json" };
    const cleanCpf = String(cpfCnpj).replace(/\D/g, "");
    const cleanCep = String(postalCode).replace(/\D/g, "");
    const cleanPhone = String(phone).replace(/\D/g, "");

    // 1. Find or create customer with full address (required for PIX/boleto)
    const findRes = await fetch(`${ASAAS_BASE}/customers?cpfCnpj=${encodeURIComponent(cleanCpf)}`, { headers });
    const findData = await findRes.json();
    let customerId = findData?.data?.[0]?.id;

    const customerPayload = {
      name, email, cpfCnpj: cleanCpf,
      mobilePhone: cleanPhone,
      postalCode: cleanCep,
      addressNumber: String(addressNumber),
      address: address ?? undefined,
      complement: addressComplement ?? undefined,
      province: province ?? undefined,
      city: city ?? undefined,
      state: state ?? undefined,
      externalReference: plan_slug,
      notificationDisabled: false,
    };

    if (!customerId) {
      const createCust = await fetch(`${ASAAS_BASE}/customers`, {
        method: "POST", headers, body: JSON.stringify(customerPayload),
      });
      const cust = await createCust.json();
      if (!createCust.ok) {
        console.error("asaas customer error", cust);
        const msg = cust?.errors?.[0]?.description ?? JSON.stringify(cust);
        return new Response(JSON.stringify({ error: `Asaas (cliente): ${msg}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      customerId = cust.id;
    } else {
      // Update existing customer with fresh address info
      await fetch(`${ASAAS_BASE}/customers/${customerId}`, {
        method: "POST", headers, body: JSON.stringify(customerPayload),
      });
    }

    // 2. Create monthly subscription. Trial mentees already consumed the first month, so charge only 2 cycles.
    const nextDueDate = new Date(); nextDueDate.setDate(nextDueDate.getDate() + 3);
    const subBody = {
      customer: customerId,
      billingType: "UNDEFINED", // user picks card / PIX / boleto on the checkout
      value: 187.00,
      nextDueDate: nextDueDate.toISOString().slice(0, 10),
      cycle: "MONTHLY",
      maxPayments: installments,
      description: `Mentoria Comercial 1:1 — assinatura mensal (${installments}x R$ 187,00)`,
      externalReference: resolvedMenteeId ? `mentoria:${email}:mentee:${resolvedMenteeId}` : `mentoria:${email}`,
    };
    const subRes = await fetch(`${ASAAS_BASE}/subscriptions`, {
      method: "POST", headers, body: JSON.stringify(subBody),
    });
    const sub = await subRes.json();
    if (!subRes.ok) {
      console.error("asaas subscription error", sub);
      const msg = sub?.errors?.[0]?.description ?? JSON.stringify(sub);
      return new Response(JSON.stringify({ error: `Asaas (assinatura): ${msg}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 3. Fetch the first payment to get its invoiceUrl. Asaas can take a moment to expose it.
    let firstPayment: any = null;
    let paysData: any = null;
    for (let attempt = 0; attempt < 4; attempt++) {
      const paysRes = await fetch(`${ASAAS_BASE}/subscriptions/${sub.id}/payments`, { headers });
      paysData = await paysRes.json();
      firstPayment = (paysData?.data ?? [])
        .filter((p: any) => p?.invoiceUrl)
        .sort((a: any, b: any) => String(a.dueDate ?? "").localeCompare(String(b.dueDate ?? "")))[0];
      if (firstPayment?.invoiceUrl) break;
      await new Promise((resolve) => setTimeout(resolve, 700));
    }
    if (!firstPayment?.invoiceUrl) {
      console.error("no invoice url", paysData);
      return new Response(JSON.stringify({ error: "Assinatura criada, mas a fatura ainda não está disponível. Tente novamente em alguns segundos." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({
      invoiceUrl: firstPayment.invoiceUrl,
      subscriptionId: sub.id,
      paymentId: firstPayment.id,
      customerId,
      installments,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("create-checkout error", err);
    return new Response(JSON.stringify({ error: String((err as Error).message ?? err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
