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

export default function DashboardOverview({ onNavigate }: Props) {
  const o = useAdminOverview();

  if (o.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
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
            icon={Plug}
            label="Integrações"
            value={o.integrationsEnabled}
            sub="webhooks ativos"
            accent
          />
        </div>
      </section>

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
            icon={Mail}
            label="Novo e-mail"
            description="Comunicar mentorados"
            onClick={() => onNavigate("emails")}
          />
          <QuickAction
            icon={MessageCircle}
            label="Campanha WhatsApp"
            description="Disparar mensagens"
            onClick={() => onNavigate("whatsapp")}
          />
          <QuickAction
            icon={Bot}
            label="Testar BotConversa"
            description="Validar gatilhos"
            onClick={() => onNavigate("botconversa")}
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
