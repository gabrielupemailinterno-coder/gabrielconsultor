import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Registers a portal session for the mentee and heartbeats it every 15s.
 * Used by admin to display "Último acesso" and "Tempo total online".
 */
export function useMenteePresence(menteeId: string | null | undefined, userId: string | null | undefined) {
  const sessionIdRef = useRef<string | null>(null);
  const startRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!menteeId || !userId) return;
    let cancelled = false;
    startRef.current = Date.now();

    (async () => {
      const { data, error } = await supabase
        .from("mentee_sessions")
        .insert({
          mentee_id: menteeId,
          user_id: userId,
          user_agent: navigator.userAgent,
          duration_seconds: 0,
        })
        .select("id")
        .single();
      if (cancelled || error || !data) return;
      sessionIdRef.current = data.id;
    })();

    const flush = () => {
      const id = sessionIdRef.current;
      if (!id) return;
      const seconds = Math.floor((Date.now() - startRef.current) / 1000);
      supabase
        .from("mentee_sessions")
        .update({ duration_seconds: seconds, last_seen_at: new Date().toISOString() })
        .eq("id", id)
        .then(() => {});
    };

    const interval = window.setInterval(flush, 15000);
    window.addEventListener("beforeunload", flush);
    window.addEventListener("pagehide", flush);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("beforeunload", flush);
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [menteeId, userId]);
}
