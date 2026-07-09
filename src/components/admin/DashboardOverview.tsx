import {
  Users,
  UserPlus,
  Eye,
  MousePointerClick,
  Clock,
  Plug,
  Mail,
  MessageCircle,
  Bot,
  FileText,
  Send,
  Loader2,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Handshake,
  AlertTriangle,
  DollarSign,
  Trophy,
} from "lucide-react";
import KpiCard from "./KpiCard";
import QuickAction from "./QuickAction";
import { useAdminOverview } from "@/hooks/useAdminOverview";
import type { AdminView } from "./AdminSidebar";

interface Props {
  onNavigate: (v: AdminView) => void;
}

const timeAgo = (iso: string) => {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
};

const formatBRL = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function DashboardOverview({ onNavigate }: Props) {
  const o = useAdminOverview();

  if (o.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  const alerts: {
    key: string;
    tone: "warning" | "danger" | "info";
    title: string;
    description: string;
    action: () => void;
    cta: string;
  }[] = [];

  if (o.pendingCommissionsCount > 0) {
    alerts.push({
      key: "commissions",
      tone: "warning",
      title: `${o.pendingCommissionsCount} comissão(ões) pendente(s)`,
      description: `Total a pagar: ${formatBRL(o.pendingCommissionsCents)}.`,
      action: () => onNavigate("partners"),
      cta: "Ver parceiros",
    });
  }
  if (o.failedDeliveries7d > 0) {
    alerts.push({
      key: "deliveries",
      tone: "danger",
      title: `${o.failedDeliveries7d} disparo(s) com erro nos últimos 7 dias`,
      description: "Verifique webhooks e integrações externas.",
      action: () => onNavigate("integrations"),
      cta: "Abrir integrações",
    });
  }
  if (o.integrationsEnabled === 0) {
    alerts.push({
      key: "no-integrations",
      tone: "info",
      title: "Nenhuma integração ativa",
      description: "Ative webhooks para conectar leads e conversões a sistemas externos.",
      action: () => onNavigate("integrations"),
      cta: "Configurar",
    });
  }

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <h2 className="font-serif text-2xl">Visão Geral</h2>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mt-1">
              Últimos 7 dias
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard
            icon={UserPlus}
            label="Cadastros"
            value={o.leadsTotal}
            delta={{ value: o.leads7d, suffix: " 7d" }}
            sub="total histórico"
          />
          <KpiCard icon={Users} label="Mentorados" value={o.menteesActive} sub="ativos" />
          <KpiCard
            icon={Eye}
            label="Visitas"
            value={o.visits7d}
            sub={`${o.visits7dUnique} únicos`}
          />
          <KpiCard icon={MousePointerClick} label="Cliques" value={o.clicks7d} sub="7 dias" />
          <KpiCard
            icon={Clock}
            label="Tempo médio"
            value={`${o.avgSessionSec}s`}
            sub="por sessão"
          />
          <KpiCard
            icon={DollarSign}
            label="Comissões"
            value={o.pendingCommissionsCount}
            sub={formatBRL(o.pendingCommissionsCents) + " pendente"}
            accent
          />
        </div>
      </section>

      {alerts.length > 0 && (
        <section>
          <h3 className="font-serif text-lg mb-3">Pendências & alertas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {alerts.map((a) => {
              const tone =
                a.tone === "danger"
                  ? "border-destructive/30 bg-destructive/5"
                  : a.tone === "warning"
                  ? "border-amber-500/30 bg-amber-500/5"
                  : "border-primary/25 bg-primary/5";
              return (
                <div key={a.key} className={`surface-elevated border ${tone} p-4 flex flex-col gap-2`}>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-foreground/70" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-tight">{a.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{a.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={a.action}
                    className="self-start text-[11px] inline-flex items-center gap-1 text-primary mt-1"
                  >
                    {a.cta} <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <h3 className="font-serif text-lg mb-3">Ações rápidas</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <QuickAction
            icon={UserPlus}
            label="Convidar mentorado"
            description="Novo acesso ao portal"
            onClick={() => onNavigate("mentees")}
          />
          <QuickAction
            icon={Handshake}
            label="Parceiros"
            description="Links e comissões"
            onClick={() => onNavigate("partners")}
          />
          <QuickAction
            icon={Trophy}
            label="Score Comercial"
            description="Diagnósticos & check-ins"
            onClick={() => onNavigate("score")}
          />
          <QuickAction
            icon={FileText}
            label="Novo post"
            description="Publicar no blog"
            onClick={() => onNavigate("blog")}
          />
          <QuickAction
            icon={Plug}
            label="Integrações"
            description="Webhooks e API"
            onClick={() => onNavigate("integrations")}
          />
          <QuickAction
            icon={Send}
            label="Prospecção"
            description="Envios em massa"
            onClick={() => onNavigate("prospect")}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-lg">Últimos cadastros</h3>
            <button
              onClick={() => onNavigate("leads")}
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
            >
              Ver todos <ArrowRight size={12} />
            </button>
          </div>
          {o.recentLeads.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum cadastro recente.</p>
          ) : (
            <ul className="divide-y divide-border">
              {o.recentLeads.map((l) => (
                <li key={l.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{l.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {l.form_type.replace(/_/g, " ")} · {l.email}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                    {timeAgo(l.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-lg">Últimos mentorados</h3>
            <button
              onClick={() => onNavigate("mentees")}
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
            >
              Ver todos <ArrowRight size={12} />
            </button>
          </div>
          {o.recentMentees.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum mentorado recente.</p>
          ) : (
            <ul className="divide-y divide-border">
              {o.recentMentees.map((m) => (
                <li key={m.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {m.full_name || "—"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{m.email || "sem e-mail"}</p>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                    {timeAgo(m.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-lg">Últimos parceiros</h3>
            <button
              onClick={() => onNavigate("partners")}
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
            >
              Ver todos <ArrowRight size={12} />
            </button>
          </div>
          {o.recentPartners.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum parceiro cadastrado.</p>
          ) : (
            <ul className="divide-y divide-border">
              {o.recentPartners.map((p) => (
                <li key={p.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground truncate font-mono">
                      {p.partner_code} · {p.status}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                    {timeAgo(p.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-lg">Últimas integrações</h3>
            <button
              onClick={() => onNavigate("integrations")}
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
            >
              Ver logs <ArrowRight size={12} />
            </button>
          </div>
          {o.recentDeliveries.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem disparos recentes.</p>
          ) : (
            <ul className="divide-y divide-border">
              {o.recentDeliveries.map((d) => {
                const ok =
                  d.status === "success" || (d.status_code != null && d.status_code < 400);
                return (
                  <li key={d.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {ok ? (
                        <CheckCircle2 size={14} className="text-primary shrink-0" />
                      ) : (
                        <XCircle size={14} className="text-destructive shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm truncate font-mono">
                          {d.event_key || "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {d.status || "?"} · {d.status_code ?? "—"}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                      {timeAgo(d.created_at)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
