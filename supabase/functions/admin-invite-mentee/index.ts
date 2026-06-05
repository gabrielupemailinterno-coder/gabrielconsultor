import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData.user) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", userData.user.id);
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

    // Find or create auth user
    let authUserId: string | undefined;
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const found = list?.users?.find((u: any) => (u.email ?? "").toLowerCase() === email.toLowerCase());
    if (found) {
      authUserId = found.id;
    } else {
      const redirectTo = `${req.headers.get("origin") ?? ""}/mentorados/login`;
      const { data: inv, error: invErr } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo });
      if (invErr) {
        return new Response(JSON.stringify({ error: `Falha ao convidar: ${invErr.message}` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      authUserId = inv.user?.id;
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

    return new Response(JSON.stringify({ ok: true, mentee_id: menteeId, invited: !found }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message ?? String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
