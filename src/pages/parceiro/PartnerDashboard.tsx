import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Loader2,
  Copy,
  Check,
  Plus,
  ExternalLink,
  LayoutDashboard,
  Link2,
  Receipt,
  Wallet,
  Megaphone,
  UserRound,
  MousePointerClick,
  Users,
  ShoppingBag,
  Clock,
  CheckCircle2,
  BadgeDollarSign,
} from "lucide-react";
import { AppLayout } from "@/components/app/AppLayout";
import { PageHeader } from "@/components/app/PageHeader";
import { SectionCard } from "@/components/app/SectionCard";
import { KpiTile } from "@/components/app/KpiTile";
import { EmptyState } from "@/components/app/EmptyState";
import { StatusBadge } from "@/components/app/StatusBadge";
import { useImpersonation } from "@/hooks/useImpersonation";

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
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
};

type Attribution = { id: string; created_at: string; link_id: string | null };

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

/* ---------- Produtos e canais ---------- */

const PRODUCTS = [
  { key: "mentoria", label: "Mentoria Comercial", path: "/mentoria-profissional" },
  { key: "score", label: "Score Comercial", path: "/scoreapp" },
] as const;
type ProductKey = (typeof PRODUCTS)[number]["key"];

const productFromPath = (path: string): ProductKey | "outro" => {
  if (path.startsWith("/mentoria")) return "mentoria";
  if (path.startsWith("/scoreapp") || path.startsWith("/app/score") || path.startsWith("/app/planos")) return "score";
  return "outro";
};
const productLabel = (path: string) => {
  const p = productFromPath(path);
  if (p === "mentoria") return "Mentoria Comercial";
  if (p === "score") return "Score Comercial";
  return "Outro";
};

const CHANNELS = [
  { key: "instagram-bio", label: "Instagram Bio" },
  { key: "stories", label: "Stories" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "grupo", label: "Grupo" },
  { key: "indicacao", label: "Indicação Direta" },
  { key: "outro", label: "Outro" },
] as const;
type ChannelKey = (typeof CHANNELS)[number]["key"];
const channelLabel = (key?: string | null) =>
  CHANNELS.find((c) => c.key === key)?.label || "—";

const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32) || Math.random().toString(36).slice(2, 8);

/* ---------- Materiais de divulgação ---------- */

const materialTemplates = (code: string, origin: string) => {
  const mentoriaUrl = `${origin}/mentoria-profissional?ref=${encodeURIComponent(code)}`;
  const scoreUrl = `${origin}/scoreapp?ref=${encodeURIComponent(code)}`;
  return [
    {
      key: "wa-mentoria",
      title: "WhatsApp — Mentoria Comercial",
      channel: "WhatsApp",
      product: "Mentoria Comercial",
      body:
        `Fala! Se você quer previsibilidade no comercial (funil, processo e execução, sem teoria), ` +
        `recomendo a Mentoria do Gabriel Consultor. Entra pelo meu link 👉 ${mentoriaUrl}`,
    },
    {
      key: "wa-score",
      title: "WhatsApp — Score Comercial",
      channel: "WhatsApp",
      product: "Score Comercial",
      body:
        `Uso o Score Comercial pra manter minha rotina de vendas sob controle: check-in diário, ` +
        `metas e feedback com IA. Testa pelo meu link 👉 ${scoreUrl}`,
    },
    {
      key: "stories-mentoria",
      title: "Stories — Mentoria",
      channel: "Instagram Stories",
      product: "Mentoria Comercial",
      body:
        `Comercial travado? A Mentoria do Gabriel Consultor destrava. ` +
        `Link na figurinha 👇 ${mentoriaUrl}`,
    },
    {
      key: "bio-score",
      title: "Bio / link — Score Comercial",
      channel: "Instagram Bio",
      product: "Score Comercial",
      body: `Score Comercial • rotina de vendas com IA → ${scoreUrl}`,
    },
    {
      key: "indicacao",
      title: "Indicação direta",
      channel: "Indicação",
      product: "Mentoria + Score",
      body:
        `Oi! Lembrei de você. Trabalho com o Gabriel Consultor e acredito que a Mentoria ` +
        `(${mentoriaUrl}) ou o Score Comercial (${scoreUrl}) fazem sentido pro seu momento. ` +
        `Qualquer coisa me chama.`,
    },
  ];
};

/* ---------- Component ---------- */

type Tab = "resumo" | "links" | "conversoes" | "comissoes" | "materiais" | "perfil";

const TABS: { key: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "resumo", label: "Resumo", icon: LayoutDashboard },
  { key: "links", label: "Meus links", icon: Link2 },
  { key: "conversoes", label: "Conversões", icon: Receipt },
  { key: "comissoes", label: "Comissões", icon: Wallet },
  { key: "materiais", label: "Materiais", icon: Megaphone },
  { key: "perfil", label: "Perfil", icon: UserRound },
];

export default function PartnerDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [links, setLinks] = useState<PartnerLink[]>([]);
  const [clicks, setClicks] = useState<Attribution[]>([]);
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [tab, setTab] = useState<Tab>("resumo");
  const [form, setForm] = useState<{
    product: ProductKey;
    channel: ChannelKey;
    label: string;
    destination: string;
  }>({
    product: "mentoria",
    channel: "instagram-bio",
    label: "",
    destination: "/mentoria-profissional",
  });

  const { impersonation } = useImpersonation();

  useEffect(() => {
    (async () => {
      const { data: sessionRes } = await supabase.auth.getSession();
      if (!sessionRes.session) {
        navigate("/app/login", { replace: true });
        return;
      }
      const sessionUid = sessionRes.session.user.id;
      const uid =
        impersonation && impersonation.kind === "partner"
          ? impersonation.userId
          : sessionUid;

      // Session user must be partner OR admin (admin can impersonate)
      const { data: role } = await (supabase as any)
        .from("user_roles")
        .select("role")
        .eq("user_id", sessionUid)
        .in("role", ["partner", "admin"])
        .limit(1)
        .maybeSingle();
      if (!role) {
        toast({
          title: "Acesso negado",
          description: "Esta conta não está vinculada a um parceiro.",
          variant: "destructive",
        });
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
        toast({
          title: "Nenhum parceiro vinculado",
          description: impersonation
            ? "Este usuário não tem parceiro vinculado."
            : "Peça ao administrador para vincular sua conta.",
          variant: "destructive",
        });
        if (!impersonation) {
          await supabase.auth.signOut();
          navigate("/app/login", { replace: true });
        } else {
          navigate("/app/admin", { replace: true });
        }
        return;
      }
      setPartner(p as Partner);
      await reload(p.id);
      setLoading(false);
    })();
  }, [navigate, impersonation?.userId, impersonation?.kind]);

  const reload = async (partnerId: string) => {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const [lRes, aRes, cRes] = await Promise.all([
      (supabase as any)
        .from("partner_links")
        .select("*")
        .eq("partner_id", partnerId)
        .order("created_at", { ascending: false }),
      (supabase as any)
        .from("partner_attributions")
        .select("id, created_at, link_id")
        .eq("partner_id", partnerId)
        .gte("created_at", since),
      (supabase as any)
        .from("partner_conversions")
        .select("*")
        .eq("partner_id", partnerId)
        .order("created_at", { ascending: false }),
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
    const pending = conversions
      .filter((c) => c.commission_status === "pending")
      .reduce((a, b) => a + b.commission_cents, 0);
    const approved = conversions
      .filter((c) => c.commission_status === "approved")
      .reduce((a, b) => a + b.commission_cents, 0);
    const paid = conversions
      .filter((c) => c.commission_status === "paid")
      .reduce((a, b) => a + b.commission_cents, 0);
    return { clicks7, clicks30, leads, purchases, pending, approved, paid };
  }, [clicks, conversions]);

  const clicksByLink = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of clicks) {
      if (!c.link_id) continue;
      m.set(c.link_id, (m.get(c.link_id) || 0) + 1);
    }
    return m;
  }, [clicks]);

  const linkUrl = (slug: string) => `${window.location.origin}/r/${slug}`;

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    toast({ title: "Copiado" });
    setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
  };

  const onProductChange = (product: ProductKey) => {
    const p = PRODUCTS.find((x) => x.key === product)!;
    setForm((f) => ({ ...f, product, destination: p.path }));
  };

  const createLink = async () => {
    if (!partner) return;
    const label = form.label.trim() || channelLabel(form.channel);
    const dest = form.destination.trim() || "/";
    let slug = slugify(`${partner.partner_code}-${form.product}-${form.channel}-${label}`);
    const { data: existing } = await (supabase as any)
      .from("partner_links")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (existing) slug = `${slug}-${Math.random().toString(36).slice(2, 5)}`;

    const { error } = await (supabase as any).from("partner_links").insert({
      partner_id: partner.id,
      slug,
      label,
      destination: dest,
      active: true,
      utm_source: form.channel,
      utm_medium: "affiliate",
      utm_campaign: form.product,
    });
    if (error) {
      toast({ title: "Erro ao criar link", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Link criado" });
    setForm({
      product: "mentoria",
      channel: "instagram-bio",
      label: "",
      destination: "/mentoria-profissional",
    });
    setCreating(false);
    await reload(partner.id);
  };

  const toggleActive = async (link: PartnerLink) => {
    await (supabase as any)
      .from("partner_links")
      .update({ active: !link.active })
      .eq("id", link.id);
    if (partner) await reload(partner.id);
  };

  if (loading || !partner) {
    return (
      <AppLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const origin = window.location.origin;
  const refLink = `${origin}/?ref=${encodeURIComponent(partner.partner_code)}`;
  const materials = materialTemplates(partner.partner_code, origin);

  return (
    <AppLayout>
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Header */}
        <PageHeader
          eyebrow="Portal do Parceiro"
          title={partner.name}
          description={`Código ${partner.partner_code} • Comissão ${Number(partner.commission_rate).toFixed(0)}%`}
          actions={
            <StatusBadge tone={partner.status === "active" ? "success" : "warning"}>
              {partner.status === "active" ? "Ativo" : partner.status}
            </StatusBadge>
          }
        />

        {/* Link principal — sempre visível */}
        <SectionCard
          title="Link principal"
          description="Use este link genérico quando não quiser rastrear canal."
        >
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <code className="flex-1 font-mono text-xs bg-muted px-3 py-2 rounded truncate">
              {refLink}
            </code>
            <button
              onClick={() => copy(refLink, "ref")}
              className="text-xs bg-primary text-primary-foreground px-3 py-2 rounded inline-flex items-center justify-center gap-1"
            >
              {copied === "ref" ? <Check size={12} /> : <Copy size={12} />}
              Copiar
            </button>
          </div>
        </SectionCard>

        {/* Tabs */}
        <nav className="flex flex-wrap gap-1 border-b border-border">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={
                  "inline-flex items-center gap-1.5 px-3 py-2 text-xs uppercase tracking-widest border-b-2 -mb-px transition " +
                  (active
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground")
                }
              >
                <Icon size={13} />
                {t.label}
              </button>
            );
          })}
        </nav>

        {/* RESUMO */}
        {tab === "resumo" && (
          <>
            <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiTile icon={MousePointerClick} label="Cliques 7d" value={kpis.clicks7} />
              <KpiTile icon={MousePointerClick} label="Cliques 30d" value={kpis.clicks30} />
              <KpiTile icon={Users} label="Leads" value={kpis.leads} />
              <KpiTile icon={ShoppingBag} label="Compras" value={kpis.purchases} />
              <KpiTile icon={Clock} label="Comissão pendente" value={brl(kpis.pending)} sub="a aprovar" />
              <KpiTile
                icon={CheckCircle2}
                label="Comissão aprovada"
                value={brl(kpis.approved)}
                sub="a pagar"
                accent
              />
              <KpiTile icon={BadgeDollarSign} label="Comissão paga" value={brl(kpis.paid)} sub="acumulado" />
              <KpiTile label="Seu código" value={partner.partner_code} />
            </section>

            <SectionCard title="Como funciona" description="Divulgue, gere cliques, receba comissão.">
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Escolha o produto (Mentoria Comercial ou Score Comercial).</li>
                <li>Crie um link por canal (Instagram, WhatsApp, Grupo, etc).</li>
                <li>Compartilhe. Cada clique é registrado no seu código <strong className="text-foreground font-mono">{partner.partner_code}</strong>.</li>
                <li>Ao gerar uma compra atribuída, você recebe {Number(partner.commission_rate).toFixed(0)}% de comissão.</li>
              </ol>
            </SectionCard>
          </>
        )}

        {/* LINKS */}
        {tab === "links" && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-lg">Meus links</h2>
                <p className="text-xs text-muted-foreground">
                  Um link por canal para saber de onde vêm seus cliques.
                </p>
              </div>
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
                  <label className="space-y-1">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Produto
                    </span>
                    <select
                      value={form.product}
                      onChange={(e) => onProductChange(e.target.value as ProductKey)}
                      className="w-full bg-background border border-border rounded px-3 py-2 text-sm"
                    >
                      {PRODUCTS.map((p) => (
                        <option key={p.key} value={p.key}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Canal
                    </span>
                    <select
                      value={form.channel}
                      onChange={(e) =>
                        setForm({ ...form, channel: e.target.value as ChannelKey })
                      }
                      className="w-full bg-background border border-border rounded px-3 py-2 text-sm"
                    >
                      {CHANNELS.map((c) => (
                        <option key={c.key} value={c.key}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Rótulo (opcional)
                    </span>
                    <input
                      placeholder="Ex.: Bio principal, campanha X"
                      value={form.label}
                      onChange={(e) => setForm({ ...form, label: e.target.value })}
                      className="w-full bg-background border border-border rounded px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Destino
                    </span>
                    <input
                      value={form.destination}
                      onChange={(e) => setForm({ ...form, destination: e.target.value })}
                      className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono"
                    />
                  </label>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={createLink}
                    className="bg-primary text-primary-foreground text-xs px-4 py-2 rounded-md uppercase tracking-wide"
                  >
                    Criar link
                  </button>
                </div>
              </div>
            )}

            {links.length === 0 ? (
              <EmptyState
                title="Você ainda não criou links de divulgação."
                description="Crie seu primeiro link escolhendo produto e canal."
              />
            ) : (
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 text-[10px] uppercase tracking-widest text-muted-foreground">
                    <tr>
                      <th className="text-left px-4 py-2">Rótulo</th>
                      <th className="text-left px-4 py-2">Produto</th>
                      <th className="text-left px-4 py-2">Canal</th>
                      <th className="text-left px-4 py-2">URL</th>
                      <th className="text-right px-4 py-2">Cliques</th>
                      <th className="text-left px-4 py-2">Status</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {links.map((l) => {
                      const u = linkUrl(l.slug);
                      return (
                        <tr key={l.id} className="border-t border-border">
                          <td className="px-4 py-3">{l.label || "—"}</td>
                          <td className="px-4 py-3 text-xs">{productLabel(l.destination)}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {channelLabel(l.utm_source)}
                          </td>
                          <td className="px-4 py-3">
                            <code className="font-mono text-xs bg-muted px-2 py-1 rounded">{u}</code>
                            <div className="text-[10px] text-muted-foreground mt-1 font-mono">
                              → {l.destination}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-xs">
                            {clicksByLink.get(l.id) || 0}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => toggleActive(l)}
                              className={`text-xs px-2 py-1 rounded ${
                                l.active
                                  ? "bg-primary/15 text-primary"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {l.active ? "Ativo" : "Inativo"}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
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
            )}
          </section>
        )}

        {/* CONVERSÕES */}
        {tab === "conversoes" && (
          <section className="space-y-3">
            <div>
              <h2 className="font-serif text-lg">Conversões</h2>
              <p className="text-xs text-muted-foreground">
                Leads e compras atribuídas ao seu código nos últimos meses.
              </p>
            </div>
            {conversions.length === 0 ? (
              <EmptyState
                title="Nenhuma conversão atribuída ainda."
                description="Quando alguém que veio dos seus links virar lead ou comprar, aparece aqui."
              />
            ) : (
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 text-[10px] uppercase tracking-widest text-muted-foreground">
                    <tr>
                      <th className="text-left px-4 py-2">Data</th>
                      <th className="text-left px-4 py-2">Produto</th>
                      <th className="text-left px-4 py-2">Tipo</th>
                      <th className="text-right px-4 py-2">Valor</th>
                      <th className="text-right px-4 py-2">Comissão</th>
                      <th className="text-left px-4 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conversions.map((c) => {
                      const product =
                        c.source_table?.includes("score")
                          ? "Score Comercial"
                          : c.source_table?.includes("mentee") || c.source_table?.includes("mentor")
                          ? "Mentoria Comercial"
                          : c.source_table || "—";
                      return (
                        <tr key={c.id} className="border-t border-border">
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {new Date(c.created_at).toLocaleString("pt-BR")}
                          </td>
                          <td className="px-4 py-3 text-xs">{product}</td>
                          <td className="px-4 py-3">{c.kind === "lead" ? "Lead" : "Compra"}</td>
                          <td className="px-4 py-3 text-right font-mono text-xs">
                            {brl(c.amount_cents)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-xs">
                            {brl(c.commission_cents)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-xs px-2 py-1 rounded ${statusClass[c.commission_status]}`}
                            >
                              {statusLabel[c.commission_status]}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* COMISSÕES */}
        {tab === "comissoes" && (
          <section className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <KpiTile icon={Clock} label="Pendente" value={brl(kpis.pending)} sub="aguardando validação" />
              <KpiTile icon={CheckCircle2} label="Aprovada" value={brl(kpis.approved)} sub="a pagar" accent />
              <KpiTile icon={BadgeDollarSign} label="Paga" value={brl(kpis.paid)} sub="acumulado" />
            </div>
            <SectionCard title="Como funcionam os status">
              <ul className="text-sm space-y-2">
                <li>
                  <span className="inline-block w-24 text-xs font-medium">Pendente</span>
                  <span className="text-muted-foreground text-sm">
                    Venda registrada, aguardando validação (prazo de arrependimento / conferência).
                  </span>
                </li>
                <li>
                  <span className="inline-block w-24 text-xs font-medium">Aprovada</span>
                  <span className="text-muted-foreground text-sm">
                    Comissão confirmada e liberada para pagamento.
                  </span>
                </li>
                <li>
                  <span className="inline-block w-24 text-xs font-medium">Paga</span>
                  <span className="text-muted-foreground text-sm">
                    Comissão já paga a você.
                  </span>
                </li>
                <li>
                  <span className="inline-block w-24 text-xs font-medium">Cancelada</span>
                  <span className="text-muted-foreground text-sm">
                    Compra cancelada, estornada ou considerada inválida.
                  </span>
                </li>
              </ul>
            </SectionCard>
            <p className="text-xs text-muted-foreground">
              Pagamentos são feitos manualmente pelo admin. Em caso de dúvida sobre um status, fale
              com Gabriel Consultor.
            </p>
          </section>
        )}

        {/* MATERIAIS */}
        {tab === "materiais" && (
          <section className="space-y-3">
            <div>
              <h2 className="font-serif text-lg">Materiais para divulgar</h2>
              <p className="text-xs text-muted-foreground">
                Textos prontos com seu link já embutido. Copie e cole.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {materials.map((m) => (
                <div
                  key={m.key}
                  className="bg-card border border-border rounded-lg p-4 flex flex-col gap-3"
                >
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-primary">{m.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {m.channel} · {m.product}
                    </p>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.body}</p>
                  <div>
                    <button
                      onClick={() => copy(m.body, `mat-${m.key}`)}
                      className="text-xs bg-primary text-primary-foreground px-3 py-2 rounded inline-flex items-center gap-1"
                    >
                      {copied === `mat-${m.key}` ? <Check size={12} /> : <Copy size={12} />}
                      Copiar texto
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* PERFIL */}
        {tab === "perfil" && (
          <SectionCard title="Perfil do parceiro">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <Field label="Nome" value={partner.name} />
              <Field label="E-mail" value={partner.email || "—"} />
              <Field label="Código" value={partner.partner_code} mono />
              <Field label="Comissão" value={`${Number(partner.commission_rate).toFixed(0)}%`} />
              <Field label="Status" value={partner.status} />
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Para alterar seus dados de cadastro, fale com Gabriel Consultor.
            </p>
          </SectionCard>
        )}
      </main>
    </AppLayout>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={"mt-1 " + (mono ? "font-mono text-sm" : "text-sm")}>{value}</p>
    </div>
  );
}
