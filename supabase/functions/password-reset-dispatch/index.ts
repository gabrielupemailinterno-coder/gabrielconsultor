// Public: generates a Supabase recovery link for a given e-mail and POSTs
// { phone, reset_link, full_name, email, source_hint } to the outbound
// webhook (BotConversa forwards it over WhatsApp).
// Always responds { ok: true } to avoid e-mail enumeration.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

type SourceHint = "partner" | "mentee" | "scoreapp" | "admin" | "unknown";

const ok = () =>
  new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function pickIdentity(
  admin: ReturnType<typeof createClient>,
  userId: string,
  email: string,
): Promise<{ phone: string | null; full_name: string | null; source_hint: SourceHint }> {
  // Priority: partner > mentee > scoreapp. Admin only if no other module.
  const partner = await admin
    .from("partners")
    .select("phone, name")
    .eq("user_id", userId)
    .maybeSingle();
  if (partner.data) {
    return {
      phone: (partner.data as any).phone ?? null,
      full_name: (partner.data as any).name ?? null,
      source_hint: "partner",
    };
  }
  const mentee = await admin
    .from("mentees")
    .select("phone, full_name")
    .eq("user_id", userId)
    .maybeSingle();
  if (mentee.data) {
    return {
      phone: (mentee.data as any).phone ?? null,
      full_name: (mentee.data as any).full_name ?? null,
      source_hint: "mentee",
    };
  }
  const score = await admin
    .from("score_profiles")
    .select("phone, full_name")
    .eq("user_id", userId)
    .maybeSingle();
  if (score.data) {
    return {
      phone: (score.data as any).phone ?? null,
      full_name: (score.data as any).full_name ?? null,
      source_hint: "scoreapp",
    };
  }
  return { phone: null, full_name: null, source_hint: "unknown" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return ok();

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const WEBHOOK_URL = Deno.env.get("PASSWORD_RESET_WEBHOOK_URL");
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const body = await req.json().catch(() => ({}));
    const email = String(body?.email ?? "").trim().toLowerCase();
    const origin =
      String(body?.origin ?? "").trim() ||
      req.headers.get("origin") ||
      "https://gabrielconsultor.com";
    const redirectTo = `${origin.replace(/\/+$/, "")}/app/redefinir-senha`;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return ok();

    // Look up the user by e-mail (paginate defensively; small user base).
    let userId: string | null = null;
    let page = 1;
    while (page <= 20) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) break;
      const found = data.users.find((u) => (u.email || "").toLowerCase() === email);
      if (found) {
        userId = found.id;
        break;
      }
      if (data.users.length < 200) break;
      page += 1;
    }
    if (!userId) {
      console.log("password-reset-dispatch: no auth user for", email);
      return ok();
    }

    const identity = await pickIdentity(admin, userId, email);

    // Generate the recovery link (Supabase verifies + redirects to /app/redefinir-senha)
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo },
    });
    if (linkErr || !linkData?.properties?.action_link) {
      console.error("generateLink failed", linkErr);
      return ok();
    }
    const reset_link = linkData.properties.action_link;

    if (!WEBHOOK_URL) {
      console.warn("PASSWORD_RESET_WEBHOOK_URL not configured; skipping outbound POST");
      return ok();
    }

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "password.reset",
          email,
          phone: identity.phone,
          full_name: identity.full_name,
          source_hint: identity.source_hint,
          reset_link,
          issued_at: new Date().toISOString(),
        }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.error("webhook non-2xx", res.status, txt.slice(0, 300));
      }
    } catch (whErr) {
      console.error("webhook post failed", whErr);
    }

    return ok();
  } catch (e) {
    console.error("password-reset-dispatch error", e);
    return ok();
  }
});
