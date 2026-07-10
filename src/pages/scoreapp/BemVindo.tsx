import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Trophy, ArrowRight, MessageCircle, Loader2 } from "lucide-react";

export default function ScoreBemVindo() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        navigate("/app/login", { replace: true });
        return;
      }
      const { data } = await supabase
        .from("score_profiles")
        .select("*")
        .eq("user_id", sess.session.user.id)
        .maybeSingle();
      setProfile(data);
      setLoading(false);
    })();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const isSemestral = profile?.plan === "semestral";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Bem-vindo · Score Comercial</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-2">
          <Trophy className="text-primary" size={20} />
          <span className="font-serif text-lg">Score Comercial</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/15 text-primary flex items-center justify-center mb-6">
            <CheckCircle2 size={32} />
          </div>
          <h1 className="font-serif text-3xl md:text-5xl leading-tight mb-4">
            Parabéns! Sua rotina comercial começa a mudar agora.
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Seu pagamento foi confirmado e seu acesso ao Score Comercial está sendo preparado.
          </p>
        </div>

        <section className="bg-card border border-border rounded-lg p-8 mt-10">
          <div className="text-xs uppercase tracking-widest text-primary mb-4">Próximos passos</div>
          <ol className="space-y-4">
            {[
              "Confira seu e-mail e WhatsApp — enviamos suas orientações iniciais.",
              "Acesse sua conta no Score Comercial.",
              "Preencha suas metas e indicadores no onboarding.",
              "Realize seu primeiro check-in comercial hoje.",
            ].map((t, i) => (
              <li key={t} className="flex items-start gap-3 text-sm">
                <span className="w-6 h-6 rounded-full bg-primary/15 text-primary font-mono text-[11px] flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <span className="text-muted-foreground pt-0.5">{t}</span>
              </li>
            ))}
          </ol>

          {isSemestral && (
            <div className="mt-6 border-t border-border pt-6 text-sm text-muted-foreground">
              Como você escolheu o plano semestral, você também receberá as orientações para agendar sua{" "}
              <span className="text-foreground">reunião individual de 60 minutos</span> com Gabriel Vieira.
            </div>
          )}
        </section>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/app/score"
            className="bg-primary text-primary-foreground px-6 py-4 rounded-md text-sm uppercase tracking-wide inline-flex items-center justify-center gap-2"
          >
            Acessar o Score Comercial <ArrowRight size={16} />
          </Link>
          <a
            href="https://wa.me/5511999999999"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-border px-6 py-4 rounded-md text-sm uppercase tracking-wide inline-flex items-center justify-center gap-2 hover:bg-muted transition"
          >
            <MessageCircle size={16} /> Falar com o suporte
          </a>
        </div>
      </main>
    </div>
  );
}
