import {
  LayoutDashboard,
  Users,
  Trophy,
  BookOpen,
  Send,
  Plug,
  UserPlus,
  Eye,
  MousePointerClick,
  Clock,
  FileText,
  Handshake,
  Settings,
} from "lucide-react";

export type AdminView =
  | "overview"
  | "mentees"
  | "score"
  | "conteudos"
  | "integrations"
  | "partners"
  | "leads"
  | "visits"
  | "clicks"
  | "sessions"
  | "blog"
  | "prospect"
  | "settings";

type Group = {
  label: string;
  items: { view: AdminView; label: string; icon: any; hint?: string }[];
};

export const ADMIN_GROUPS: Group[] = [
  {
    label: "Visão Geral",
    items: [{ view: "overview", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Mentoria Comercial",
    items: [
      { view: "mentees", label: "Mentorados", icon: Users, hint: "cadastros, tarefas e métricas" },
      { view: "conteudos", label: "Materiais", icon: BookOpen },
    ],
  },
  {
    label: "Score Comercial",
    items: [
      { view: "score", label: "Usuários & Check-ins", icon: Trophy, hint: "diagnósticos, feedbacks e planos" },
    ],
  },
  {
    label: "Parceiros/Afiliados",
    items: [
      { view: "partners", label: "Parceiros", icon: Handshake, hint: "links, conversões e comissões" },
    ],
  },
  {
    label: "Marketing & Conteúdo",
    items: [
      { view: "leads", label: "Leads", icon: UserPlus },
      { view: "blog", label: "Blog", icon: FileText },
      { view: "prospect", label: "Prospecção", icon: Send },
    ],
  },
  {
    label: "Integrações",
    items: [
      { view: "integrations", label: "API & Webhooks", icon: Plug, hint: "API, webhooks e logs" },
    ],
  },
  {
    label: "Analytics",
    items: [
      { view: "visits", label: "Visitas", icon: Eye },
      { view: "clicks", label: "Cliques", icon: MousePointerClick },
      { view: "sessions", label: "Sessões", icon: Clock },
    ],
  },
  {
    label: "Configurações",
    items: [{ view: "settings", label: "Sistema", icon: Settings }],
  },
];


export const ADMIN_LABELS: Record<AdminView, string> = ADMIN_GROUPS.reduce(
  (acc, g) => {
    g.items.forEach((i) => (acc[i.view] = i.label));
    return acc;
  },
  {} as Record<AdminView, string>,
);

export const ADMIN_GROUP_OF: Record<AdminView, string> = ADMIN_GROUPS.reduce(
  (acc, g) => {
    g.items.forEach((i) => (acc[i.view] = g.label));
    return acc;
  },
  {} as Record<AdminView, string>,
);

interface Props {
  view: AdminView;
  onChange: (v: AdminView) => void;
  counts?: Partial<Record<AdminView, number>>;
}

/** Horizontal segmented sub-navigation used inside AppLayout for the Admin cockpit. */
export default function AdminSubnav({ view, onChange, counts = {} }: Props) {
  return (
    <div className="border-b border-border/60 bg-background/80 backdrop-blur-md sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-2 overflow-x-auto">
        <div className="flex items-center gap-5 min-w-max">
          {ADMIN_GROUPS.map((group, gi) => (
            <div key={group.label} className="flex items-center gap-1">
              {gi > 0 && <span className="mx-1 h-4 w-px bg-border/60 shrink-0" aria-hidden />}
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mr-1 shrink-0">
                {group.label}
              </span>
              {group.items.map((item) => {
                const active = view === item.view;
                const count = counts[item.view];
                return (
                  <button
                    key={item.view}
                    type="button"
                    onClick={() => onChange(item.view)}
                    title={item.hint || item.label}
                    className={
                      "shrink-0 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] transition-colors " +
                      (active
                        ? "bg-primary/15 text-primary border border-primary/25"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent")
                    }
                  >
                    <item.icon className="h-3 w-3" />
                    <span>{item.label}</span>
                    {typeof count === "number" && (
                      <span className="text-[10px] text-muted-foreground/70">({count})</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
