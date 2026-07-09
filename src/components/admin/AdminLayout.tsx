import { ReactNode } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { type AdminView } from "./AdminSidebar";

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

export default function AdminLayout({ title, breadcrumb, children }: Props) {
  return (
    <AppLayout themeClass="admin-theme">
      <div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-6">
        <div className="mb-6">
          {breadcrumb && (
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70">
              {breadcrumb}
            </p>
          )}
          <h1 className="font-serif text-2xl md:text-3xl mt-1">{title}</h1>
        </div>
        {children}
      </div>
    </AppLayout>
  );
}
