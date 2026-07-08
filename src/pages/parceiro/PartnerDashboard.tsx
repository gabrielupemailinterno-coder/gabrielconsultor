import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, LogOut, Copy, Check, Plus, ExternalLink } from "lucide-react";

type Partner = {
  id: string;
  name: string;
  email: string | null;
  partner_code: string;
  commission_rate: number;
  status: string;
};

type PartnerLink = {
  id: string;
  partner_id: string;
  slug: string;
  label: string | null;
  destination: string;
  active: boolean;
  created_at: string;
};

type Attribution = { id: string; created_at: string };

type Conversion = {
  id: string;
  kind: "lead" | "purchase";
  amount_cents: number | null;
  commission_cents: number;
  commission_status: "pending" | "approved" | "paid" | "canceled";
  created_at: string;
  source_table: string;
};

const brl = (cents: number | null | undefined) =>
  ((cents || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const statusLabel: Record<Conversion["commission_status"], string> = {
  pending: "Pendente",
  approved: "Aprovada",
  paid: "Paga",
  canceled: "Cancelada",
};
const statusClass: Record<Conversion["commission_status"], string> = {
  pending: "bg-yellow-500/15 text-yellow-600",
  approved: "bg-primary/15 text-primary",
  paid: "bg-emerald-500/15 text-emerald-600",
  canceled: "bg-muted text-muted-foreground",
};

const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32) || Math.random().toString(36).slice(2, 8);

export default function PartnerDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [links, setLinks] = useState<PartnerLink[]>([]);
  const [clicks, setClicks] = useState<Attribution[]>([]);
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ label: "", destination: "/mentoria-profissional" });

  useEffect(() => {
    (async () => {
      const { data: sessionRes } = await supabase.auth.getSession();
      if (!sessionRes.session) {
        navigate("/app/login", { replace: true });
        return;
      }
      const uid = sessionRes.session.user.id;

      // Guard: must have partner role AND a partners row linked to uid
      const { data: role } = await (supabase as any)
        .from("user_roles")
        .select("role")
        .eq("user_id", uid)
        .in("role", ["partner", "admin"])
        .limit(1)
        .maybeSingle();
      if (!role) {
        toast({ title: "Acesso negado", description: "Esta conta não está vinculada a um parceiro.", variant: "destructive" });
        await supabase.auth.signOut();
        navigate("/app/login", { replace: true });
        return;
      }

      const { data: p } = await (supabase as any)
        .from("partners")
        .select("id, name, email, partner_code, commission_rate, status")
        .eq("user_id", uid)
        .maybeSingle();
      if (!p) {
        toast({ title: "Nenhum parceiro vinculado", description: "Peça ao administrador para vincular sua conta.", variant: "destructive" });
        await supabase.auth.signOut();
        navigate("/app/login", { replace: true });
        return;
      }
      setPartner(p as Partner);
      await reload(p.id);
      setLoading(false);
    })();
  }, [navigate]);

  const reload = async (partnerId: string) => {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const [lRes, aRes, cRes] = await Promise.all([
      (supabase as any).from("partner_links").select("*").eq("partner_id", partnerId).order("created_at", { ascending: false }),
      (supabase as any).from("partner_attributions").select("id, created_at").eq("partner_id", partnerId).gte("created_at", since),
      (supabase as any).from("partner_conversions").select("*").eq("partner_id", partnerId).order("created_at", { ascending: false }),
    ]);
    setLinks((lRes.data as PartnerLink[]) || []);
    setClicks((aRes.data as Attribution[]) || []);
    setConversions((cRes.data as Conversion[]) || []);
  };

  const kpis = useMemo(() => {
    const now = Date.now();
    const d7 = now - 7 * 24 * 60 * 60 * 1000;
    const clicks7 = clicks.filter((c) => new Date(c.created_at).getTime() >= d7).length;
    const clicks30 = clicks.length;
    const leads = conversions.filter((c) => c.kind === "lead").length;
    const purchases = conversions.filter((c) => c.kind === "purchase").length;
    const pending = conversions.filter((c) => c.commission_status === "pending").reduce((a, b) => a + b.commission_cents, 0);
    const approved = conversions.filter((c) => c.commission_status === "approved").reduce((a, b) => a + b.commission_cents, 0);
    const paid = conversions.filter((c) => c.commission_status === "paid").reduce((a, b) => a + b.commission_cents, 0);
    return { clicks7, clicks30, leads, purchases, pending, approved, paid };
  }, [clicks, conversions]);

  const linkUrl = (slug: string) => `${window.location.origin}/r/${slug}`;

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    toast({ title: "Copiado" });
    setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
  };

  const createLink = async () => {
    if (!partner) return;
    const label = form.label.trim() || "Link";
    const dest = form.destination.trim() || "/";
    let slug = slugify(`${partner.partner_code}-${label}`);
    // Ensure unique enough
    const { data: existing } = await (supabase as any).from("partner_links").select("id").eq("slug", slug).maybeSingle();
    if (existing) slug = `${slug}-${Math.random().toString(36).slice(2, 5)}`;

    const { error } = await (supabase as any).from("partner_links").insert({
      partner_id: partner.id,
      slug,
      label,
      destination: dest,
      active: true,
    });
    if (error) {
      toast({ title: "Erro ao criar link", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Link criado" });
    setForm({ label: "", destination: "/mentoria-profissional" });
    setCreating(false);
    await reload(partner.id);
  };

  const toggleActive = async (link: PartnerLink) => {
    await (supabase as any).from("partner_links").update({ active: !link.active }).eq("id", link.id);
    if (partner) await reload(partner.id);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/app/login", { replace: true });
  };

  if (loading || !partner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  const refLink = `${window.location.origin}/?ref=${encodeURIComponent(partner.partner_code)}`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-primary">Portal do Parceiro</p>
            <h1 className="font-serif text-xl">{partner.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden md:inline">
              Comissão: <strong className="text-foreground">{Number(partner.commission_rate).toFixed(0)}%</strong>
            </span>
            <button onClick={logout} className="text-xs inline-flex items-center gap-1 bg-muted px-3 py-2 rounded-md">
              <LogOut size={12} /> Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-8">
        {/* KPIs */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi label="Cliques 7d" value={String(kpis.clicks7)} />
          <Kpi label="Cliques 30d" value={String(kpis.clicks30)} />
          <Kpi label="Leads" value={String(kpis.leads)} />
          <Kpi label="Compras" value={String(kpis.purchases)} />
          <Kpi label="Comissão pendente" value={brl(kpis.pending)} tone="yellow" />
          <Kpi label="Comissão aprovada" value={brl(kpis.approved)} tone="primary" />
          <Kpi label="Comissão paga" value={brl(kpis.paid)} tone="emerald" />
          <Kpi label="Seu código" value={partner.partner_code} mono />
        </section>

        {/* Default ref link */}
        <section className="bg-card border border-border rounded-lg p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Link padrão (site inicial)</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 font-mono text-xs bg-muted px-3 py-2 rounded truncate">{refLink}</code>
            <button
              onClick={() => copy(refLink, "ref")}
              className="text-xs bg-primary text-primary-foreground px-3 py-2 rounded inline-flex items-center gap-1"
            >
              {copied === "ref" ? <Check size={12} /> : <Copy size={12} />}
              Copiar
            </button>
          </div>
        </section>

        {/* Kits prontos de divulgação */}
        <section className="space-y-3">
          <div>
            <h2 className="font-serif text-lg">Kits de divulgação</h2>
            <p className="text-xs text-muted-foreground">
              Links e textos prontos para vender Mentoria e ScoreApp com seu código <strong className="text-foreground font-mono">{partner.partner_code}</strong>.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                key: "mentoria",
                title: "Mentoria Profissional",
                desc: "Programa 1:1 para founders e times comerciais.",
                path: "/mentoria-profissional",
                pitch:
                  "Se você quer previsibilidade no seu comercial, recomendo a Mentoria do Gabriel Consultor: processo, funil e execução prática, sem teoria. Entra pelo meu link 👉",
              },
              {
                key: "scoreapp",
                title: "ScoreApp (autogestão)",
                desc: "App de rotina comercial + IA. Assinatura mensal.",
                path: "/scoreapp",
                pitch:
                  "Ferramenta que uso para manter minha rotina comercial sob controle. Score diário, metas e feedback com IA. Testa pelo meu link 👉",
              },
              {
                key: "planos",
                title: "ScoreApp — Planos",
                desc: "Vai direto para a página de assinatura.",
                path: "/app/planos",
                pitch:
                  "Assinatura do ScoreApp com desconto de indicação. Assine pelo meu link 👉",
              },
            ].map((kit) => {
              const url = `${window.location.origin}${kit.path}?ref=${encodeURIComponent(partner.partner_code)}`;
              const pitch = `${kit.pitch} ${url}`;
              return (
                <div key={kit.key} className="bg-card border border-border rounded-lg p-4 flex flex-col gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-primary">{kit.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{kit.desc}</p>
                  </div>
                  <code className="font-mono text-[11px] bg-muted px-2 py-2 rounded break-all">{url}</code>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => copy(url, `kit-url-${kit.key}`)}
                      className="text-xs bg-primary text-primary-foreground px-3 py-2 rounded inline-flex items-center gap-1"
                    >
                      {copied === `kit-url-${kit.key}` ? <Check size={12} /> : <Copy size={12} />} Copiar link
                    </button>
                    <button
                      onClick={() => copy(pitch, `kit-pitch-${kit.key}`)}
                      className="text-xs bg-muted hover:bg-muted/70 px-3 py-2 rounded inline-flex items-center gap-1"
                    >
                      {copied === `kit-pitch-${kit.key}` ? <Check size={12} /> : <Copy size={12} />} Copiar texto
                    </button>
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs bg-muted hover:bg-muted/70 px-3 py-2 rounded inline-flex items-center gap-1"
                    >
                      <ExternalLink size={12} /> Abrir
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Links */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg">Meus links</h2>
            <button
              onClick={() => setCreating((v) => !v)}
              className="inline-flex items-center gap-1 bg-primary text-primary-foreground text-xs px-3 py-2 rounded-md uppercase tracking-wide"
            >
              <Plus size={14} /> {creating ? "Cancelar" : "Novo link"}
            </button>
          </div>

          {creating && (
            <div className="bg-card border border-border rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  placeholder="Rótulo (ex: Instagram bio)"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  className="bg-background border border-border rounded px-3 py-2 text-sm"
                />
                <select
                  value={form.destination}
                  onChange={(e) => setForm({ ...form, destination: e.target.value })}
                  className="bg-background border border-border rounded px-3 py-2 text-sm"
                >
                  <option value="/">Home</option>
                  <option value="/mentoria-profissional">Mentoria Profissional</option>
                  <option value="/scoreapp">ScoreApp</option>
                  <option value="/parceiros">Parceiros</option>
                  <option value="/simulador-up">Simulador UP</option>
                </select>
              </div>
              <div className="flex justify-end">
                <button onClick={createLink} className="bg-primary text-primary-foreground text-xs px-4 py-2 rounded-md uppercase tracking-wide">
                  Criar link
                </button>
              </div>
            </div>
          )}

          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-[10px] uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2">Rótulo</th>
                  <th className="text-left px-4 py-2">Destino</th>
                  <th className="text-left px-4 py-2">URL</th>
                  <th className="text-left px-4 py-2">Ativo</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {links.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-muted-foreground py-8 text-sm">
                      Você ainda não criou links.
                    </td>
                  </tr>
                )}
                {links.map((l) => {
                  const u = linkUrl(l.slug);
                  return (
                    <tr key={l.id} className="border-t border-border">
                      <td className="px-4 py-3">{l.label || "—"}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{l.destination}</td>
                      <td className="px-4 py-3">
                        <code className="font-mono text-xs bg-muted px-2 py-1 rounded">{u}</code>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleActive(l)}
                          className={`text-xs px-2 py-1 rounded ${l.active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}
                        >
                          {l.active ? "Ativo" : "Inativo"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1">
                        <button
                          onClick={() => copy(u, l.id)}
                          className="inline-flex items-center gap-1 text-xs bg-muted hover:bg-muted/70 px-2 py-1 rounded"
                        >
                          {copied === l.id ? <Check size={12} /> : <Copy size={12} />}
                          Copiar
                        </button>
                        <a
                          href={u}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs bg-muted hover:bg-muted/70 px-2 py-1 rounded"
                        >
                          <ExternalLink size={12} /> Abrir
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Conversions */}
        <section className="space-y-3">
          <h2 className="font-serif text-lg">Conversões</h2>
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-[10px] uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2">Data</th>
                  <th className="text-left px-4 py-2">Tipo</th>
                  <th className="text-left px-4 py-2">Origem</th>
                  <th className="text-right px-4 py-2">Valor</th>
                  <th className="text-right px-4 py-2">Comissão</th>
                  <th className="text-left px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {conversions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-muted-foreground py-8 text-sm">
                      Nenhuma conversão ainda.
                    </td>
                  </tr>
                )}
                {conversions.map((c) => (
                  <tr key={c.id} className="border-t border-border">
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(c.created_at).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">{c.kind === "lead" ? "Lead" : "Compra"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{c.source_table}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs">{brl(c.amount_cents)}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs">{brl(c.commission_cents)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded ${statusClass[c.commission_status]}`}>
                        {statusLabel[c.commission_status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function Kpi({
  label,
  value,
  tone,
  mono,
}: {
  label: string;
  value: string;
  tone?: "primary" | "yellow" | "emerald";
  mono?: boolean;
}) {
  const toneClass =
    tone === "primary"
      ? "text-primary"
      : tone === "yellow"
      ? "text-yellow-600"
      : tone === "emerald"
      ? "text-emerald-600"
      : "";
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl ${mono ? "font-mono" : "font-mono"} ${toneClass}`}>{value}</p>
    </div>
  );
}
