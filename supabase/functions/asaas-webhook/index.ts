import { createClient } from "npm:@supabase/supabase-js@2";

const ASAAS_BASE = "https://api.asaas.com/v3";

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });

  // Validate webhook token (configured in Asaas panel as Auth Token header)
  const expectedToken = Deno.env.get("ASAAS_WEBHOOK_TOKEN");
  const receivedToken = req.headers.get("asaas-access-token");
  if (expectedToken && receivedToken !== expectedToken) {
    console.warn("invalid webhook token");
    return new Response("unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const event = body?.event;
    const payment = body?.payment;
    const isTest = body?.test === true;
    const isDryRun = body?.dry_run === true;
    if (!event || !payment) return new Response("ignored", { status: 200 });

    // Only act on first confirmation of the installment series
    const confirmedEvents = ["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"];
    if (!confirmedEvents.includes(event)) {
      return new Response(JSON.stringify({ ignored: event }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Get customer details: mocked in test mode, otherwise from Asaas API
    let customer: any;
    if (isTest && body?.customer) {
      customer = body.customer;
    } else {
      const apiKey = Deno.env.get("ASAAS_API_KEY")!;
      const custRes = await fetch(`${ASAAS_BASE}/customers/${payment.customer}`, {
        headers: { "access_token": apiKey },
      });
      customer = await custRes.json();
    }
    const email = customer.email?.toLowerCase().trim();
    const fullName = customer.name ?? "Mentorado";
    const phone = customer.mobilePhone ?? customer.phone ?? null;
    if (!email) throw new Error("customer email missing");

    // Dry run: validate plan exists and stop before creating user/mentee
    if (isDryRun) {
      const { data: plan } = await supabase
        .from("mentorship_plans").select("id, slug").eq("slug", "mentoria-comercial-3m").single();
      const { data: existing } = await supabase
        .from("mentees").select("id").eq("email", email).maybeSingle();
      return new Response(JSON.stringify({
        dry_run: true, ok: true, event, email, fullName, phone,
        plan_found: !!plan, already_provisioned: !!existing,
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    // Already provisioned?
    const { data: existing } = await supabase
      .from("mentees").select("id, user_id").eq("email", email).maybeSingle();
    if (existing) {
      return new Response(JSON.stringify({ already_active: true, mentee_id: existing.id }),
        { status: 200, headers: { "Content-Type": "application/json" } });
    }

    // Get plan
    const { data: plan } = await supabase
      .from("mentorship_plans").select("id").eq("slug", "mentoria-comercial-3m").single();
    if (!plan) throw new Error("plan not found");

    // Generate temp password
    const tempPassword = generatePassword(14);

    // Create user via admin API
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email, password: tempPassword, email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (createErr || !created.user) throw new Error("create user: " + (createErr?.message ?? "unknown"));

    // Provision mentee + meetings + homework via RPC
    const { data: menteeId, error: provErr } = await supabase.rpc("provision_mentee", {
      _user_id: created.user.id, _plan_id: plan.id, _full_name: fullName, _email: email,
      _phone: phone, _asaas_customer_id: payment.customer, _asaas_payment_id: payment.id,
    });
    if (provErr) throw new Error("provision: " + provErr.message);

    // Send welcome email if transactional email infra exists
    try {
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          to: email,
          subject: "Bem-vindo à Mentoria Comercial 1:1",
          purpose: "transactional",
          idempotency_key: `welcome:${menteeId}`,
          html: welcomeHtml(fullName, email, tempPassword),
        },
      });
    } catch (mailErr) {
      console.warn("welcome email skipped (likely infra not set up yet):", mailErr);
    }

    return new Response(JSON.stringify({ ok: true, mentee_id: menteeId }),
      { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("asaas-webhook error", err);
    return new Response(JSON.stringify({ error: String((err as Error).message ?? err) }),
      { status: 500, headers: { "Content-Type": "application/json" } });
  }
});

function generatePassword(len: number) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => chars[n % chars.length]).join("");
}

function welcomeHtml(name: string, email: string, password: string) {
  const portalUrl = "https://gabrielconsultor.com/mentorados/login";
  return `
    <div style="font-family:Inter,system-ui,sans-serif;color:#111;line-height:1.55">
      <h2>Bem-vindo, ${name.split(" ")[0]}!</h2>
      <p>Seu acesso ao <strong>Portal do Mentorado</strong> foi liberado.</p>
      <p style="background:#f3f4f6;padding:14px;border-radius:8px">
        <strong>E-mail:</strong> ${email}<br>
        <strong>Senha temporária:</strong> <code>${password}</code>
      </p>
      <p><a href="${portalUrl}" style="display:inline-block;background:#FF6B5B;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600">Acessar o Portal</a></p>
      <p style="color:#666;font-size:13px">Recomendamos trocar a senha no primeiro acesso. Qualquer dúvida, é só responder este e-mail.</p>
    </div>`;
}
