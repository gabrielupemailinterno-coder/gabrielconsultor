import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { savePartnerRef } from "@/lib/partnerRef";
import { supabase } from "@/integrations/supabase/client";

// Mount once at app root. Watches every navigation for ?ref= / ?partner=
// and persists it, plus fires a fire-and-forget click ping.
export function usePartnerRefCapture() {
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = (params.get("ref") || params.get("partner") || "").trim();
    if (!code) return;
    savePartnerRef(code);

    // Fire-and-forget click ping (RLS on partner_attributions blocks client insert;
    // edge function uses service role and validates the code).
    const sessionId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);

    void supabase.functions
      .invoke("partner-track", {
        body: {
          partner_code: code,
          session_id: sessionId,
          destination: location.pathname,
          referrer: typeof document !== "undefined" ? document.referrer : null,
        },
      })
      .catch(() => {
        // silent
      });
  }, [location.pathname, location.search]);
}
