import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, Lock } from "lucide-react";

export default function Entrar() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "/app";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate(next, { replace: true });
    });
  }, [navigate, next]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setLoading(false);
    if (error) {
      setError("E-mail ou senha incorretos.");
      return;
    }
    toast({ title: "Bem-vindo!" });
    navigate(next, { replace: true });
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-card border border-border rounded-lg p-6 space-y-5">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center">
            <Lock className="text-primary" size={20} />
          </div>
          <p className="text-[10px] uppercase tracking-widest text-primary">Gabriel Consultor</p>
          <h1 className="font-serif text-2xl">Entrar</h1>
          <p className="text-xs text-muted-foreground">Acesso único para Mentoria, Score Comercial, Parceria e Admin.</p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input
            type="email"
            required
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="w-full bg-background border border-border rounded px-3 py-2 text-sm"
          />
          <input
            type="password"
            required
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="w-full bg-background border border-border rounded px-3 py-2 text-sm"
          />
          {error && <p className="text-destructive text-xs">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground text-xs uppercase tracking-wide py-2.5 rounded-md inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 className="animate-spin" size={14} />}
            Entrar
          </button>
        </form>

        <div className="flex items-center justify-between text-xs">
          <Link to="/esqueci-senha" className="text-muted-foreground hover:text-primary">
            Esqueci minha senha
          </Link>
          <Link to="/app/cadastro" className="text-primary">
            Criar conta Score
          </Link>
        </div>
      </div>
    </main>
  );
}
