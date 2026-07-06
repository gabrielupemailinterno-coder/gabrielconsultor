import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users, MousePointerClick, Eye, Clock, LogOut, Trash2, Mail, Phone, Building2 } from "lucide-react";
import BlogAdmin from "@/components/BlogAdmin";
import MenteesAdmin from "@/components/admin/MenteesAdmin";
import InviteMenteeDialog from "@/components/admin/InviteMenteeDialog";
import MenteeEmailComposer from "@/components/admin/MenteeEmailComposer";
import ProspectingBulk from "@/components/admin/ProspectingBulk";
import WhatsAppAdmin from "@/components/admin/whatsapp/WhatsAppAdmin";
import ScoreAdmin from "@/components/admin/ScoreAdmin";
import { FORM_LABELS, type FormType } from "@/lib/qualifying-forms";

type Lead = {
  id: string;
  name: string;
  phone: string;
  email: string;
  company_name: string | null;
  revenue: string | null;
  main_pain: string | null;
  created_at: string;
  form_type: FormType;
  answers: Record<string, string | string[]> | null;
};

type Visit = { id: string; session_id: string; path: string; referrer: string | null; user_agent: string | null; created_at: string };
type Click = { id: string; session_id: string; element_type: string | null; element_label: string | null; created_at: string };
type Session = { session_id: string; duration_seconds: number; started_at: string; referrer: string | null };

const StatCard = ({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string | number; sub?: string }) => (
  <div className="bg-card border border-border rounded-lg p-5">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <Icon size={18} className="text-primary" />
    </div>
    <div className="text-3xl font-serif">{value}</div>
    {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
  </div>
);

const Admin = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");

  const [leads, setLeads] = useState<Lead[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [clicks, setClicks] = useState<Click[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [tab, setTab] = useState<"mentees" | "score" | "emails" | "prospect" | "whatsapp" | "leads" | "visits" | "clicks" | "sessions" | "blog">("mentees");
  const [leadFilter, setLeadFilter] = useState<FormType | "all">("all");

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

  const loadData = async () => {
    const [l, v, c, s] = await Promise.all([
      supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("page_visits").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("page_clicks").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("page_sessions").select("session_id, duration_seconds, started_at, referrer").order("started_at", { ascending: false }).limit(500),
    ]);
    setLeads((l.data as Lead[]) || []);
    setVisits((v.data as Visit[]) || []);
    setClicks((c.data as Click[]) || []);
    setSessions((s.data as Session[]) || []);
  };

  const stats = useMemo(() => {
    const uniqueVisitors = new Set(visits.map(v => v.session_id)).size;
    const avgDuration = sessions.length
      ? Math.round(sessions.reduce((a, s) => a + (s.duration_seconds || 0), 0) / sessions.length)
      : 0;
    return { uniqueVisitors, avgDuration };
  }, [visits, sessions]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  const deleteLead = async (id: string) => {
    if (!confirm("Excluir este cadastro?")) return;
    await supabase.from("leads").delete().eq("id", id);
    setLeads(leads.filter(l => l.id !== id));
  };

  if (checking) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h1 className="font-serif text-2xl mb-2">Acesso negado</h1>
        <p className="text-muted-foreground text-sm mb-6">A conta <strong>{userEmail}</strong> não tem permissão de administrador.</p>
        <button onClick={handleLogout} className="bg-primary text-primary-foreground px-6 py-3 rounded-md text-sm uppercase tracking-wide">Sair</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-xl">Painel Administrativo</h1>
            <p className="text-xs text-muted-foreground">{userEmail}</p>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition">
            <LogOut size={16} /> Sair
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Cadastros" value={leads.length} />
          <StatCard icon={Eye} label="Visitas" value={visits.length} sub={`${stats.uniqueVisitors} únicos`} />
          <StatCard icon={MousePointerClick} label="Cliques" value={clicks.length} />
          <StatCard icon={Clock} label="Tempo médio" value={`${stats.avgDuration}s`} />
        </div>

        <div className="flex gap-2 border-b border-border">
          {[
            { id: "mentees", label: "Mentorados" },
            { id: "emails", label: "E-mails" },
            { id: "prospect", label: "Prospecção" },
            { id: "whatsapp", label: "WhatsApp" },
            { id: "leads", label: `Cadastros (${leads.length})` },
            { id: "visits", label: `Visitas (${visits.length})` },
            { id: "clicks", label: `Cliques (${clicks.length})` },
            { id: "sessions", label: `Sessões (${sessions.length})` },
            { id: "blog", label: "Blog" },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`px-4 py-3 text-sm border-b-2 transition ${tab === t.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "mentees" && <MenteesAdmin />}
        {tab === "emails" && <MenteeEmailComposer />}
        {tab === "prospect" && <ProspectingBulk />}
        {tab === "whatsapp" && <WhatsAppAdmin />}

        {tab === "leads" && (() => {
          const types: Array<FormType | "all"> = ["all", "contato", "mentoria_1a1_vendedores", "consultoria_operacional", "mentoria_estrategica"];
          const counts: Record<string, number> = leads.reduce((acc, l) => {
            acc[l.form_type] = (acc[l.form_type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          const filtered = leadFilter === "all" ? leads : leads.filter(l => l.form_type === leadFilter);
          const badgeColor: Record<FormType, string> = {
            contato: "bg-muted text-muted-foreground border-border",
            mentoria_1a1_vendedores: "bg-primary/15 text-primary border-primary/30",
            consultoria_operacional: "bg-accent/15 text-accent border-accent/30",
            mentoria_estrategica: "bg-secondary text-foreground border-border",
          };
          return (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {types.map(t => {
                  const label = t === "all" ? "Todos" : FORM_LABELS[t];
                  const count = t === "all" ? leads.length : (counts[t] || 0);
                  const active = leadFilter === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setLeadFilter(t)}
                      className={`px-3.5 py-1.5 text-xs rounded-full border transition-colors ${active ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50"}`}
                    >
                      {label} <span className="opacity-70">({count})</span>
                    </button>
                  );
                })}
              </div>
              {filtered.length === 0 && <p className="text-muted-foreground text-sm">Nenhum cadastro neste filtro.</p>}
              {filtered.map(l => (
                <div key={l.id} className="bg-card border border-border rounded-lg p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-3 flex-wrap">
                        <h3 className="font-serif text-lg">{l.name}</h3>
                        <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeColor[l.form_type] || badgeColor.contato}`}>
                          {FORM_LABELS[l.form_type] || l.form_type}
                        </span>
                        <span className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString("pt-BR")}</span>
                      </div>
                      <div className="grid md:grid-cols-3 gap-2 mt-3 text-sm">
                        <a href={`mailto:${l.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary"><Mail size={14} /> {l.email}</a>
                        <a href={`tel:${l.phone}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary"><Phone size={14} /> {l.phone}</a>
                        {l.company_name && <span className="flex items-center gap-2 text-muted-foreground"><Building2 size={14} /> {l.company_name}</span>}
                      </div>
                      {l.answers && Object.keys(l.answers).length > 0 && (
                        <div className="mt-3 grid sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                          {Object.entries(l.answers).map(([k, v]) => (
                            <div key={k} className="flex gap-2">
                              <span className="text-muted-foreground capitalize">{k.replace(/_/g, " ")}:</span>
                              <span className="text-foreground">{Array.isArray(v) ? v.join(", ") : String(v)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {l.revenue && <p className="text-sm mt-2"><span className="text-muted-foreground">Faturamento:</span> {l.revenue}</p>}
                      {l.main_pain && !l.answers && <p className="text-sm mt-2 text-muted-foreground italic">"{l.main_pain}"</p>}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <InviteMenteeDialog
                        triggerLabel="Virar mentorado"
                        defaultName={l.name}
                        defaultEmail={l.email}
                        defaultPhone={l.phone}
                        leadId={l.id}
                      />
                      <button onClick={() => deleteLead(l.id)} className="text-muted-foreground hover:text-destructive transition"><Trash2 size={16} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        {tab === "visits" && (
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-secondary/30 text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="text-left p-3">Data</th><th className="text-left p-3">Sessão</th><th className="text-left p-3">Página</th><th className="text-left p-3">Origem</th></tr>
              </thead>
              <tbody>
                {visits.map(v => (
                  <tr key={v.id} className="border-t border-border">
                    <td className="p-3 whitespace-nowrap">{new Date(v.created_at).toLocaleString("pt-BR")}</td>
                    <td className="p-3 font-mono text-xs text-muted-foreground">{v.session_id.slice(0, 8)}</td>
                    <td className="p-3">{v.path}</td>
                    <td className="p-3 text-muted-foreground truncate max-w-xs">{v.referrer || "Direto"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "clicks" && (
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-secondary/30 text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="text-left p-3">Data</th><th className="text-left p-3">Tipo</th><th className="text-left p-3">Rótulo</th><th className="text-left p-3">Sessão</th></tr>
              </thead>
              <tbody>
                {clicks.map(c => (
                  <tr key={c.id} className="border-t border-border">
                    <td className="p-3 whitespace-nowrap">{new Date(c.created_at).toLocaleString("pt-BR")}</td>
                    <td className="p-3"><span className="px-2 py-0.5 bg-secondary rounded text-xs">{c.element_type}</span></td>
                    <td className="p-3">{c.element_label}</td>
                    <td className="p-3 font-mono text-xs text-muted-foreground">{c.session_id.slice(0, 8)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "sessions" && (
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-secondary/30 text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="text-left p-3">Início</th><th className="text-left p-3">Sessão</th><th className="text-left p-3">Tempo</th><th className="text-left p-3">Origem</th></tr>
              </thead>
              <tbody>
                {sessions.map(s => (
                  <tr key={s.session_id} className="border-t border-border">
                    <td className="p-3 whitespace-nowrap">{new Date(s.started_at).toLocaleString("pt-BR")}</td>
                    <td className="p-3 font-mono text-xs text-muted-foreground">{s.session_id.slice(0, 8)}</td>
                    <td className="p-3">{s.duration_seconds}s</td>
                    <td className="p-3 text-muted-foreground truncate max-w-xs">{s.referrer || "Direto"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "blog" && <BlogAdmin />}

      </main>
    </div>
  );
};

export default Admin;
