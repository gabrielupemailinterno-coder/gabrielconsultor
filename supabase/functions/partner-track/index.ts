// Public: track partner link clicks and resolve short slugs.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), {
    status: s,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const CONVERSION_TABLES = new Set(["leads", "mentees", "score_profiles"]);
const CONVERSION_KINDS = new Set(["lead", "purchase"]);

async function hashIp(ip: string): Promise<string> {
  const buf = new TextEncoder().encode(ip + "|partner-salt");
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    if (req.method === "GET") {
      const slug = url.searchParams.get("slug");
      if (!slug) return json({ error: "missing slug" }, 400);
      const { data: link } = await admin
        .from("partner_links")
        .select("id, partner_id, destination, active, partners:partner_id(partner_code, status)")
        .eq("slug", slug)
        .maybeSingle();
      if (!link || !(link as any).active) return json({ error: "not found" }, 404);
      const partner = (link as any).partners;
      if (!partner || partner.status !== "active") return json({ error: "inactive" }, 410);
      return json({
        link_id: (link as any).id,
        partner_id: (link as any).partner_id,
        partner_code: partner.partner_code,
        destination: (link as any).destination || "/",
      });
    }

    if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

    const body = await req.json().catch(() => ({}));
    const partnerCode: string | undefined = body.partner_code;
    if (!partnerCode || typeof partnerCode !== "string") return json({ error: "missing partner_code" }, 400);

    const { data: partner } = await admin
      .from("partners")
      .select("id, status, partner_code")
      .eq("partner_code", partnerCode)
      .maybeSingle();
    if (!partner || partner.status !== "active") return json({ ok: false, reason: "unknown_code" });

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("cf-connecting-ip") || "0.0.0.0";
    const ip_hash = await hashIp(ip);

    await admin.from("partner_attributions").insert({
      partner_id: partner.id,
      partner_code: partner.partner_code,
      link_id: body.link_id || null,
      destination: body.destination || null,
      session_id: body.session_id || null,
      ip_hash,
      user_agent: req.headers.get("user-agent")?.slice(0, 500) || null,
      referrer: (body.referrer || req.headers.get("referer") || "").slice(0, 500) || null,
    });

    const sourceTable = String(body.source_table || "");
    const sourceId = String(body.source_id || "");
    const kind = String(body.kind || "");
    if (CONVERSION_TABLES.has(sourceTable) && CONVERSION_KINDS.has(kind) && sourceId) {
      const amountCents =
        typeof body.amount_cents === "number" && Number.isFinite(body.amount_cents)
          ? Math.max(0, Math.floor(body.amount_cents))
          : null;

      await admin
        .from(sourceTable)
        .update({ partner_id: partner.id, partner_code: partner.partner_code })
        .eq("id", sourceId);

      await admin.from("partner_conversions").upsert(
        {
          partner_id: partner.id,
          partner_code: partner.partner_code,
          kind,
          source_table: sourceTable,
          source_id: sourceId,
          amount_cents: amountCents,
          notes: body.notes || null,
        },
        { onConflict: "source_table,source_id", ignoreDuplicates: true },
      );
    }

    return json({ ok: true });
  } catch (e: any) {
    console.error("partner-track error", e);
    return json({ error: e?.message || "internal" }, 500);
  }
});
