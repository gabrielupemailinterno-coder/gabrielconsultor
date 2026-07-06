import { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, PlusCircle, BookOpen, User, LogOut, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const items = [
  { to: "/scoreapp/app", label: "Painel", icon: LayoutDashboard, end: true },
  { to: "/scoreapp/app/registrar", label: "Registrar", icon: PlusCircle },
  { to: "/scoreapp/app/conteudos", label: "Conteúdos", icon: BookOpen },
  { to: "/scoreapp/app/perfil", label: "Perfil", icon: User },
];

export default function ScoreLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const logout = async () => { await supabase.auth.signOut(); navigate("/scoreapp/login"); };
  return (
    <div className="min-h-screen bg-background text-foreground pb-24 md:pb-0">
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur z-40">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <NavLink to="/scoreapp/app" className="flex items-center gap-2">
            <Trophy size={18} className="text-primary" />
            <span className="font-serif text-lg">Score Comercial</span>
          </NavLink>
          <nav className="hidden md:flex items-center gap-1">
            {items.map((i) => (
              <NavLink key={i.to} to={i.to} end={i.end}
                className={({ isActive }) => `px-3 py-2 text-sm rounded-md transition ${isActive ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                {i.label}
              </NavLink>
            ))}
            <button onClick={logout} className="ml-2 text-muted-foreground hover:text-foreground" aria-label="Sair"><LogOut size={16} /></button>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6">{children}</main>
      <nav className="md:hidden fixed bottom-0 inset-x-0 border-t border-border bg-background/95 backdrop-blur z-40">
        <div className="grid grid-cols-4">
          {items.map((i) => (
            <NavLink key={i.to} to={i.to} end={i.end}
              className={({ isActive }) => `flex flex-col items-center gap-1 py-2.5 text-[11px] ${isActive ? "text-primary" : "text-muted-foreground"}`}>
              <i.icon size={20} />
              {i.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
