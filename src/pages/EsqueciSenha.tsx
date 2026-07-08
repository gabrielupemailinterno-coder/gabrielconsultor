import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft, KeyRound } from "lucide-react";

export default function EsqueciSenha() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await supabase.functions.invoke("password-reset-dispatch", {
        body: { email: email.trim().toLowerCase(), origin: window.location.origin },
      });
    } catch {
      // silent; always show generic success
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-card border border-border rounded-lg p-6 space-y-5">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center">
            <KeyRound className="text-primary" size={20} />
          </div>
          <h1 className="font-serif text-2xl">Esqueci minha senha</h1>
          <p className="text-xs text-muted-foreground">
            Enviamos o link de redefinição para o WhatsApp cadastrado.
          </p>
        </div>

        {sent ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-emerald-500">
              Se este e-mail estiver cadastrado, você receberá o link em instantes pelo WhatsApp.
            </p>
            <Link
              to="/app/login"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
            >
              <ArrowLeft size={12} /> Voltar ao login
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <input
              type="email"
              required
              placeholder="E-mail cadastrado"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-background border border-border rounded px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground text-xs uppercase tracking-wide py-2.5 rounded-md inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 className="animate-spin" size={14} />}
              Enviar link
            </button>
            <Link
              to="/app/login"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
            >
              <ArrowLeft size={12} /> Voltar ao login
            </Link>
          </form>
        )}
      </div>
    </main>
  );
}
