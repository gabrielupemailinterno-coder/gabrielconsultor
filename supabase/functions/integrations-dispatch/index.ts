// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function hmacSha256Hex(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function deliver(webhook: any, eventKey: string, payload: any, deliveryId: string, attempt: number, admin: any) {
  const body = JSON.stringify({ event: eventKey, occurred_at: new Date().toISOString(), data: payload });
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "gabrielconsultor-integrations/1.0",
    ...(webhook.headers || {}),
  };
  if (webhook.secret) {
    headers["X-Lovable-Signature"] = "sha256=" + await hmacSha256Hex(webhook.secret, body);
  }

  const t0 = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), webhook.timeout_ms || 10000);
  let status = 0, respText = "", errMsg: string | null = null;
  try {
    const res = await fetch(webhook.url, { method: "POST", headers, body, signal: controller.signal });
    status = res.status;
    respText = (await res.text()).slice(0, 4000);
  } catch (e: any) {
    errMsg = String(e?.message || e);
  } finally {
    clearTimeout(timer);
  }
  const duration = Date.now() - t0;
  const ok = status >= 200 && status < 300;
  const maxAttempts = webhook.max_attempts || 3;
  const backoff = webhook.backoff_seconds || 60;
  const nextStatus = ok ? "success" : (attempt >= maxAttempts ? "failed" : "retrying");
  const nextRetry = nextStatus === "retrying"
    ? new Date(Date.now() + backoff * 1000 * Math.pow(2, attempt - 1)).toISOString()
    : null;

  await admin.from("integration_deliveries").update({
    status: nextStatus,
    response_status: status || null,
    response_body: respText || null,
    error: errMsg,
    duration_ms: duration,
    next_retry_at: nextRetry,
    attempt,
  }).eq("id", deliveryId);

  await admin.from("integration_webhooks").update({
    last_delivery_at: new Date().toISOString(),
    last_delivery_status: nextStatus,
  }).eq("id", webhook.id);

  return { ok, status, nextStatus };
}

import { requireAdminOrService } from "../_shared/require-admin.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Require admin JWT or service_role — otherwise anyone can trigger
  // outbound POSTs to any registered webhook URL (SSRF) or replay deliveries.
  const auth = await requireAdminOrService(req, corsHeaders);
  if (auth instanceof Response) return auth;

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  let body: any = {};
  try { body = await req.json(); } catch { /* empty */ }


  // Retry mode: process pending/retrying deliveries whose next_retry_at has passed
  if (body?.mode === "retry_pending") {
    const { data: pending } = await admin
      .from("integration_deliveries")
      .select("*, webhook:integration_webhooks(*)")
      .in("status", ["pending", "retrying"])
      .or(`next_retry_at.is.null,next_retry_at.lte.${new Date().toISOString()}`)
      .limit(50);
    const results = [];
    for (const d of pending || []) {
      if (!d.webhook || !d.webhook.enabled) continue;
      const r = await deliver(d.webhook, d.event_key, d.payload, d.id, (d.attempt || 0) + 1, admin);
      results.push({ id: d.id, ...r });
    }
    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Test mode: fire a single webhook by id with sample payload
  if (body?.mode === "test" && body?.webhook_id) {
    const { data: wh } = await admin.from("integration_webhooks").select("*").eq("id", body.webhook_id).single();
    if (!wh) return new Response(JSON.stringify({ error: "webhook not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const eventKey = body.event_key || wh.event_name || "test.ping";
    const payload = body.payload ?? { test: true, sent_at: new Date().toISOString() };
    const { data: del } = await admin.from("integration_deliveries").insert({
      webhook_id: wh.id, event_key: eventKey, payload, attempt: 1, status: "pending",
    }).select().single();
    const r = await deliver(wh, eventKey, payload, del!.id, 1, admin);
    return new Response(JSON.stringify({ delivery_id: del!.id, ...r }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Emit mode: dispatch an event to the single webhook subscribing to it
  const eventKey: string | undefined = body?.event;
  const payload = body?.data ?? {};
  if (!eventKey) {
    return new Response(JSON.stringify({ error: "event required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  const { data: webhooks } = await admin
    .from("integration_webhooks")
    .select("*")
    .eq("enabled", true)
    .eq("event_name", eventKey);

  const results = [];
  for (const wh of webhooks || []) {
    const { data: del } = await admin.from("integration_deliveries").insert({
      webhook_id: wh.id, event_key: eventKey, payload, attempt: 1, status: "pending",
    }).select().single();
    const r = await deliver(wh, eventKey, payload, del!.id, 1, admin);
    results.push({ webhook_id: wh.id, delivery_id: del!.id, ...r });
  }
  return new Response(JSON.stringify({ event: eventKey, dispatched: results.length, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

