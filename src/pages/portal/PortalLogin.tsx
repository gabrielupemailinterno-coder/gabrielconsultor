import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Lock, ArrowLeft } from "lucide-react";

export default function PortalLogin() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.classList.add("portal-theme");
    return () => document.documentElement.classList.remove("portal-theme");
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/mentorados", { replace: true });
    });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      const msg = (error.message || "").toLowerCase();
      if (msg.includes("not confirmed") || msg.includes("email_not_confirmed")) {
        setError("Sua conta ainda não foi ativada. Clique em 'Esqueci minha senha' para receber um link de acesso.");
      } else {
        setError("E-mail ou senha incorretos. Se for seu primeiro acesso, use 'Esqueci minha senha'.");
      }
      return;
    }
    navigate("/mentorados", { replace: true });
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    const { error } = await supabase.functions.invoke("mentee-forgot-password", {
      body: { email },
    });
    setLoading(false);
    if (error) {
      setError("Não foi possível processar o pedido. Tente novamente em instantes.");
      return;
    }
    setInfo("Se este e-mail estiver cadastrado, enviamos uma nova senha temporária. Verifique a caixa de entrada (e o spam).");
  };

  return (
    <main className="portal-theme min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <Card className="w-full max-w-md border-border/60 shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mb-2">
            <Lock className="text-primary" size={20} />
          </div>
          <CardTitle className="text-2xl">
            {mode === "login" ? "Portal do Mentorado" : "Esqueci minha senha"}
          </CardTitle>
          <CardDescription>
            {mode === "login" ? "Acesse seu acompanhamento exclusivo" : "Enviaremos um link para redefinir sua senha"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">E-mail</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Senha</label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              {info && <p className="text-sm text-emerald-500">{info}</p>}
              <Button type="submit" disabled={loading} className="w-full h-11 font-semibold">
                {loading ? <Loader2 className="animate-spin" size={16} /> : "Entrar"}
              </Button>
              <button
                type="button"
                onClick={() => { setMode("forgot"); setError(null); setInfo(null); }}
                className="block w-full text-center text-xs text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
              >
                Esqueci minha senha
              </button>
              <p className="text-xs text-muted-foreground text-center pt-2">
                Acesso liberado automaticamente após a confirmação do pagamento.
              </p>
            </form>
          ) : (
            <form onSubmit={handleForgot} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">E-mail do cadastro</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              {info && <p className="text-sm text-emerald-500">{info}</p>}
              <Button type="submit" disabled={loading} className="w-full h-11 font-semibold">
                {loading ? <Loader2 className="animate-spin" size={16} /> : "Enviar link de redefinição"}
              </Button>
              <button
                type="button"
                onClick={() => { setMode("login"); setError(null); setInfo(null); }}
                className="inline-flex items-center gap-1.5 w-full justify-center text-xs text-muted-foreground hover:text-primary"
              >
                <ArrowLeft size={12} /> Voltar ao login
              </button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
