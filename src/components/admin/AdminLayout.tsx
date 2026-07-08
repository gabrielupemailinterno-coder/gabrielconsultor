import { ReactNode, useState } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { ADMIN_GROUPS, type AdminView } from "./AdminSidebar";
import { Menu, X } from "lucide-react";

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

function AdminNavList({
  view,
  onChange,
  counts = {},
  onNavigate,
}: {
  view: AdminView;
  onChange: (v: AdminView) => void;
  counts?: Partial<Record<AdminView, number>>;
  onNavigate?: () => void;
}) {
  return (
    <nav className="space-y-5">
      {ADMIN_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 px-2 mb-1.5">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = view === item.view;
              const count = counts[item.view];
              return (
                <li key={item.view}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(item.view);
                      onNavigate?.();
                    }}
                    title={item.hint || item.label}
                    className={
                      "w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors " +
                      (active
                        ? "bg-primary/15 text-primary border border-primary/25"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent")
                    }
                  >
                    <item.icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="flex-1 text-left truncate">{item.label}</span>
                    {typeof count === "number" && (
                      <span className="text-[10px] text-muted-foreground/70">{count}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export default function AdminLayout({
  view,
  onChangeView,
  counts,
  title,
  breadcrumb,
  children,
}: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <AppLayout themeClass="admin-theme">
      <div className="max-w-7xl mx-auto w-full px-4 md:px-6 py-6">

        {/* Mobile toggle */}
        <div className="md:hidden mb-4 flex items-center justify-between">
          <div>
            {breadcrumb && (
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70">
                {breadcrumb}
              </p>
            )}
            <h1 className="font-serif text-lg">{title}</h1>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs"
          >
            <Menu className="h-3.5 w-3.5" /> Menu
          </button>
        </div>

        <div className="flex gap-6">
          {/* Desktop sidebar */}
          <aside className="hidden md:block w-60 shrink-0">
            <div className="sticky top-4">
              <AdminNavList view={view} onChange={onChangeView} counts={counts} />
            </div>
          </aside>

          <div className="flex-1 min-w-0">{children}</div>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-50 md:hidden bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          >
            <div
              className="absolute left-0 top-0 h-full w-72 bg-background border-r border-border p-4 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Administração
                </p>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="p-1 rounded hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <AdminNavList
                view={view}
                onChange={onChangeView}
                counts={counts}
                onNavigate={() => setMobileOpen(false)}
              />
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
