import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type OverviewLead = {
  id: string;
  name: string;
  form_type: string;
  email: string;
  phone: string;
  created_at: string;
};

export type OverviewDelivery = {
  id: string;
  event_key: string | null;
  status: string | null;
  status_code: number | null;
  created_at: string;
};

export interface AdminOverview {
  loading: boolean;
  leadsTotal: number;
  leads7d: number;
  visits7d: number;
  visits7dUnique: number;
  clicks7d: number;
  avgSessionSec: number;
  menteesActive: number;
  integrationsEnabled: number;
  recentLeads: OverviewLead[];
  recentDeliveries: OverviewDelivery[];
  refresh: () => void;
}

const daysAgoISO = (d: number) => new Date(Date.now() - d * 86400000).toISOString();

export function useAdminOverview(): AdminOverview {
  const [state, setState] = useState<Omit<AdminOverview, "refresh">>({
    loading: true,
    leadsTotal: 0,
    leads7d: 0,
    visits7d: 0,
    visits7dUnique: 0,
    clicks7d: 0,
    avgSessionSec: 0,
    menteesActive: 0,
    integrationsEnabled: 0,
    recentLeads: [],
    recentDeliveries: [],
  });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const since7 = daysAgoISO(7);
      const anyDb = supabase as any;
      const results = await Promise.allSettled([
        supabase.from("leads").select("id", { count: "exact", head: true }),
        supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", since7),
        supabase.from("page_visits").select("session_id").gte("created_at", since7).limit(5000),
        supabase.from("page_clicks").select("id", { count: "exact", head: true }).gte("created_at", since7),
        supabase.from("page_sessions").select("duration_seconds").gte("started_at", since7).limit(2000),
        anyDb.from("mentees").select("id", { count: "exact", head: true }),
        anyDb.from("integration_webhooks").select("id", { count: "exact", head: true }).eq("enabled", true),
        supabase.from("leads").select("id,name,form_type,email,phone,created_at").order("created_at", { ascending: false }).limit(5),
        anyDb.from("integration_deliveries").select("id,event_key,status,status_code,created_at").order("created_at", { ascending: false }).limit(5),
      ]);

      if (cancelled) return;

      const val = (i: number): any => {
        const r = results[i];
        return r.status === "fulfilled" ? r.value : {};
      };

      const leadsTotal = val(0).count ?? 0;
      const leads7d = val(1).count ?? 0;
      const visitsData = (val(2).data ?? []) as { session_id: string }[];
      const clicks7d = val(3).count ?? 0;
      const sessionsData = (val(4).data ?? []) as { duration_seconds: number }[];
      const menteesActive = val(5).count ?? 0;
      const integrationsEnabled = val(6).count ?? 0;
      const recentLeads = (val(7).data ?? []) as OverviewLead[];
      const recentDeliveries = (val(8).data ?? []) as OverviewDelivery[];

      const avgSessionSec = sessionsData.length
        ? Math.round(sessionsData.reduce((a, s) => a + (s.duration_seconds || 0), 0) / sessionsData.length)
        : 0;

      setState({
        loading: false,
        leadsTotal,
        leads7d,
        visits7d: visitsData.length,
        visits7dUnique: new Set(visitsData.map((v) => v.session_id)).size,
        clicks7d,
        avgSessionSec,
        menteesActive,
        integrationsEnabled,
        recentLeads,
        recentDeliveries,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  return { ...state, refresh: () => setNonce((n) => n + 1) };
}
