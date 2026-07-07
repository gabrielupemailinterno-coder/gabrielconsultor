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
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

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
  | "leads"
  | "visits"
  | "clicks"
  | "sessions"
  | "blog";

type Group = {
  label: string;
  items: { view: AdminView; label: string; icon: any }[];
};

const GROUPS: Group[] = [
  {
    label: "Cockpit",
    items: [{ view: "overview", label: "Visão Geral", icon: LayoutDashboard }],
  },
  {
    label: "Operação",
    items: [
      { view: "mentees", label: "Mentorados", icon: Users },
      { view: "score", label: "Score Comercial", icon: Trophy },
      { view: "conteudos", label: "Conteúdos", icon: BookOpen },
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
  {
    label: "Conteúdo",
    items: [{ view: "blog", label: "Blog", icon: FileText }],
  },
];

interface Props {
  view: AdminView;
  onChange: (v: AdminView) => void;
  counts?: Partial<Record<AdminView, number>>;
}

export const ADMIN_LABELS: Record<AdminView, string> = GROUPS.reduce(
  (acc, g) => {
    g.items.forEach((i) => (acc[i.view] = i.label));
    return acc;
  },
  {} as Record<AdminView, string>,
);

export const ADMIN_GROUP_OF: Record<AdminView, string> = GROUPS.reduce(
  (acc, g) => {
    g.items.forEach((i) => (acc[i.view] = g.label));
    return acc;
  },
  {} as Record<AdminView, string>,
);

export default function AdminSidebar({ view, onChange, counts = {} }: Props) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        {!collapsed ? (
          <div>
            <p className="font-serif text-base leading-tight">Cockpit</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Consultoria GV
            </p>
          </div>
        ) : (
          <div className="text-primary font-serif text-lg text-center">GV</div>
        )}
      </SidebarHeader>
      <SidebarContent>
        {GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active = view === item.view;
                  const count = counts[item.view];
                  return (
                    <SidebarMenuItem key={item.view}>
                      <SidebarMenuButton
                        isActive={active}
                        onClick={() => onChange(item.view)}
                        tooltip={item.label}
                      >
                        <item.icon className="h-4 w-4" />
                        {!collapsed && (
                          <span className="flex-1 flex items-center justify-between">
                            <span>{item.label}</span>
                            {typeof count === "number" && (
                              <span className="text-[10px] text-muted-foreground">
                                {count}
                              </span>
                            )}
                          </span>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
