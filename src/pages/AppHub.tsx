import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSessionRoles, moduleRoute, moduleLabel, type Module } from "@/hooks/useSessionRoles";
import { Loader2, LogOut, Briefcase, GraduationCap, Trophy, ShieldCheck, ArrowRight } from "lucide-react";

const moduleIcon: Record<Module, JSX.Element> = {
  admin: <ShieldCheck className="text-primary" size={20} />,
  mentee: <GraduationCap className="text-primary" size={20} />,
  partner: <Briefcase className="text-primary" size={20} />,
  scoreapp: <Trophy className="text-primary" size={20} />,
};

const moduleDesc: Record<Module, string> = {
  admin: "Cockpit interno de gestão do negócio.",
  mentee: "Cronograma, tarefas e materiais da mentoria.",
  partner: "Gere links, acompanhe cliques e comissões.",
  scoreapp: "Rotina comercial diária + IA.",
};

export default function AppHub() {
  const { session, modules, loading } = useSessionRoles();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!session) {
      navigate("/app/login??next=/app", { replace: true });
      return;
    }
    if (modules.length === 1) {
      navigate(moduleRoute[modules[0]], { replace: true });
    }
  }, [session, modules, loading, navigate]);

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/app/login", { replace: true });
  };

  if (loading || !session || modules.length === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-primary">Gabriel Consultor</p>
            <h1 className="font-serif text-xl">Sua área</h1>
          </div>
          <button onClick={logout} className="text-xs inline-flex items-center gap-1 bg-muted px-3 py-2 rounded-md">
            <LogOut size={12} /> Sair
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {modules.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-6 text-center space-y-3">
            <p className="font-serif text-lg">Sua conta ainda não tem acesso liberado</p>
            <p className="text-sm text-muted-foreground">
              Aguarde a liberação pelo administrador ou entre em contato pelo WhatsApp.
            </p>
            <button onClick={logout} className="text-xs inline-flex items-center gap-1 bg-muted px-3 py-2 rounded-md">
              <LogOut size={12} /> Sair
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modules.map((m) => (
              <Link
                key={m}
                to={moduleRoute[m]}
                className="group bg-card border border-border rounded-lg p-5 hover:border-primary transition-colors flex flex-col gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                    {moduleIcon[m]}
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-primary">Módulo</p>
                    <h2 className="font-serif text-lg">{moduleLabel[m]}</h2>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{moduleDesc[m]}</p>
                <span className="mt-auto text-xs inline-flex items-center gap-1 text-primary opacity-80 group-hover:opacity-100">
                  Abrir <ArrowRight size={12} />
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
