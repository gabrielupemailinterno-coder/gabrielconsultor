import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const planos = [
  { key: "mensal", nome: "Mensal", preco: "R$ 9,70", periodo: "/mês", destaque: false },
  { key: "semestral", nome: "Semestral", preco: "R$ 49,70", periodo: "por 6 meses", destaque: true },
];

export default function ScorePlanos() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const subscribe = async (planKey: string) => {
    setLoading(planKey);
    try {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        toast({ title: "Faça login", description: "Entre na sua conta para assinar." });
        navigate("/scoreapp/login");
        return;
      }
      const { data, error } = await supabase.functions.invoke("cora-pix-checkout", {
        body: { plan_key: planKey, terms_accepted: true },
      });
      if (error || data?.error) {
        toast({
          title: "Erro no checkout",
          description: data?.error || error?.message || "Tente novamente.",
          variant: "destructive",
        });
        return;
      }
      navigate(`/scoreapp/checkout-pix?invoice=${data.invoiceId}`);
    } catch (err: any) {
      toast({ title: "Erro no checkout", description: err?.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/scoreapp/app" className="flex items-center gap-2"><Trophy className="text-primary" size={20} /><span className="font-serif text-lg">Score Comercial</span></Link>
          <Link to="/scoreapp/app" className="text-sm text-muted-foreground">Voltar</Link>
        </div>
      </header>
      <section className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h1 className="font-serif text-4xl mb-3">Planos</h1>
        <p className="text-muted-foreground mb-10">Ferramenta simples, preço acessível.</p>
        <div className="grid md:grid-cols-2 gap-4">
          {planos.map((p) => (
            <div key={p.key} className={`bg-card border rounded-lg p-8 text-left ${p.destaque ? "border-primary" : "border-border"}`}>
              {p.destaque && <span className="text-[10px] uppercase tracking-wider bg-primary text-primary-foreground px-2 py-1 rounded">Mais escolhido</span>}
              <div className="font-serif text-2xl mt-3">{p.nome}</div>
              <div className="font-mono text-4xl text-primary mt-2">{p.preco}<span className="text-sm text-muted-foreground ml-1">{p.periodo}</span></div>
              <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                {["Registro diário ilimitado","Score comercial e diagnóstico","Conteúdos de vendas","Badges de progresso"].map((f) => (
                  <li key={f} className="flex items-center gap-2"><Check size={14} className="text-primary" /> {f}</li>
                ))}
              </ul>
              <button
                disabled={loading !== null}
                onClick={() => subscribe(p.key)}
                className="w-full mt-8 bg-primary text-primary-foreground uppercase tracking-wide text-sm py-3 rounded-md flex items-center justify-center gap-2"
              >
                {loading === p.key ? <Loader2 className="animate-spin" size={16} /> : `Assinar ${p.nome}`}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
