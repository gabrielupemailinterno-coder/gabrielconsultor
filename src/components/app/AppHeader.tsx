import { useNavigate, useLocation, Link } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { LogOut, Search, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSessionRoles } from "@/hooks/useSessionRoles";

const CRUMB_LABELS: Record<string, string> = {
  app: "App",
  admin: "Cockpit",
  mentorados: "Mentoria",
  parceiro: "Parceria",
  score: "Score Comercial",
  "escola-comercial": "Escola Comercial",
  configuracoes: "Configurações",
  notificacoes: "Notificações",
  planos: "Planos",
  "checkout-pix": "Checkout",
  conteudos: "Conteúdos",
  onboarding: "Onboarding",
  perfil: "Perfil",
  registrar: "Check-in",
  cadastro: "Cadastro",
  login: "Entrar",
};

function humanize(seg: string) {
  return CRUMB_LABELS[seg] || seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function AppHeader({ hideSidebarTrigger = false }: { hideSidebarTrigger?: boolean } = {}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { session } = useSessionRoles();

  const segments = pathname.split("/").filter(Boolean);
  const crumbs = segments.map((seg, i) => ({
    label: humanize(seg),
    href: "/" + segments.slice(0, i + 1).join("/"),
    last: i === segments.length - 1,
  }));

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/app/login", { replace: true });
  };

  const initials = (session?.user?.email || "?").slice(0, 2).toUpperCase();

  return (
    <header className="h-14 border-b border-border/60 bg-background/70 backdrop-blur-md sticky top-0 z-30 flex items-center gap-2 px-3">
      {!hideSidebarTrigger && <SidebarTrigger className="text-muted-foreground hover:text-foreground" />}

      <nav aria-label="Breadcrumb" className="hidden md:flex items-center text-xs text-muted-foreground min-w-0">
        {crumbs.map((c, i) => (
          <span key={c.href} className="flex items-center min-w-0">
            {i > 0 && <span className="mx-1.5 opacity-40">›</span>}
            {c.last ? (
              <span className="text-foreground truncate">{c.label}</span>
            ) : (
              <Link to={c.href} className="hover:text-foreground truncate">
                {c.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      <div className="flex-1" />

      <button
        type="button"
        className="hidden sm:inline-flex items-center gap-2 text-xs text-muted-foreground bg-muted/60 hover:bg-muted transition-colors rounded-md px-2.5 py-1.5"
        onClick={() => {
          /* command palette placeholder */
        }}
        aria-label="Buscar"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Buscar</span>
        <kbd className="ml-2 text-[10px] font-mono opacity-60">⌘K</kbd>
      </button>

      <Link
        to="/app/notificacoes"
        className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60"
        aria-label="Notificações"
      >
        <Bell className="h-4 w-4" />
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger className="w-8 h-8 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-[11px] font-medium">
          {initials}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="text-xs">
            <div className="font-medium truncate">{session?.user?.email}</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">
              Sua conta
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate("/app")}>Hub</DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/app/configuracoes")}>
            Configurações
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/app/planos")}>Planos</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
            <LogOut className="h-3.5 w-3.5 mr-2" /> Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
