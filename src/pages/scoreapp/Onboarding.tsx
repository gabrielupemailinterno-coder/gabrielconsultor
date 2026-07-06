import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function ScoreOnboarding() {
  const navigate = useNavigate();
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [g, setG] = useState({
    meta_mensal_valor: 0, ticket_medio: 0, meta_vendas: 0,
    ligacoes_dia: 0, whatsapps_dia: 0, apresentacoes_semana: 0, propostas_semana: 0, segmento: "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { navigate("/scoreapp/login", { replace: true }); return; }
      setUid(data.session.user.id);
      const { data: existing } = await supabase.from("score_goals").select("*").eq("user_id", data.session.user.id).maybeSingle();
      if (existing) navigate("/scoreapp/app", { replace: true });
    });
  }, [navigate]);

  const set = (k: string, v: any) => setG((s) => ({ ...s, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!uid) return;
    setLoading(true);
    await supabase.from("score_goals").insert({ ...g, user_id: uid });
    navigate("/scoreapp/app", { replace: true });
  };

  const Field = ({ k, label, type = "number" }: any) => (
    <label className="block">
      <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      <input type={type} value={(g as any)[k]} onChange={(e) => set(k, type === "number" ? Number(e.target.value) : e.target.value)}
        className="w-full mt-1 bg-input border border-border rounded-md px-4 py-3 text-sm" />
    </label>
  );

  return (
    <div className="min-h-screen bg-background text-foreground py-10">
      <div className="max-w-2xl mx-auto px-6">
        <h1 className="font-serif text-3xl mb-2">Suas metas</h1>
        <p className="text-muted-foreground text-sm mb-8">Poucos números para começarmos a calcular seu score.</p>
        <form onSubmit={submit} className="grid md:grid-cols-2 gap-4 bg-card border border-border rounded-lg p-6">
          <Field k="meta_mensal_valor" label="Meta mensal (R$)" />
          <Field k="ticket_medio" label="Ticket médio (R$)" />
          <Field k="meta_vendas" label="Vendas/mês" />
          <Field k="ligacoes_dia" label="Ligações por dia" />
          <Field k="whatsapps_dia" label="WhatsApps por dia" />
          <Field k="apresentacoes_semana" label="Apresentações por semana" />
          <Field k="propostas_semana" label="Propostas por semana" />
          <Field k="segmento" label="Segmento de atuação" type="text" />
          <button disabled={loading} className="md:col-span-2 bg-primary text-primary-foreground uppercase tracking-wide text-sm py-3 rounded-md flex items-center justify-center">
            {loading ? <Loader2 className="animate-spin" size={16} /> : "Salvar e continuar"}
          </button>
        </form>
      </div>
    </div>
  );
}
