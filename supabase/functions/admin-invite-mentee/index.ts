import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: claimsData, error: claimsErr } = await admin.auth.getClaims(token);
    const userId = claimsData?.claims?.sub;
    if (claimsErr || !userId) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", userId);
    if (!(roles ?? []).some((r: any) => r.role === "admin")) {
      return new Response(JSON.stringify({ error: "Acesso negado" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, full_name, phone, plan_id, lead_id } = await req.json();
    if (!email || !full_name) {
      return new Response(JSON.stringify({ error: "E-mail e nome são obrigatórios" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pick plan
    let planId = plan_id as string | undefined;
    if (!planId) {
      const { data: plan } = await admin.from("mentorship_plans").select("id").limit(1).maybeSingle();
      planId = plan?.id;
    }
    if (!planId) {
      return new Response(JSON.stringify({ error: "Nenhum plano configurado" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Already mentee?
    const { data: existing } = await admin.from("mentees").select("id,user_id").eq("email", email).maybeSingle();
    if (existing) {
      return new Response(JSON.stringify({ error: "Já existe mentorado com este e-mail", mentee_id: existing.id }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find or create auth user — always email-confirmed, with temp password
    let authUserId: string | undefined;
    let tempPassword: string | undefined;
    let isNewUser = false;
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const found = list?.users?.find((u: any) => (u.email ?? "").toLowerCase() === email.toLowerCase());
    if (found) {
      authUserId = found.id;
      // Sempre redefine a senha e confirma o e-mail para que o admin possa enviar credenciais válidas
      tempPassword = generatePassword(14);
      isNewUser = true;
      const { error: updErr } = await admin.auth.admin.updateUserById(found.id, {
        password: tempPassword,
        email_confirm: true,
      });
      if (updErr) {
        return new Response(JSON.stringify({ error: `Falha ao reativar usuário: ${updErr.message}` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      isNewUser = true;
      tempPassword = generatePassword(14);
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name },
      });
      if (createErr || !created.user) {
        return new Response(JSON.stringify({ error: `Falha ao criar usuário: ${createErr?.message ?? "desconhecido"}` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      authUserId = created.user.id;
    }

    if (!authUserId) {
      return new Response(JSON.stringify({ error: "Não foi possível criar usuário" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: menteeId, error: provErr } = await admin.rpc("provision_mentee", {
      _user_id: authUserId,
      _plan_id: planId,
      _full_name: full_name,
      _email: email,
      _phone: phone ?? null,
      _asaas_customer_id: null,
      _asaas_payment_id: null,
    });
    if (provErr) {
      return new Response(JSON.stringify({ error: `Falha provision: ${provErr.message}` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (lead_id) {
      await admin.from("leads").update({ converted_mentee_id: menteeId }).eq("id", lead_id);
    }

    // Welcome email with temp password (only for new users)
    if (isNewUser && tempPassword) {
      try {
        await admin.functions.invoke("send-app-email", {
          body: {
            template: "welcome-mentee",
            to: email,
            data: { fullName: full_name, email, tempPassword },
          },
        });
      } catch (mailErr) {
        console.warn("welcome-mentee send failed:", mailErr);
      }
    }

    // Dispara evento `user.password_create_link` com link seguro para WhatsApp
    if (isNewUser) {
      try {
        await admin.functions.invoke("emit-password-link", {
          body: { email, kind: "create", name: full_name, phone: phone ?? undefined },
        });
      } catch (e) {
        console.warn("emit-password-link (create) failed:", e);
      }
    }

    // Schedule-first-meeting nudge
    try {
      await admin.functions.invoke("send-app-email", {
        body: {
          template: "schedule-first-meeting",
          to: email,
          data: { fullName: full_name },
        },
      });
    } catch (mailErr) {
      console.warn("schedule-first-meeting send failed:", mailErr);
    }

    return new Response(JSON.stringify({ ok: true, mentee_id: menteeId, invited: !found }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message ?? String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function generatePassword(len: number) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => chars[n % chars.length]).join("");
}
