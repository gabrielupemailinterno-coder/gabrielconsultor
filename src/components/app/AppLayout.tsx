import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { ImpersonationBanner } from "./ImpersonationBanner";
import { useSessionRoles } from "@/hooks/useSessionRoles";
import { Loader2 } from "lucide-react";

interface Props {
  children: React.ReactNode;
  /** Se true, exige sessão autenticada. Padrão true. */
  requireAuth?: boolean;
  /** Classe de tema aplicada ao contêiner (ex: "admin-theme", "portal-theme"). */
  themeClass?: string;
  /** Oculta a sidebar principal — usado no Hub /app. */
  hideSidebar?: boolean;
}

export function AppLayout({
  children,
  requireAuth = true,
  themeClass = "admin-theme",
  hideSidebar = false,
}: Props) {
  const { session, loading } = useSessionRoles();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    if (!requireAuth || loading) return;
    if (!session) {
      navigate(`/app/login?next=${encodeURIComponent(pathname)}`, { replace: true });
    }
  }, [requireAuth, loading, session, pathname, navigate]);

  if (requireAuth && (loading || !session)) {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-background text-foreground ${themeClass ?? ""}`}>
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className={`min-h-screen flex w-full bg-background text-foreground ${themeClass ?? ""}`}>
        {!hideSidebar && <AppSidebar />}
        <div className="flex-1 flex flex-col min-w-0">
          <AppHeader hideSidebarTrigger={hideSidebar} />
          <ImpersonationBanner />
          <main className="flex-1 overflow-x-hidden">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
