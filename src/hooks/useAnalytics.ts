import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "analytics_session_id";

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function useAnalytics(path: string = "/") {
  useEffect(() => {
    const sessionId = getSessionId();
    const startedAt = Date.now();
    const userAgent = navigator.userAgent;
    const referrer = document.referrer || null;
    const screenSize = `${window.screen.width}x${window.screen.height}`;
    const language = navigator.language;

    // Log visit + create/update session
    supabase.from("page_visits").insert({
      session_id: sessionId,
      path,
      referrer,
      user_agent: userAgent,
      screen_size: screenSize,
      language,
    }).then(() => {});

    supabase.from("page_sessions").upsert({
      session_id: sessionId,
      path,
      referrer,
      user_agent: userAgent,
      started_at: new Date(startedAt).toISOString(),
      last_seen_at: new Date(startedAt).toISOString(),
      duration_seconds: 0,
    }, { onConflict: "session_id" }).then(() => {});

    // Heartbeat: update duration every 15s
    const interval = window.setInterval(() => {
      const seconds = Math.floor((Date.now() - startedAt) / 1000);
      supabase.from("page_sessions").update({
        duration_seconds: seconds,
        last_seen_at: new Date().toISOString(),
      }).eq("session_id", sessionId).then(() => {});
    }, 15000);

    const flush = () => {
      const seconds = Math.floor((Date.now() - startedAt) / 1000);
      supabase.from("page_sessions").update({
        duration_seconds: seconds,
        last_seen_at: new Date().toISOString(),
      }).eq("session_id", sessionId).then(() => {});
    };
    window.addEventListener("beforeunload", flush);
    window.addEventListener("pagehide", flush);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("beforeunload", flush);
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [path]);
}

export function trackClick(elementType: string, elementLabel: string, path: string = window.location.pathname) {
  const sessionId = getSessionId();
  supabase.from("page_clicks").insert({
    session_id: sessionId,
    path,
    element_type: elementType,
    element_label: elementLabel,
  }).then(() => {});
}
