import { ReactNode, useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, PlusCircle, BookOpen, User, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/app/AppLayout";

const items = [
  { to: "/app/score", label: "Painel", icon: LayoutDashboard, end: true },
  { to: "/app/score/registrar", label: "Check-in", icon: PlusCircle },
  { to: "/app/score/conteudos", label: "Conteúdos", icon: BookOpen },
  { to: "/app/score/perfil", label: "Perfil", icon: User },
];

export default function ScoreLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        navigate("/app/login", { replace: true });
        return;
      }
      const readProfile = async () => (await supabase
        .from("score_profiles")
        .select("payment_status, plan_status, plan_expires_at")
        .eq("user_id", sess.session!.user.id)
        .maybeSingle()).data;
      let data = await readProfile();
      const isActive = (d: any) =>
        d?.plan_status === "active" &&
        d?.payment_status === "paid" &&
        (!d?.plan_expires_at || new Date(d.plan_expires_at) > new Date());
      if (!isActive(data)) {
        try { await supabase.functions.invoke("cora-check-invoice", { body: {} }); } catch {}
        data = await readProfile();
      }
      if (!isActive(data)) {
        navigate("/app/planos", { replace: true });
        return;
      }
      setChecking(false);
    })();
  }, [navigate]);

  if (checking) {
    return (
      <AppLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={28} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Sub-nav horizontal do Score */}
      <div className="border-b border-border/60 bg-background/80 backdrop-blur-md sticky top-14 z-20">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-2 overflow-x-auto">
          <nav className="flex items-center gap-1 min-w-max">
            {items.map((i) => (
              <NavLink
                key={i.to}
                to={i.to}
                end={i.end}
                className={({ isActive }) =>
                  "inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-md transition-colors " +
                  (isActive
                    ? "bg-primary/15 text-primary border border-primary/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent")
                }
              >
                <i.icon size={14} />
                {i.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-6">{children}</main>

      {/* Bottom bar mobile */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 border-t border-border bg-background/95 backdrop-blur z-40">
        <div className="grid grid-cols-4">
          {items.map((i) => (
            <NavLink
              key={i.to}
              to={i.to}
              end={i.end}
              className={({ isActive }) =>
                "flex flex-col items-center gap-1 py-2.5 text-[11px] " +
                (isActive ? "text-primary" : "text-muted-foreground")
              }
            >
              <i.icon size={20} />
              {i.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </AppLayout>
  );
}
