import { CORS, json, requireAuthUser, syncScoreUser } from "../_shared/botconversa.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const BOTCONVERSA_AUTOMATION_CATCH_URL =
  Deno.env.get("BOTCONVERSA_AUTOMATION_CATCH_URL") ||
  "https://new-backend.botconversa.com.br/api/v1/webhooks-automation/catch/195152/bPy747j1w2e4/";

function db() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

async function sendOnboardingAutomation(userId: string) {
  const admin = db();
  const { data: profile, error } = await admin
    .from("score_profiles")
    .select("full_name, phone")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !profile?.phone) {
    const message = error?.message || "perfil sem telefone";
    return { ok: false, error: message };
  }

  const payload = {
    nome: profile.full_name || "",
    telefone: String(profile.phone),
  };

  const res = await fetch(BOTCONVERSA_AUTOMATION_CATCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let body: any = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  return { ok: res.ok, response: body, status: res.status, payload };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
  const check = await requireAuthUser(req);
  if (check instanceof Response) return check;
  let body: any = {};
  try {
    body = await req.json();
  } catch {}
  const targetUserId = body?.user_id || check.userId;
  if (targetUserId !== check.userId) {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: role } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", check.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) return json({ error: "forbidden" }, 403);
  }
  await syncScoreUser(targetUserId);
  const r = await sendOnboardingAutomation(targetUserId);
  return json(r, r.ok ? 200 : 400);
});
