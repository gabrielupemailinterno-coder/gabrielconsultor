import { useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/app/AppLayout";
import { PageHeader } from "@/components/app/PageHeader";
import { SectionCard } from "@/components/app/SectionCard";
import { EmptyState } from "@/components/app/EmptyState";
import { StatusBadge } from "@/components/app/StatusBadge";
import { useSessionRoles, moduleRoute, moduleLabel, type Module } from "@/hooks/useSessionRoles";
import {
  Briefcase,
  GraduationCap,
  Trophy,
  ShieldCheck,
  ArrowRight,
  Settings,
  CreditCard,
  Sparkles,
  Bell,
} from "lucide-react";

const moduleIcon: Record<Module, any> = {
  admin: ShieldCheck,
  mentee: GraduationCap,
  partner: Briefcase,
  scoreapp: Trophy,
};

const moduleDesc: Record<Module, string> = {
  admin: "Cockpit interno: leads, integrações, mentorados, parceiros.",
  mentee: "Sua jornada, tarefas e materiais da mentoria.",
  partner: "Links, cliques, conversões e comissões.",
  scoreapp: "Sua rotina comercial diária, guiada por IA.",
};

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Boa madrugada";
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export default function AppHub() {
  const { session, modules, roles, loading } = useSessionRoles();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!session) {
      navigate("/app/login?next=/app", { replace: true });
      return;
    }
    // Auto-entrar se tem só 1 módulo específico
    if (modules.length === 1) navigate(moduleRoute[modules[0]], { replace: true });
  }, [session, modules, loading, navigate]);

  const displayName = useMemo(() => {
    const email = session?.user?.email || "";
    const meta = (session?.user?.user_metadata as any) || {};
    return meta.full_name || meta.name || email.split("@")[0] || "";
  }, [session]);

  if (loading || !session || modules.length === 1) return <AppLayout>{null}</AppLayout>;

  const hasAnyModule = modules.length > 0;

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto p-6">
        <PageHeader
          eyebrow="Hub"
          title={`${greeting()}${displayName ? `, ${displayName}` : ""}`}
          description="Escolha um módulo abaixo. Seus atalhos e status aparecem na coluna lateral."
          actions={
            <div className="hidden sm:flex items-center gap-2">
              {roles.length > 0 ? (
                <StatusBadge tone="success">Conta ativa</StatusBadge>
              ) : (
                <StatusBadge tone="warning">Acesso pendente</StatusBadge>
              )}
            </div>
          }
        />

        {!hasAnyModule ? (
          <EmptyState
            icon={Sparkles}
            title="Sua conta ainda não tem módulos liberados"
            description="Assim que um plano for ativado ou o administrador liberar um módulo, ele aparecerá aqui."
            action={
              <Link
                to="/app/planos"
                className="inline-flex items-center gap-1 text-xs bg-primary text-primary-foreground px-3 py-2 rounded-md"
              >
                Ver planos <ArrowRight className="h-3 w-3" />
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <SectionCard title="Seus módulos" description="Acesse rapidamente cada área do sistema.">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {modules.map((m) => {
                    const Icon = moduleIcon[m];
                    return (
                      <Link
                        key={m}
                        to={moduleRoute[m]}
                        className="surface-elevated surface-elevated-hover p-4 flex flex-col gap-2 group"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-md bg-primary/10 border border-primary/25 flex items-center justify-center">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                              Módulo
                            </p>
                            <h3 className="font-serif text-base leading-tight truncate">
                              {moduleLabel[m]}
                            </h3>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">{moduleDesc[m]}</p>
                        <span className="mt-auto text-[11px] inline-flex items-center gap-1 text-primary opacity-70 group-hover:opacity-100">
                          Abrir <ArrowRight className="h-3 w-3" />
                        </span>
                      </Link>
                    );
                  })}

                </div>
              </SectionCard>

              <SectionCard title="Próximos passos">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center justify-between gap-3 py-2 border-b border-border/50 last:border-0">
                    <span className="text-muted-foreground">Confirme seu perfil e preferências</span>
                    <Link
                      to="/app/configuracoes"
                      className="text-[11px] text-primary inline-flex items-center gap-1"
                    >
                      Abrir <ArrowRight className="h-3 w-3" />
                    </Link>
                  </li>
                  <li className="flex items-center justify-between gap-3 py-2">
                    <span className="text-muted-foreground">Confira seu plano atual</span>
                    <Link
                      to="/app/planos"
                      className="text-[11px] text-primary inline-flex items-center gap-1"
                    >
                      Ver <ArrowRight className="h-3 w-3" />
                    </Link>
                  </li>
                </ul>
              </SectionCard>

            </div>

            <div className="space-y-4">
              <SectionCard title="Conta">
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Sessão
                    </dt>
                    <dd className="truncate mt-0.5">{session.user.email}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Módulos
                    </dt>
                    <dd className="flex flex-wrap gap-1 mt-1">
                      {modules.map((m) => (
                        <StatusBadge key={m} tone="info">
                          {moduleLabel[m]}
                        </StatusBadge>
                      ))}
                    </dd>
                  </div>
                </dl>
              </SectionCard>

              <SectionCard title="Atalhos">
                <div className="space-y-1 text-sm">
                  <Link
                    to="/app/configuracoes"
                    className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-muted/60"
                  >
                    <Settings className="h-3.5 w-3.5 text-muted-foreground" /> Configurações
                  </Link>
                  <Link
                    to="/app/notificacoes"
                    className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-muted/60"
                  >
                    <Bell className="h-3.5 w-3.5 text-muted-foreground" /> Notificações
                  </Link>
                  <Link
                    to="/app/planos"
                    className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-muted/60"
                  >
                    <CreditCard className="h-3.5 w-3.5 text-muted-foreground" /> Planos
                  </Link>
                </div>
              </SectionCard>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
