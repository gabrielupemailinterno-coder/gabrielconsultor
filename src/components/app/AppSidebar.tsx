import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  GraduationCap,
  Briefcase,
  Trophy,
  Settings,
  Bell,
  CreditCard,
  User,
  ArrowLeft,
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
import { ADMIN_GROUPS, type AdminView } from "@/components/admin/AdminSidebar";

type Item = { title: string; url: string; icon: any; end?: boolean; matchView?: AdminView };
type Group = { label: string; items: Item[] };

function buildUserGroups(roles: string[]): Group[] {
  const isMentee = roles.includes("mentee");
  const isPartner = roles.includes("partner");
  const isScore = roles.includes("scoreapp_user");

  const groups: Group[] = [];

  groups.push({
    label: "Início",
    items: [{ title: "Hub", url: "/app", icon: LayoutDashboard, end: true }],
  });

  const modules: Item[] = [];
  if (isMentee) modules.push({ title: "Mentoria Comercial", url: "/app/mentorados", icon: GraduationCap });
  if (isScore) modules.push({ title: "Score Comercial", url: "/app/score", icon: Trophy });
  if (isPartner) modules.push({ title: "Parceiro/Afiliado", url: "/app/parceiro", icon: Briefcase });
  if (modules.length) groups.push({ label: "Produtos", items: modules });

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

function buildAdminGroups(): Group[] {
  return ADMIN_GROUPS.map((g) => ({
    label: g.label,
    items: g.items.map((it) => ({
      title: it.label,
      url:
        it.view === "overview"
          ? "/app/admin"
          : `/app/admin?view=${it.view}`,
      icon: it.icon,
      end: it.view === "overview",
      matchView: it.view,
    })),
  }));
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname, search } = useLocation();
  const { roles, session } = useSessionRoles();

  const isAdminRoute = pathname.startsWith("/app/admin");
  const isAdmin = roles.includes("admin");
  const currentView = new URLSearchParams(search).get("view") || "overview";

  const groups = isAdminRoute && isAdmin ? buildAdminGroups() : buildUserGroups(roles);

  const isActive = (it: Item) => {
    if (isAdminRoute && it.matchView) {
      return currentView === it.matchView;
    }
    const base = it.url.split("?")[0];
    if (it.end) return pathname === base;
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
                {isAdminRoute && isAdmin ? "Administração" : "Gabriel Consultor"}
              </p>
              <p className="text-xs font-medium truncate">
                {isAdminRoute && isAdmin ? "Cockpit" : "Plataforma"}
              </p>
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
                    <SidebarMenuButton asChild isActive={isActive(it)} tooltip={it.title}>
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

        {isAdminRoute && isAdmin && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Voltar ao Hub">
                    <NavLink to="/app" className="flex items-center gap-2 text-muted-foreground">
                      <ArrowLeft className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="truncate">Voltar ao Hub</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
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
