import {
  LayoutDashboard,
  Users,
  Trophy,
  BookOpen,
  Mail,
  Send,
  MessageCircle,
  CalendarClock,
  Workflow,
  Bot,
  Plug,
  UserPlus,
  Eye,
  MousePointerClick,
  Clock,
  FileText,
  Handshake,
} from "lucide-react";

export type AdminView =
  | "overview"
  | "mentees"
  | "score"
  | "conteudos"
  | "emails"
  | "prospect"
  | "whatsapp"
  | "ritual"
  | "botflow"
  | "botconversa"
  | "integrations"
  | "partners"
  | "leads"
  | "visits"
  | "clicks"
  | "sessions"
  | "blog";

type Group = {
  label: string;
  items: { view: AdminView; label: string; icon: any }[];
};

export const ADMIN_GROUPS: Group[] = [
  { label: "Cockpit", items: [{ view: "overview", label: "Visão Geral", icon: LayoutDashboard }] },
  {
    label: "Operação",
    items: [
      { view: "mentees", label: "Mentorados", icon: Users },
      { view: "score", label: "Score Comercial", icon: Trophy },
      { view: "conteudos", label: "Conteúdos", icon: BookOpen },
      { view: "partners", label: "Parceiros", icon: Handshake },
    ],
  },
  {
    label: "Relacionamento",
    items: [
      { view: "emails", label: "E-mails", icon: Mail },
      { view: "prospect", label: "Prospecção", icon: Send },
      { view: "whatsapp", label: "WhatsApp", icon: MessageCircle },
      { view: "ritual", label: "Ritual WhatsApp", icon: CalendarClock },
    ],
  },
  {
    label: "Automações",
    items: [
      { view: "botflow", label: "Fluxo do Bot", icon: Workflow },
      { view: "botconversa", label: "BotConversa", icon: Bot },
      { view: "integrations", label: "Integrações", icon: Plug },
    ],
  },
  {
    label: "Analytics",
    items: [
      { view: "leads", label: "Cadastros", icon: UserPlus },
      { view: "visits", label: "Visitas", icon: Eye },
      { view: "clicks", label: "Cliques", icon: MousePointerClick },
      { view: "sessions", label: "Sessões", icon: Clock },
    ],
  },
  { label: "Conteúdo", items: [{ view: "blog", label: "Blog", icon: FileText }] },
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
    <div className="border-b border-border/60 bg-background/80 backdrop-blur-md sticky top-14 z-20">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-2 overflow-x-auto">
        <div className="flex items-center gap-6 min-w-max">
          {ADMIN_GROUPS.map((group) => (
            <div key={group.label} className="flex items-center gap-1">
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
