import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";
import { ADMIN_LABELS, ADMIN_GROUP_OF, type AdminView } from "@/components/admin/AdminSidebar";
import DashboardOverview from "@/components/admin/DashboardOverview";

import BlogAdmin from "@/components/BlogAdmin";
import MenteesAdmin from "@/components/admin/MenteesAdmin";
import MenteeEmailComposer from "@/components/admin/MenteeEmailComposer";
import ProspectingBulk from "@/components/admin/ProspectingBulk";
import WhatsAppAdmin from "@/components/admin/whatsapp/WhatsAppAdmin";
import WhatsAppRitualAdmin from "@/components/admin/WhatsAppRitualAdmin";
import BotFlowsAdmin from "@/components/admin/BotFlowsAdmin";
import ScoreAdmin from "@/components/admin/ScoreAdmin";
import BotConversaAdmin from "@/components/admin/BotConversaAdmin";
import IntegrationsAdmin from "@/components/admin/IntegrationsAdmin";
import ContentsAdmin from "@/components/admin/ContentsAdmin";
import PartnersAdmin from "@/components/admin/PartnersAdmin";
import SettingsAdmin from "@/components/admin/SettingsAdmin";

import LeadsTable, { type Lead } from "@/components/admin/analytics/LeadsTable";
import VisitsTable from "@/components/admin/analytics/VisitsTable";
import ClicksTable from "@/components/admin/analytics/ClicksTable";
import SessionsTable from "@/components/admin/analytics/SessionsTable";

type Visit = { id: string; session_id: string; path: string; referrer: string | null; user_agent: string | null; created_at: string };
type Click = { id: string; session_id: string; element_type: string | null; element_label: string | null; created_at: string };
type Session = { session_id: string; duration_seconds: number; started_at: string; referrer: string | null };

const VALID_VIEWS: AdminView[] = [
  "overview", "mentees", "score", "conteudos", "partners", "emails", "prospect", "whatsapp",
  "ritual", "botflow", "botconversa", "integrations", "leads", "visits", "clicks", "sessions", "blog", "settings",
];

const getInitialView = (): AdminView => {
  if (typeof window === "undefined") return "overview";
  const v = new URLSearchParams(window.location.search).get("view") as AdminView | null;
  return v && VALID_VIEWS.includes(v) ? v : "overview";
};

const Admin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");

  const [leads, setLeads] = useState<Lead[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [clicks, setClicks] = useState<Click[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [leadsTotal, setLeadsTotal] = useState(0);
  const [visitsTotal, setVisitsTotal] = useState(0);
  const [clicksTotal, setClicksTotal] = useState(0);
  const [sessionsTotal, setSessionsTotal] = useState(0);
  const [view, setView] = useState<AdminView>(getInitialView);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth", { replace: true });
        return;
      }
      setUserEmail(session.user.email || "");
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id);
      const admin = (roles || []).some((r: any) => r.role === "admin");
      setIsAdmin(admin);
      setChecking(false);
      if (admin) loadData();
    })();
  }, [navigate]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (view === "overview") url.searchParams.delete("view");
    else url.searchParams.set("view", view);
    const next = url.pathname + (url.search ? url.search : "");
    if (next !== location.pathname + location.search) {
      window.history.replaceState({}, "", url.toString());
    }
  }, [view, location.pathname, location.search]);

  // Sync from URL changes (e.g. sidebar nav)
  useEffect(() => {
    const v = new URLSearchParams(location.search).get("view") as AdminView | null;
    const next = v && VALID_VIEWS.includes(v) ? v : "overview";
    setView((prev) => (prev === next ? prev : next));
  }, [location.search]);

  const loadData = async () => {
    const [l, v, c, s, lc, vc, cc, sc] = await Promise.all([
      supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("page_visits").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("page_clicks").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("page_sessions").select("session_id, duration_seconds, started_at, referrer").order("started_at", { ascending: false }).limit(500),
      supabase.from("leads").select("*", { count: "exact", head: true }),
      supabase.from("page_visits").select("*", { count: "exact", head: true }),
      supabase.from("page_clicks").select("*", { count: "exact", head: true }),
      supabase.from("page_sessions").select("*", { count: "exact", head: true }),
    ]);
    setLeads((l.data as Lead[]) || []);
    setVisits((v.data as Visit[]) || []);
    setClicks((c.data as Click[]) || []);
    setSessions((s.data as Session[]) || []);
    setLeadsTotal(lc.count ?? 0);
    setVisitsTotal(vc.count ?? 0);
    setClicksTotal(cc.count ?? 0);
    setSessionsTotal(sc.count ?? 0);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  const deleteLead = async (id: string) => {
    if (!confirm("Excluir este cadastro?")) return;
    await supabase.from("leads").delete().eq("id", id);
    setLeads(leads.filter((l) => l.id !== id));
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h1 className="font-serif text-2xl mb-2">Acesso negado</h1>
        <p className="text-muted-foreground text-sm mb-6">
          A conta <strong>{userEmail}</strong> não tem permissão de administrador.
        </p>
        <button
          onClick={handleLogout}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-md text-sm uppercase tracking-wide"
        >
          Sair
        </button>
      </div>
    );
  }

  const counts: Partial<Record<AdminView, number>> = {
    leads: leadsTotal,
    visits: visitsTotal,
    clicks: clicksTotal,
    sessions: sessionsTotal,
  };

  const title = ADMIN_LABELS[view] || "Painel";
  const breadcrumb = ADMIN_GROUP_OF[view];

  return (
    <AdminLayout
      view={view}
      onChangeView={setView}
      counts={counts}
      userEmail={userEmail}
      onLogout={handleLogout}
      title={title}
      breadcrumb={breadcrumb}
    >
      {view === "overview" && <DashboardOverview onNavigate={setView} />}
      {view === "mentees" && <MenteesAdmin />}
      {view === "score" && <ScoreAdmin />}
      {view === "conteudos" && <ContentsAdmin />}
      {view === "partners" && <PartnersAdmin />}
      {view === "emails" && <MenteeEmailComposer />}
      {view === "prospect" && <ProspectingBulk />}
      {view === "whatsapp" && <WhatsAppAdmin />}
      {view === "ritual" && <WhatsAppRitualAdmin />}
      {view === "botflow" && <BotFlowsAdmin />}
      {view === "botconversa" && <BotConversaAdmin />}
      {view === "integrations" && <IntegrationsAdmin />}
      {view === "leads" && <LeadsTable leads={leads} onDelete={deleteLead} />}
      {view === "visits" && <VisitsTable visits={visits} />}
      {view === "clicks" && <ClicksTable clicks={clicks} />}
      {view === "sessions" && <SessionsTable sessions={sessions} />}
      {view === "blog" && <BlogAdmin />}
      {view === "settings" && <SettingsAdmin onNavigate={setView} />}
    </AdminLayout>
  );
};

export default Admin;
