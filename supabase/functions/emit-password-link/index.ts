// deno-lint-ignore-file no-explicit-any
// Generates a secure Supabase password link (create/reset) and dispatches it
// as an integration event so BotConversa/etc can deliver via WhatsApp.
// Always responds { ok: true } to avoid e-mail enumeration.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

type Kind = "create" | "reset";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Supabase OTP expiry defaults to 3600s (1h). Adjust if you raise it.
const LINK_TTL_SECONDS = 3600;

function normalizePhoneBR(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) return `+${digits}`;
  if (digits.length === 10 || digits.length === 11) return `+55${digits}`;
  return `+${digits}`;
}

async function pickIdentity(
  admin: ReturnType<typeof createClient>,
  userId: string,
): Promise<{ phone: string | null; full_name: string | null }> {
  const partner = await admin.from("partners").select("phone, name").eq("user_id", userId).maybeSingle();
  if (partner.data) {
    return {
      phone: (partner.data as any).phone ?? null,
      full_name: (partner.data as any).name ?? null,
    };
  }
  const mentee = await admin.from("mentees").select("phone, full_name").eq("user_id", userId).maybeSingle();
  if (mentee.data) {
    return {
      phone: (mentee.data as any).phone ?? null,
      full_name: (mentee.data as any).full_name ?? null,
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
    };
  }
  return { phone: null, full_name: null };
}

async function findUserIdByEmail(admin: ReturnType<typeof createClient>, email: string): Promise<string | null> {
  let page = 1;
  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) return null;
    const found = data.users.find((u) => (u.email || "").toLowerCase() === email);
    if (found) return found.id;
    if (data.users.length < 200) return null;
    page += 1;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const ok = () =>
    new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  if (req.method !== "POST") return ok();

  try {
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const body = await req.json().catch(() => ({} as any));
    const email = String(body?.email ?? "").trim().toLowerCase();
    const kindRaw = String(body?.kind ?? "reset").toLowerCase();
    const kind: Kind = kindRaw === "create" ? "create" : "reset";
    const origin =
      String(body?.origin ?? "").trim() ||
      req.headers.get("origin") ||
      "https://gabrielconsultor.com";
    const redirectTo = `${origin.replace(/\/+$/, "")}/app/redefinir-senha`;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return ok();

    const userId = await findUserIdByEmail(admin, email);
    if (!userId) {
      console.log("emit-password-link: no auth user for", email);
      return ok();
    }

    // Prefer explicit values sent by the caller (e.g. asaas-webhook already
    // knows the mentee's name/phone). Fall back to identity lookup.
    const identity = await pickIdentity(admin, userId);
    const nome = String(body?.name ?? "").trim() || identity.full_name || "";
    const phoneRaw = String(body?.phone ?? "").trim() || identity.phone || "";

    // Recovery link works for both create + reset (user already exists,
    // e-mail already confirmed by the provisioning flows). The `tipo` field
    // in the payload disambiguates for the external automation.
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo },
    });
    if (linkErr || !linkData?.properties?.action_link) {
      console.error("generateLink failed", linkErr);
      return ok();
    }
    const link = linkData.properties.action_link;
    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt.getTime() + LINK_TTL_SECONDS * 1000).toISOString();

    const eventKey = kind === "create" ? "user.password_create_link" : "user.password_reset_link";
    const tipo = kind === "create" ? "criacao_senha" : "redefinicao_senha";
    const payload = {
      nome,
      telefone_normalizado: normalizePhoneBR(phoneRaw),
      tipo,
      link,
      expira_em: expiresAt,
    };

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/integrations-dispatch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SERVICE_ROLE}`,
        },
        body: JSON.stringify({ event: eventKey, data: payload }),
      });
      const j = await res.json().catch(() => ({} as any));
      console.log("emit-password-link dispatched", eventKey, "count=", j?.dispatched ?? 0);
    } catch (whErr) {
      console.error("dispatch failed", whErr);
    }

    // Echo the generated link so the "Copiar link" button in Configurações
    // can show/copy the real recovery URL (the endpoint is only reachable
    // by an authenticated session in that UI).
    if (body?.return_link === true) {
      return new Response(JSON.stringify({ ok: true, link, expira_em: expiresAt }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return ok();
  } catch (e) {
    console.error("emit-password-link error", e);
    return ok();
  }
});
