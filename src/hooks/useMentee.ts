import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useImpersonation } from "./useImpersonation";

export type Mentee = {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  cpf: string | null;
  status: string;
  started_at: string | null;
  access_mode: "full" | "trial_then_paid" | "friend_promo";
  payment_status: "pending" | "paid";
  password_changed_at: string | null;
  plan: { id: string; name: string; total_meetings: number; duration_months: number } | null;
};

export function useMentee() {
  const [mentee, setMentee] = useState<Mentee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const { impersonation } = useImpersonation();

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) { if (active) { setLoading(false); setError("unauth"); } return; }
      const targetUserId =
        impersonation && impersonation.kind === "mentee"
          ? impersonation.userId
          : session.session.user.id;
      const { data, error } = await supabase
        .from("mentees")
        .select("id,user_id,full_name,email,phone,cpf,status,started_at,access_mode,payment_status,password_changed_at,plan:mentorship_plans(id,name,total_meetings,duration_months)")
        .eq("user_id", targetUserId)
        .maybeSingle();
      if (!active) return;
      if (error) setError(error.message);
      setMentee((data as any) ?? null);
      setLoading(false);
    };
    load();
    return () => { active = false; };
  }, [tick, impersonation?.userId, impersonation?.kind]);

  return { mentee, loading, error, reload: () => setTick((t) => t + 1) };
}
