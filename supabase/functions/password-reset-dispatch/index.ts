// Public: generates a temporary password for a given identity (parceiro,
// mentorado ou scoreapp), updates it via Auth Admin API and POSTs the
// credentials to a single outbound webhook (BotConversa / WhatsApp forwarder).
//
// Sempre responde 200 { ok:true } para evitar enumeração de e-mails.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

type Source = "partner" | "mentee" | "scoreapp";

function genPassword(len = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => chars[n % chars.length]).join("");
}

const ok = () =>
  new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function findIdentity(
  admin: ReturnType<typeof createClient>,
  source: Source,
  email: string,
): Promise<{ user_id: string; phone: string | null; name: string | null } | null> {
  if (source === "partner") {
    const { data } = await admin
      .from("partners")
      .select("user_id, phone, name, email")
      .ilike("email", email)
      .maybeSingle();
    if (!data?.user_id) return null;
    return { user_id: data.user_id, phone: (data as any).phone ?? null, name: (data as any).name ?? null };
  }
  if (source === "mentee") {
    const { data } = await admin
      .from("mentees")
      .select("user_id, phone, full_name, email")
      .ilike("email", email)
      .maybeSingle();
    if (!data?.user_id) return null;
    return { user_id: data.user_id, phone: (data as any).phone ?? null, name: (data as any).full_name ?? null };
  }
  // scoreapp
  const { data } = await admin
    .from("score_profiles")
    .select("user_id, phone, full_name, email")
    .ilike("email", email)
    .maybeSingle();
  if (!data?.user_id) return null;
  return { user_id: data.user_id, phone: (data as any).phone ?? null, name: (data as any).full_name ?? null };
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
    const rawEmail = String(body?.email ?? "").trim().toLowerCase();
    const source = (String(body?.source ?? "").trim().toLowerCase() as Source);

    if (!rawEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) return ok();
    if (!["partner", "mentee", "scoreapp"].includes(source)) return ok();

    const identity = await findIdentity(admin, source, rawEmail);
    if (!identity) {
      console.log("password-reset-dispatch: no identity for", source, rawEmail);
      return ok();
    }

    const newPassword = genPassword(12);
    const { error: updErr } = await admin.auth.admin.updateUserById(identity.user_id, {
      password: newPassword,
      email_confirm: true,
    });
    if (updErr) {
      console.error("updateUserById failed", updErr);
      return ok();
    }

    // Reset password_changed_at flag when applicable (mentee portal banner)
    if (source === "mentee") {
      await admin.from("mentees").update({ password_changed_at: null }).ilike("email", rawEmail);
    }

    if (!WEBHOOK_URL) {
      console.warn("password-reset-dispatch: PASSWORD_RESET_WEBHOOK_URL not configured; skipping outbound POST");
      return ok();
    }

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "password.reset",
          source,
          email: rawEmail,
          phone: identity.phone,
          full_name: identity.name,
          temp_password: newPassword,
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
