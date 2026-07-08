import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { syncScoreUser, sendOnboarding } from "../_shared/botconversa.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Authenticate the webhook: Cora must be configured to send our shared
    // secret in either `x-webhook-secret` or `Authorization: Bearer …`.
    // Without this, an attacker could POST `webhook-event-type: invoice.paid`
    // with a guessed invoice id and activate any account.
    const expected = Deno.env.get("CORA_WEBHOOK_SECRET");
    if (!expected) {
      return new Response(JSON.stringify({ error: "webhook not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const provided =
      req.headers.get("x-webhook-secret") ?? (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
    if (!provided || provided !== expected) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const eventType = req.headers.get("webhook-event-type") ?? "";
    const resourceId = req.headers.get("webhook-resource-id") ?? "";
    const eventId = req.headers.get("webhook-event-id") ?? "";

    if (!eventType || !resourceId) {
      return new Response(JSON.stringify({ error: "Missing webhook headers" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log the raw webhook for audit/debugging
    await supabase
      .from("score_profiles")
      .update({
        cora_status: eventType,
      })
      .eq("cora_invoice_id", resourceId);

    if (eventType === "invoice.paid") {
      const { data: profile } = await supabase
        .from("score_profiles")
        .select("*")
        .eq("cora_invoice_id", resourceId)
        .maybeSingle();

      if (!profile) {
        return new Response(JSON.stringify({ received: true, note: "profile not found" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const now = new Date().toISOString();
      const planStartedAt = profile.plan_started_at ?? now;
      const planExpiresAt =
        profile.plan === "semestral"
          ? new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      await supabase
        .from("score_profiles")
        .update({
          payment_status: "paid",
          plan_status: "active",
          cora_status: "PAID",
          cora_paid_at: now,
          plan_started_at: planStartedAt,
          plan_expires_at: planExpiresAt,
        })
        .eq("cora_invoice_id", resourceId);

      if (profile.partner_id && profile.partner_code) {
        const amountCents =
          typeof profile.cora_paid_amount === "number" && profile.cora_paid_amount > 0
            ? profile.cora_paid_amount
            : profile.plan === "semestral"
              ? 4970
              : 970;
        await supabase.from("partner_conversions").upsert(
          {
            partner_id: profile.partner_id,
            partner_code: profile.partner_code,
            kind: "purchase",
            source_table: "score_profiles",
            source_id: profile.id,
            amount_cents: amountCents,
            notes: `Score Comercial ${profile.plan || ""}`.trim(),
          },
          { onConflict: "source_table,source_id", ignoreDuplicates: true },
        );
      }

      // Sincroniza no BotConversa e dispara onboarding (best-effort; não bloqueia webhook)
      try {
        await syncScoreUser(profile.user_id);
        await sendOnboarding(profile.user_id);
      } catch (e) {
        console.error("botconversa post-payment sync failed:", e);
      }
    }

    return new Response(JSON.stringify({ received: true, eventId, eventType, resourceId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("cora-webhook error", err);
    return new Response(JSON.stringify({ error: String((err as Error).message ?? err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
