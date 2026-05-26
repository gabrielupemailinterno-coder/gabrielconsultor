import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Loader2 } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/admin", { replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate("/admin", { replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/admin`,
    });
    if (result.error) {
      setError(result.error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md bg-card border border-border rounded-lg p-8">
        <h1 className="font-serif text-2xl mb-2">Acesso Restrito</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Faça login para acessar o painel administrativo.
        </p>
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full bg-primary text-primary-foreground font-semibold text-sm uppercase tracking-wide px-6 py-4 rounded-md hover:brightness-110 transition disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : "Entrar com Google"}
        </button>
        {error && <p className="text-destructive text-xs mt-4">{error}</p>}
        <p className="text-muted-foreground text-xs mt-6 text-center">
          Apenas administradores autorizados têm acesso.
        </p>
      </div>
    </div>
  );
};

export default Auth;
