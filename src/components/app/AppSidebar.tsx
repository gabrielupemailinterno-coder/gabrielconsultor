import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  GraduationCap,
  Briefcase,
  Trophy,
  ShieldCheck,
  BookOpen,
  Settings,
  Bell,
  CreditCard,
  User,
  Radio,
  BarChart3,
  Plug,
  FileText,
  Users,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useSessionRoles } from "@/hooks/useSessionRoles";

type Item = { title: string; url: string; icon: any; end?: boolean };
type Group = { label: string; items: Item[] };

function buildGroups(roles: string[]): Group[] {
  const isAdmin = roles.includes("admin");
  const isMentee = roles.includes("mentee");
  const isPartner = roles.includes("partner");
  const isScore = roles.includes("scoreapp_user");

  const groups: Group[] = [];

  groups.push({
    label: "Início",
    items: [{ title: "Hub", url: "/app", icon: LayoutDashboard, end: true }],
  });

  const modules: Item[] = [];
  if (isMentee) modules.push({ title: "Mentoria", url: "/app/mentorados", icon: GraduationCap });
  if (isPartner) modules.push({ title: "Parceria", url: "/app/parceiro", icon: Briefcase });
  if (isScore) modules.push({ title: "Score Comercial", url: "/app/score", icon: Trophy });
  modules.push({ title: "Escola Comercial", url: "/app/escola-comercial", icon: BookOpen });
  if (modules.length) groups.push({ label: "Módulos", items: modules });

  if (isAdmin) {
    groups.push({
      label: "Administração",
      items: [
        { title: "Cockpit", url: "/app/admin", icon: ShieldCheck, end: true },
        { title: "Mentorados", url: "/app/admin?view=mentees", icon: Users },
        { title: "Parceiros", url: "/app/admin?view=partners", icon: Briefcase },
        { title: "Score", url: "/app/admin?view=score", icon: Trophy },
        { title: "Conteúdos", url: "/app/admin?view=conteudos", icon: FileText },
        { title: "Integrações", url: "/app/admin?view=integrations", icon: Plug },
        { title: "Analytics", url: "/app/admin?view=leads", icon: BarChart3 },
      ],
    });
  }

  groups.push({
    label: "Conta",
    items: [
      { title: "Perfil & Configurações", url: "/app/configuracoes", icon: Settings },
      { title: "Notificações", url: "/app/notificacoes", icon: Bell },
      { title: "Planos", url: "/app/planos", icon: CreditCard },
    ],
  });

  return groups;
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const { roles, session } = useSessionRoles();

  const groups = buildGroups(roles);

  const isActive = (url: string, end?: boolean) => {
    const base = url.split("?")[0];
    if (end) return pathname === base;
    return pathname === base || pathname.startsWith(base + "/");
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="px-3 py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
            <span className="font-serif text-primary text-sm">G</span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground leading-tight">
                Gabriel Consultor
              </p>
              <p className="text-xs font-medium truncate">Plataforma</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {groups.map((g) => (
          <SidebarGroup key={g.label}>
            {!collapsed && (
              <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/70">
                {g.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((it) => (
                  <SidebarMenuItem key={it.url}>
                    <SidebarMenuButton asChild isActive={isActive(it.url, it.end)} tooltip={it.title}>
                      <NavLink to={it.url} className="flex items-center gap-2">
                        <it.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span className="truncate">{it.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {!collapsed && session?.user?.email && (
        <SidebarFooter className="px-3 py-3 border-t border-sidebar-border">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-tight">
                Sessão
              </p>
              <p className="text-xs truncate">{session.user.email}</p>
            </div>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
