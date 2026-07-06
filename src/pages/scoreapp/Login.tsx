import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Trophy } from "lucide-react";

export default function ScoreLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) navigate("/scoreapp/app", { replace: true }); });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    navigate("/scoreapp/app", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-6"><Trophy className="text-primary" /><span className="font-serif text-xl">Score Comercial</span></div>
        <form onSubmit={submit} className="bg-card border border-border rounded-lg p-8 space-y-4">
          <h1 className="font-serif text-2xl">Entrar</h1>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" className="w-full bg-input border border-border rounded-md px-4 py-3 text-sm" />
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha" className="w-full bg-input border border-border rounded-md px-4 py-3 text-sm" />
          <button disabled={loading} className="w-full bg-primary text-primary-foreground uppercase tracking-wide text-sm py-3 rounded-md flex items-center justify-center">
            {loading ? <Loader2 className="animate-spin" size={16} /> : "Entrar"}
          </button>
          {error && <p className="text-destructive text-xs">{error}</p>}
          <p className="text-center text-xs text-muted-foreground">
            Ainda não tem conta? <Link to="/scoreapp/cadastro" className="text-primary">Criar agora</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
