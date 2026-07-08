import { createClient } from "npm:@supabase/supabase-js@2";

const ASAAS_BASE = "https://api.asaas.com/v3";

function partnerCodeFromReference(ref: unknown): string | null {
  const value = String(ref || "");
  const match = value.match(/(?:^|:)partner:([^:]+)/i);
  return match?.[1] ?? null;
}

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
      return new Response(JSON.stringify({ ignored: event }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Get customer details: mocked in test mode, otherwise from Asaas API
    let customer: any;
    if (isTest && body?.customer) {
      customer = body.customer;
    } else {
      const apiKey = Deno.env.get("ASAAS_API_KEY")!;
      const custRes = await fetch(`${ASAAS_BASE}/customers/${payment.customer}`, {
        headers: { access_token: apiKey },
      });
      customer = await custRes.json();
    }
    const email = customer.email?.toLowerCase().trim();
    const fullName = customer.name ?? "Mentorado";
    const phone = customer.mobilePhone ?? customer.phone ?? null;
    if (!email) throw new Error("customer email missing");

    let partnerId: string | null = null;
    let partnerCode: string | null = partnerCodeFromReference(payment.externalReference);
    if (partnerCode) {
      const { data: partner } = await supabase
        .from("partners")
        .select("id, partner_code, status")
        .eq("partner_code", partnerCode)
        .maybeSingle();
      if (partner?.status === "active") {
        partnerId = partner.id;
        partnerCode = partner.partner_code;
      } else {
        partnerId = null;
        partnerCode = null;
      }
    }

    // Dry run: validate plan exists and stop before creating user/mentee
    if (isDryRun) {
      const { data: plan } = await supabase
        .from("mentorship_plans")
        .select("id, slug")
        .eq("slug", "mentoria-comercial-3m")
        .single();
      const { data: existing } = await supabase.from("mentees").select("id").eq("email", email).maybeSingle();
      return new Response(
        JSON.stringify({
          dry_run: true,
          ok: true,
          event,
          email,
          fullName,
          phone,
          plan_found: !!plan,
          already_provisioned: !!existing,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // Already provisioned? Mark as paid and release the remaining meetings.
    const { data: existing } = await supabase
      .from("mentees")
      .select("id, user_id, partner_id, partner_code")
      .eq("email", email)
      .maybeSingle();
    if (existing) {
      const finalPartnerId = existing.partner_id ?? partnerId;
      const finalPartnerCode = existing.partner_code ?? partnerCode;
      const { error: updateErr } = await supabase
        .from("mentees")
        .update({
          payment_status: "paid",
          status: "active",
          asaas_customer_id: payment.customer,
          asaas_payment_id: payment.id,
          partner_id: finalPartnerId,
          partner_code: finalPartnerCode,
          payment_updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      if (updateErr) throw new Error("update mentee payment: " + updateErr.message);

      const { error: unlockErr } = await supabase
        .from("meetings")
        .update({ status: "available" })
        .eq("mentee_id", existing.id)
        .eq("status", "blocked");
      if (unlockErr) throw new Error("unlock meetings: " + unlockErr.message);

      if (finalPartnerId && finalPartnerCode) {
        await supabase.from("partner_conversions").upsert(
          {
            partner_id: finalPartnerId,
            partner_code: finalPartnerCode,
            kind: "purchase",
            source_table: "mentees",
            source_id: existing.id,
            amount_cents: Math.round(Number(payment.value || 0) * 100),
            notes: "Mentoria Comercial",
          },
          { onConflict: "source_table,source_id", ignoreDuplicates: true },
        );
      }

      return new Response(JSON.stringify({ already_active: true, payment_updated: true, mentee_id: existing.id }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get plan
    const { data: plan } = await supabase
      .from("mentorship_plans")
      .select("id")
      .eq("slug", "mentoria-comercial-3m")
      .single();
    if (!plan) throw new Error("plan not found");

    // Generate temp password
    const tempPassword = generatePassword(14);

    // Create user via admin API
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (createErr || !created.user) throw new Error("create user: " + (createErr?.message ?? "unknown"));

    // Provision mentee + meetings + homework via RPC
    const { data: menteeId, error: provErr } = await supabase.rpc("provision_mentee", {
      _user_id: created.user.id,
      _plan_id: plan.id,
      _full_name: fullName,
      _email: email,
      _phone: phone,
      _asaas_customer_id: payment.customer,
      _asaas_payment_id: payment.id,
    });
    if (provErr) throw new Error("provision: " + provErr.message);

    const { error: paidErr } = await supabase
      .from("mentees")
      .update({
        payment_status: "paid",
        payment_updated_at: new Date().toISOString(),
        partner_id: partnerId,
        partner_code: partnerCode,
      })
      .eq("id", menteeId);
    if (paidErr) throw new Error("mark paid: " + paidErr.message);

    const { error: unlockErr } = await supabase
      .from("meetings")
      .update({ status: "available" })
      .eq("mentee_id", menteeId)
      .eq("status", "blocked");
    if (unlockErr) throw new Error("unlock meetings: " + unlockErr.message);

    if (partnerId && partnerCode) {
      await supabase.from("partner_conversions").upsert(
        {
          partner_id: partnerId,
          partner_code: partnerCode,
          kind: "purchase",
          source_table: "mentees",
          source_id: menteeId,
          amount_cents: Math.round(Number(payment.value || 0) * 100),
          notes: "Mentoria Comercial",
        },
        { onConflict: "source_table,source_id", ignoreDuplicates: true },
      );
    }

    // Send welcome email via Zoho (app email)
    try {
      await supabase.functions.invoke("send-app-email", {
        body: {
          template: "welcome-mentee",
          to: email,
          data: { fullName, email, tempPassword },
        },
      });
    } catch (mailErr) {
      console.warn("welcome email send failed:", mailErr);
    }

    // Send "schedule first meeting" prompt right after
    try {
      await supabase.functions.invoke("send-app-email", {
        body: {
          template: "schedule-first-meeting",
          to: email,
          data: { fullName },
        },
      });
    } catch (mailErr) {
      console.warn("schedule-first-meeting send failed:", mailErr);
    }

    return new Response(JSON.stringify({ ok: true, mentee_id: menteeId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("asaas-webhook error", err);
    return new Response(JSON.stringify({ error: String((err as Error).message ?? err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

function generatePassword(len: number) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => chars[n % chars.length]).join("");
}
