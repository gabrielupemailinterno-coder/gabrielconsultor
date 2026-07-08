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
      <div className="max-w-7xl mx-auto w-full px-4 md:px-6 py-6">{children}</div>
    </AppLayout>
  );
}
