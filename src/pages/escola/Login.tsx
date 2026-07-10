import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, GraduationCap } from "lucide-react";

export default function EscolaLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    navigate("/escola/conteudos", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Helmet>
        <title>Entrar | Escola de Vendedores Grátis</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-6">
          <GraduationCap className="text-primary" />
          <span className="font-serif text-xl">Escola de Vendedores</span>
        </div>
        <form onSubmit={submit} className="bg-card border border-border rounded-lg p-8 space-y-3">
          <h1 className="font-serif text-2xl mb-3">Entrar</h1>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail"
            className="w-full bg-input border border-border rounded-md px-4 py-3 text-sm"
          />
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            className="w-full bg-input border border-border rounded-md px-4 py-3 text-sm"
          />
          <button
            disabled={loading}
            className="w-full bg-primary text-primary-foreground uppercase tracking-wide text-sm py-3 rounded-md flex items-center justify-center"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : "Entrar"}
          </button>
          {error && <p className="text-destructive text-xs">{error}</p>}
          <div className="flex justify-between text-xs pt-2">
            <Link to="/app/esqueci-senha" className="text-muted-foreground hover:text-foreground">
              Esqueci minha senha
            </Link>
            <Link to="/escola/cadastro" className="text-primary">
              Criar conta grátis
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
