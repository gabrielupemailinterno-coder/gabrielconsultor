import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { DailyLog, ScoreGoals, ScoreProfile } from "@/lib/scoreapp/types";
import { useImpersonation } from "./useImpersonation";

export function useScoreData() {
  const [profile, setProfile] = useState<ScoreProfile | null>(null);
  const [goals, setGoals] = useState<ScoreGoals | null>(null);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);
  const { impersonation } = useImpersonation();

  const load = useCallback(async () => {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) { setLoading(false); return; }
    const userId =
      impersonation && impersonation.kind === "score"
        ? impersonation.userId
        : sess.session.user.id;
    setUid(userId);
    const [p, g, l] = await Promise.all([
      supabase.from("score_profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("score_goals").select("*").eq("user_id", userId).order("effective_from", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("score_daily_logs").select("*").eq("user_id", userId).order("date", { ascending: false }).limit(180),
    ]);
    setProfile((p.data as any) ?? null);
    setGoals((g.data as any) ?? null);
    setLogs((l.data as any) ?? []);
    // Only bump last_seen_at when it's really the logged-in user viewing themselves
    if (sess.session && userId === sess.session.user.id) {
      supabase.from("score_profiles").update({ last_seen_at: new Date().toISOString() }).eq("user_id", userId).then(() => {});
    }
    setLoading(false);
  }, [impersonation?.userId, impersonation?.kind]);

  useEffect(() => { load(); }, [load]);

  return { profile, goals, logs, loading, uid, reload: load };
}
