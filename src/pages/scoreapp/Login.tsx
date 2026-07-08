import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Trophy, ArrowLeft } from "lucide-react";

export default function ScoreLogin() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) navigate("/scoreapp/app", { replace: true }); });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(null); setInfo(null);
    if (mode === "forgot") {
      const { error } = await supabase.functions.invoke("password-reset-dispatch", {
        body: { email: email.trim().toLowerCase(), source: "scoreapp" },
      });
      setLoading(false);
      if (error) { setError("Não foi possível processar o pedido."); return; }
      setInfo("Se este e-mail estiver cadastrado, enviamos uma nova senha temporária pelo WhatsApp.");
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    navigate("/scoreapp/app", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-6"><Trophy className="text-primary" /><span className="font-serif text-xl">Score Comercial</span></div>
        <form onSubmit={submit} className="bg-card border border-border rounded-lg p-8 space-y-4">
          <h1 className="font-serif text-2xl">{mode === "login" ? "Entrar" : "Esqueci minha senha"}</h1>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" className="w-full bg-input border border-border rounded-md px-4 py-3 text-sm" />
          {mode === "login" && (
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha" className="w-full bg-input border border-border rounded-md px-4 py-3 text-sm" />
          )}
          <button disabled={loading} className="w-full bg-primary text-primary-foreground uppercase tracking-wide text-sm py-3 rounded-md flex items-center justify-center">
            {loading ? <Loader2 className="animate-spin" size={16} /> : mode === "login" ? "Entrar" : "Enviar nova senha"}
          </button>
          {error && <p className="text-destructive text-xs">{error}</p>}
          {info && <p className="text-emerald-500 text-xs">{info}</p>}
          <button
            type="button"
            onClick={() => { setMode(mode === "login" ? "forgot" : "login"); setError(null); setInfo(null); }}
            className="w-full text-center text-xs text-muted-foreground hover:text-primary inline-flex items-center justify-center gap-1"
          >
            {mode === "login" ? "Esqueci minha senha" : (<><ArrowLeft size={12} /> Voltar ao login</>)}
          </button>
          {mode === "login" && (
            <p className="text-center text-xs text-muted-foreground">
              Ainda não tem conta? <Link to="/scoreapp/cadastro" className="text-primary">Criar agora</Link>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
