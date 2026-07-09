import { useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/app/AppLayout";
import { PageHeader } from "@/components/app/PageHeader";
import { SectionCard } from "@/components/app/SectionCard";
import { StatusBadge } from "@/components/app/StatusBadge";
import { useSessionRoles, roleLabel, type Module } from "@/hooks/useSessionRoles";
import {
  Briefcase,
  GraduationCap,
  Trophy,
  ShieldCheck,
  ArrowRight,
  Settings,
  CreditCard,
  Bell,
  Sparkles,
} from "lucide-react";

type Card = {
  key: Module | "admin";
  title: string;
  description: string;
  cta: string;
  route: string;
  icon: any;
  status: string;
  tone: "success" | "info" | "warning";
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
    if (!session) navigate("/app/login?next=/app", { replace: true });
  }, [session, loading, navigate]);

  const displayName = useMemo(() => {
    const email = session?.user?.email || "";
    const meta = (session?.user?.user_metadata as any) || {};
    return meta.full_name || meta.name || email.split("@")[0] || "";
  }, [session]);

  const isAdmin = roles.includes("admin");
  const isPartner = roles.includes("partner");
  // Admin e Parceiro têm acesso completo à plataforma (sem pagar).
  const fullAccess = isAdmin || isPartner;

  const cards: Card[] = useMemo(() => {
    const list: Card[] = [];

    const hasMentee = modules.includes("mentee");
    const hasScore = modules.includes("scoreapp");
    const hasPartner = modules.includes("partner");

    if (hasMentee || isAdmin) {
      list.push({
        key: "mentee",
        title: "Mentoria Comercial",
        description: "Acompanhe encontros, tarefas, materiais e evolução.",
        cta: "Acessar mentoria",
        route: "/app/mentorados",
        icon: GraduationCap,
        status: hasMentee ? "Ativo" : "Admin",
        tone: hasMentee ? "success" : "info",
      });
    }

    if (hasScore || fullAccess) {
      list.push({
        key: "scoreapp",
        title: "Score Comercial",
        description: "Faça check-ins, acompanhe sua evolução e receba recomendações.",
        cta: "Acessar Score",
        route: "/app/score",
        icon: Trophy,
        status: hasScore ? "Ativo" : isAdmin ? "Admin" : "Parceiro",
        tone: hasScore ? "success" : "info",
      });
    }

    if (hasPartner || isAdmin) {
      list.push({
        key: "partner",
        title: "Parceiros",
        description: "Gerencie seus links, conversões e comissões.",
        cta: "Acessar portal do parceiro",
        route: "/app/parceiro",
        icon: Briefcase,
        status: hasPartner ? "Ativo" : "Admin",
        tone: hasPartner ? "success" : "info",
      });
    }

    if (isAdmin) {
      list.push({
        key: "admin",
        title: "Administração",
        description: "Gerencie mentorados, Score, parceiros, leads e automações.",
        cta: "Acessar admin",
        route: "/app/admin",
        icon: ShieldCheck,
        status: "Admin",
        tone: "warning",
      });
    }

    return list;
  }, [modules, isAdmin, fullAccess]);

  if (loading || !session) {
    return <AppLayout hideSidebar>{null}</AppLayout>;
  }

  return (
    <AppLayout hideSidebar>
      <div className="max-w-6xl mx-auto p-6">
        <PageHeader
          eyebrow="Hub"
          title={`${greeting()}${displayName ? `, ${displayName}` : ""}`}
          description="Escolha onde quer trabalhar hoje."
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <SectionCard
              title="Seus módulos"
              description="Acesse rapidamente cada área do sistema."
            >
              {cards.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/25 flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-serif text-base mb-1">
                    Sua conta ainda não tem módulos liberados
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
                    Assim que um plano for ativado ou o administrador liberar um módulo,
                    ele aparecerá aqui.
                  </p>
                  <Link
                    to="/app/planos"
                    className="inline-flex items-center gap-1 text-xs bg-primary text-primary-foreground px-3 py-2 rounded-md"
                  >
                    Ver planos <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {cards.map((c) => {
                    const Icon = c.icon;
                    return (
                      <Link
                        key={c.key}
                        to={c.route}
                        className="surface-elevated surface-elevated-hover p-4 flex flex-col gap-3 group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-9 h-9 rounded-md bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0">
                              <Icon className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                                Módulo
                              </p>
                              <h3 className="font-serif text-base leading-tight truncate">
                                {c.title}
                              </h3>
                            </div>
                          </div>
                          <StatusBadge tone={c.tone}>{c.status}</StatusBadge>
                        </div>
                        <p className="text-xs text-muted-foreground min-h-[2.5rem]">
                          {c.description}
                        </p>
                        <span className="mt-auto text-[11px] inline-flex items-center gap-1 text-primary opacity-80 group-hover:opacity-100">
                          {c.cta} <ArrowRight className="h-3 w-3" />
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </SectionCard>

            <SectionCard title="Próximos passos">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center justify-between gap-3 py-2 border-b border-border/50">
                  <span className="text-muted-foreground">
                    Confirme seu perfil e preferências
                  </span>
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
                    Acessos liberados
                  </dt>
                  <dd className="flex flex-wrap gap-1 mt-1">
                    {roles.length === 0 && (
                      <span className="text-xs text-muted-foreground">Nenhum acesso ativo</span>
                    )}
                    {roles.map((r) => (
                      <StatusBadge key={r} tone="info">
                        {roleLabel[r] ?? r}
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
      </div>
    </AppLayout>
  );
}
