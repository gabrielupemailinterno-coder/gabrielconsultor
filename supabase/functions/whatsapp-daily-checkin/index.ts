// Cron diário: dispara fluxo de check-in do BotConversa para quem optou e não registrou hoje.
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendDailyCheckin } from "../_shared/botconversa.ts";
import { requireAdminOrService } from "../_shared/require-admin.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function json(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function todayBRT(): string {
  const now = new Date();
  const brt = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  return brt.toISOString().slice(0, 10);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const dispatchSecret = Deno.env.get("DISPATCH_SECRET");
  const provided = req.headers.get("x-dispatch-secret");
  const secretOk = !!dispatchSecret && provided === dispatchSecret;
  if (!secretOk) {
    const authCheck = await requireAdminOrService(req, corsHeaders);
    if (authCheck instanceof Response) return authCheck;
  }
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
  const testUserId: string | undefined = body?.testUserId;
  const currentHour: number | undefined = body?.hour; // opcional: filtrar por daily_checkin_time

  if (testUserId) {
    const r = await sendDailyCheckin(testUserId);
    return json(r);
  }

  let q = admin
    .from("score_profiles")
    .select("user_id, full_name, phone, whatsapp_opt_in, daily_checkin_time")
    .eq("whatsapp_opt_in", true)
    .not("phone", "is", null);
  const { data: profiles } = await q;
  const today = todayBRT();
  const results: any[] = [];

  for (const p of (profiles ?? []) as any[]) {
    if (currentHour != null && typeof p.daily_checkin_time === "string") {
      const h = parseInt(p.daily_checkin_time.slice(0, 2), 10);
      if (h !== currentHour) continue;
    }
    const { data: existing } = await admin
      .from("score_daily_logs").select("id").eq("user_id", p.user_id).eq("date", today).maybeSingle();
    if (existing) { results.push({ user_id: p.user_id, skipped: "already logged" }); continue; }
    const r = await sendDailyCheckin(p.user_id);
    results.push({ user_id: p.user_id, ...r });
    await sleep(500);
  }

  return json({ ok: true, sent: results.length, results });
});
