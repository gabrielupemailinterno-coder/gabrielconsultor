import { useEffect, useState, ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

/**
 * Guard for /escola/* protected routes. Requires an authenticated session.
 * Any logged-in role can read (escola_user, mentee, scoreapp_user, partner, admin) —
 * RLS on blog_posts already restricts access to authenticated + published/admin.
 */
export function EscolaGuard({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [status, setStatus] = useState<"loading" | "in" | "out">("loading");

  useEffect(() => {
    let cancel = false;
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (!cancel) setStatus(data.session ? "in" : "out");
    };
    check();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!cancel) setStatus(s ? "in" : "out");
    });
    return () => {
      cancel = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }
  if (status === "out") {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/escola/login?next=${next}`} replace />;
  }
  return <>{children}</>;
}
