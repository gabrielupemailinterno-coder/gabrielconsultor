import { CORS, json, requireAuthUser, sendDailyCheckin } from "../_shared/botconversa.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
  const check = await requireAuthUser(req);
  if (check instanceof Response) return check;
  let body: any = {};
  try { body = await req.json(); } catch {}
  const targetUserId = body?.user_id || check.userId;
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  if (targetUserId !== check.userId) {
    const { data: role } = await admin.from("user_roles").select("role").eq("user_id", check.userId).eq("role", "admin").maybeSingle();
    if (!role) return json({ error: "forbidden" }, 403);
  }
  // Valida assinatura ativa e whatsapp válido
  const { data: p } = await admin
    .from("score_profiles")
    .select("phone, plan, plan_expires_at, whatsapp_opt_in")
    .eq("user_id", targetUserId)
    .maybeSingle();
  if (!p) return json({ error: "perfil não encontrado" }, 404);
  if (!p.phone) return json({ error: "sem WhatsApp cadastrado" }, 400);
  if (p.whatsapp_opt_in === false) return json({ error: "opt-in desativado" }, 400);
  const active = p.plan_expires_at ? new Date(p.plan_expires_at) > new Date() : p.plan !== "free";
  if (!active && p.plan === "free") {
    // Ainda deixamos passar? Preferimos deixar; check-in é diagnóstico. Comentar linha abaixo para bloquear.
    // return json({ error: "assinatura inativa" }, 400);
  }
  const r = await sendDailyCheckin(targetUserId);
  return json(r, r.ok ? 200 : 400);
});
