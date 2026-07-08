import { ReactNode } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import AdminSubnav, { AdminView } from "./AdminSidebar";

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
  title,
  breadcrumb,
  children,
}: Props) {
  return (
    <AppLayout>
      <AdminSubnav view={view} onChange={onChangeView} counts={counts} />
      <div className="max-w-7xl mx-auto w-full px-4 md:px-6 pt-6 pb-2">
        {breadcrumb && (
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {breadcrumb}
          </p>
        )}
        <h1 className="font-serif text-2xl md:text-3xl leading-tight">{title}</h1>
      </div>
      <div className="max-w-7xl mx-auto w-full px-4 md:px-6 pb-8">{children}</div>
    </AppLayout>
  );
}
