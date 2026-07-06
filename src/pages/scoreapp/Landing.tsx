import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

// /scoreapp — gated entry point. Redirects based on auth + payment state.
export default function ScoreLanding() {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        navigate("/conhecascoreapp", { replace: true });
        return;
      }
      // Sync payment status with Cora before deciding where to send the user
      try { await supabase.functions.invoke("cora-check-invoice", { body: {} }); } catch {}
      const { data } = await supabase
        .from("score_profiles")
        .select("payment_status, plan_status, plan_expires_at")
        .eq("user_id", sess.session.user.id)
        .maybeSingle();
      const active =
        data?.plan_status === "active" &&
        data?.payment_status === "paid" &&
        (!data?.plan_expires_at || new Date(data.plan_expires_at) > new Date());
      navigate(active ? "/scoreapp/app" : "/scoreapp/planos", { replace: true });
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="animate-spin text-primary" size={28} />
    </div>
  );
}
