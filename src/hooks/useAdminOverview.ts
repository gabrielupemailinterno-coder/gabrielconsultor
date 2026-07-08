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

export type OverviewMentee = {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
};

export type OverviewPartner = {
  id: string;
  name: string;
  partner_code: string;
  status: string;
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
  pendingCommissionsCount: number;
  pendingCommissionsCents: number;
  failedDeliveries7d: number;
  recentLeads: OverviewLead[];
  recentDeliveries: OverviewDelivery[];
  recentMentees: OverviewMentee[];
  recentPartners: OverviewPartner[];
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
    pendingCommissionsCount: 0,
    pendingCommissionsCents: 0,
    failedDeliveries7d: 0,
    recentLeads: [],
    recentDeliveries: [],
    recentMentees: [],
    recentPartners: [],
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
        supabase.from("page_visits").select("id", { count: "exact", head: true }).gte("created_at", since7),
        supabase.from("page_visits").select("session_id").gte("created_at", since7).limit(5000),
        supabase.from("page_clicks").select("id", { count: "exact", head: true }).gte("created_at", since7),
        supabase.from("page_sessions").select("duration_seconds").gte("started_at", since7).limit(2000),
        anyDb.from("mentees").select("id", { count: "exact", head: true }),
        anyDb.from("integration_webhooks").select("id", { count: "exact", head: true }).eq("enabled", true),
        supabase.from("leads").select("id,name,form_type,email,phone,created_at").order("created_at", { ascending: false }).limit(5),
        anyDb.from("integration_deliveries").select("id,event_key,status,status_code,created_at").order("created_at", { ascending: false }).limit(5),
        anyDb.from("mentees").select("id,full_name,email,created_at").order("created_at", { ascending: false }).limit(5),
        anyDb.from("partners").select("id,name,partner_code,status,created_at").order("created_at", { ascending: false }).limit(5),
        anyDb.from("partner_conversions").select("id", { count: "exact", head: true }).eq("commission_status", "pending"),
        anyDb.from("partner_conversions").select("commission_cents").eq("commission_status", "pending").limit(2000),
        anyDb.from("integration_deliveries").select("id", { count: "exact", head: true }).eq("status", "error").gte("created_at", since7),
      ]);

      if (cancelled) return;

      const val = (i: number): any => {
        const r = results[i];
        return r.status === "fulfilled" ? r.value : {};
      };

      const leadsTotal = val(0).count ?? 0;
      const leads7d = val(1).count ?? 0;
      const visits7d = val(2).count ?? 0;
      const visitsDataUnique = (val(3).data ?? []) as { session_id: string }[];
      const clicks7d = val(4).count ?? 0;
      const sessionsData = (val(5).data ?? []) as { duration_seconds: number }[];
      const menteesActive = val(6).count ?? 0;
      const integrationsEnabled = val(7).count ?? 0;
      const recentLeads = (val(8).data ?? []) as OverviewLead[];
      const recentDeliveries = (val(9).data ?? []) as OverviewDelivery[];
      const recentMentees = (val(10).data ?? []) as OverviewMentee[];
      const recentPartners = (val(11).data ?? []) as OverviewPartner[];
      const pendingCommissionsCount = val(12).count ?? 0;
      const pendingCommissionsRows = (val(13).data ?? []) as { commission_cents: number }[];
      const pendingCommissionsCents = pendingCommissionsRows.reduce(
        (a, r) => a + (r.commission_cents || 0),
        0,
      );
      const failedDeliveries7d = val(14).count ?? 0;

      const avgSessionSec = sessionsData.length
        ? Math.round(sessionsData.reduce((a, s) => a + (s.duration_seconds || 0), 0) / sessionsData.length)
        : 0;

      setState({
        loading: false,
        leadsTotal,
        leads7d,
        visits7d,
        visits7dUnique: new Set(visitsDataUnique.map((v) => v.session_id)).size,
        clicks7d,
        avgSessionSec,
        menteesActive,
        integrationsEnabled,
        pendingCommissionsCount,
        pendingCommissionsCents,
        failedDeliveries7d,
        recentLeads,
        recentDeliveries,
        recentMentees,
        recentPartners,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  return { ...state, refresh: () => setNonce((n) => n + 1) };
}
