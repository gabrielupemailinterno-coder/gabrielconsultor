import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function PartnerLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "forgot">("login");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/parceiro", { replace: true });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.functions.invoke("password-reset-dispatch", {
          body: { email: email.trim().toLowerCase(), source: "partner" },
        });
        if (error) throw error;
        toast({
          title: "Se este e-mail estiver cadastrado, enviamos uma nova senha via WhatsApp.",
        });
        setMode("login");
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      navigate("/parceiro", { replace: true });
    } catch (e: any) {
      toast({ title: "Erro", description: e?.message || "Falha ao entrar", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-lg p-6 space-y-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-primary">Portal do Parceiro</p>
          <h1 className="font-serif text-2xl mt-1">
            {mode === "login" ? "Entrar" : "Recuperar acesso"}
          </h1>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input
            type="email"
            required
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-background border border-border rounded px-3 py-2 text-sm"
          />
          {mode === "login" && (
            <input
              type="password"
              required
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-background border border-border rounded px-3 py-2 text-sm"
            />
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground text-xs uppercase tracking-wide py-2 rounded-md inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 className="animate-spin" size={14} />}
            {mode === "login" ? "Entrar" : "Enviar link"}
          </button>
        </form>
        <button
          onClick={() => setMode((m) => (m === "login" ? "forgot" : "login"))}
          className="text-xs text-muted-foreground hover:text-primary"
        >
          {mode === "login" ? "Esqueci minha senha" : "Voltar ao login"}
        </button>
      </div>
    </div>
  );
}
