import { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AdminSidebar, { AdminView } from "./AdminSidebar";

interface Props {
  view: AdminView;
  onChangeView: (v: AdminView) => void;
  counts?: Partial<Record<AdminView, number>>;
  userEmail: string;
  onLogout: () => void;
  title: string;
  breadcrumb?: string;
  children: ReactNode;
}

export default function AdminLayout({
  view,
  onChangeView,
  counts,
  userEmail,
  onLogout,
  title,
  breadcrumb,
  children,
}: Props) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background text-foreground">
        <AdminSidebar view={view} onChange={onChangeView} counts={counts} />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b border-border flex items-center justify-between px-4 sticky top-0 bg-background/95 backdrop-blur z-20">
            <div className="flex items-center gap-3 min-w-0">
              <SidebarTrigger />
              <div className="min-w-0">
                <h1 className="font-serif text-base leading-tight truncate">{title}</h1>
                {breadcrumb && (
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {breadcrumb}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground hidden md:inline">
                {userEmail}
              </span>
              <button
                onClick={onLogout}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition"
              >
                <LogOut size={14} /> Sair
              </button>
            </div>
          </header>
          <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
