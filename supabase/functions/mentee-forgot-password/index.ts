import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

function genPassword(len = 14): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => chars[n % chars.length]).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Always respond ok to avoid email enumeration
  const okResponse = () => new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const body = await req.json().catch(() => ({}));
    const email = String(body?.email ?? "").trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return okResponse();
    }

    // Find mentee by email
    const { data: mentee } = await admin
      .from("mentees")
      .select("id,user_id,email,full_name")
      .ilike("email", email)
      .maybeSingle();

    if (!mentee?.user_id) {
      console.log("mentee-forgot-password: no mentee for", email);
      return okResponse();
    }

    const newPassword = genPassword(14);
    const { error: updErr } = await admin.auth.admin.updateUserById(mentee.user_id, {
      password: newPassword,
      email_confirm: true,
    });
    if (updErr) {
      console.error("updateUserById failed", updErr);
      return okResponse();
    }

    // Reset password_changed_at so portal shows "Defina sua senha" banner again
    await admin.from("mentees").update({ password_changed_at: null }).eq("id", mentee.id);

    try {
      await admin.functions.invoke("send-app-email", {
        body: {
          template: "welcome-mentee",
          to: mentee.email,
          subject: "Sua nova senha temporária · Portal do Mentorado",
          data: { fullName: mentee.full_name, email: mentee.email, tempPassword: newPassword },
        },
      });
    } catch (mailErr) {
      console.error("send welcome-mentee failed", mailErr);
    }

    return okResponse();
  } catch (e: any) {
    console.error("mentee-forgot-password error", e);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
