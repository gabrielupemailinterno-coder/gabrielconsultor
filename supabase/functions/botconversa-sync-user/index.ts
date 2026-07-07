import { CORS, json, requireAuthUser, syncScoreUser } from "../_shared/botconversa.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
  const check = await requireAuthUser(req);
  if (check instanceof Response) return check;
  let body: any = {};
  try { body = await req.json(); } catch {}
  const targetUserId = body?.user_id || check.userId;
  // Se não é o próprio usuário, exigir admin
  if (targetUserId !== check.userId) {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: role } = await admin.from("user_roles").select("role").eq("user_id", check.userId).eq("role", "admin").maybeSingle();
    if (!role) return json({ error: "forbidden" }, 403);
  }
  const r = await syncScoreUser(targetUserId);
  return json(r, r.ok ? 200 : 400);
});
