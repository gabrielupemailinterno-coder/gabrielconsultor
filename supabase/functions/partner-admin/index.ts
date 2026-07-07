// Admin-only: link a partner to a user account, or update conversion status.
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireAdminOrService } from "../_shared/require-admin.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const guard = await requireAdminOrService(req, corsHeaders);
  if (guard instanceof Response) return guard;

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action as string;

    if (action === "link_user") {
      const partnerId = body.partner_id as string;
      const email = String(body.email || "").trim().toLowerCase();
      if (!partnerId || !email) return json({ error: "partner_id and email required" }, 400);

      // Find or create user
      let userId: string | null = null;
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      const existing = list?.users?.find((u) => u.email?.toLowerCase() === email);
      if (existing) {
        userId = existing.id;
      } else {
        const { data: created, error: cErr } = await admin.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: { source: "partner_portal" },
        });
        if (cErr || !created?.user) return json({ error: cErr?.message || "create user failed" }, 500);
        userId = created.user.id;
      }

      // Attach role + partner.user_id
      const { error: rErr } = await admin
        .from("user_roles")
        .upsert({ user_id: userId, role: "partner" as any }, { onConflict: "user_id,role" });
      if (rErr) return json({ error: rErr.message }, 500);

      const { error: pErr } = await admin.from("partners").update({ user_id: userId }).eq("id", partnerId);
      if (pErr) return json({ error: pErr.message }, 500);

      // Send password reset so partner can set their password
      const redirectTo = (body.redirect_to as string) || undefined;
      const { data: linkData } = await admin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: redirectTo ? { redirectTo } : undefined,
      });

      return json({ ok: true, user_id: userId, recovery_link: linkData?.properties?.action_link || null });
    }

    if (action === "update_conversion_status") {
      const id = body.id as string;
      const status = body.status as string;
      const allowed = ["pending", "approved", "paid", "canceled"];
      if (!id || !allowed.includes(status)) return json({ error: "invalid" }, 400);
      const { error } = await admin
        .from("partner_conversions")
        .update({ commission_status: status })
        .eq("id", id);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    return json({ error: "unknown action" }, 400);
  } catch (e: any) {
    console.error("partner-admin error", e);
    return json({ error: e?.message || "internal" }, 500);
  }
});
