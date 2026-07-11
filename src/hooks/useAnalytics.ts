import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "analytics_session_id";
const EDIT_TOKEN_KEY = "analytics_session_edit_token";

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function getEditToken(): string {
  let token = sessionStorage.getItem(EDIT_TOKEN_KEY);
  if (!token) {
    token = crypto.randomUUID();
    sessionStorage.setItem(EDIT_TOKEN_KEY, token);
  }
  return token;
}

export function useAnalytics(path: string = "/") {
  useEffect(() => {
    const sessionId = getSessionId();
    const editToken = getEditToken();
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
      edit_token: editToken,
      started_at: new Date(startedAt).toISOString(),
      last_seen_at: new Date(startedAt).toISOString(),
      duration_seconds: 0,
    }, { onConflict: "session_id" }).then(() => {});

    const heartbeat = () => {
      const seconds = Math.floor((Date.now() - startedAt) / 1000);
      supabase.rpc("update_page_session_heartbeat", {
        p_session_id: sessionId,
        p_edit_token: editToken,
        p_duration_seconds: seconds,
        p_last_seen_at: new Date().toISOString(),
        p_path: path,
      }).then(() => {});
    };

    // Heartbeat every 15s
    const interval = window.setInterval(heartbeat, 15000);

    window.addEventListener("beforeunload", heartbeat);
    window.addEventListener("pagehide", heartbeat);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("beforeunload", heartbeat);
      window.removeEventListener("pagehide", heartbeat);
      heartbeat();
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
