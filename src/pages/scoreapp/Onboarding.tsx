import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { CurrencyInput, IntegerInput } from "@/components/scoreapp/MaskedInputs";

const CURRENCY_KEYS = new Set(["meta_mensal_valor", "ticket_medio"]);
const INTEGER_KEYS = new Set([
  "meta_vendas", "ligacoes_dia", "whatsapps_dia", "apresentacoes_semana", "propostas_semana",
]);

export default function ScoreOnboarding() {
  const navigate = useNavigate();
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [g, setG] = useState({
    meta_mensal_valor: 0, ticket_medio: 0, meta_vendas: 0,
    ligacoes_dia: 0, whatsapps_dia: 0, apresentacoes_semana: 0, propostas_semana: 0,
    segmento: "", descricao_venda: "",
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
    e.preventDefault();
    if (!uid) return;
    if (!g.descricao_venda.trim()) return;
    setLoading(true);
    await supabase.from("score_goals").insert({ ...g, user_id: uid });
    navigate("/scoreapp/app", { replace: true });
  };

  const fields: Array<[keyof typeof g, string]> = [
    ["meta_mensal_valor", "Meta mensal (R$)"],
    ["ticket_medio", "Ticket médio (R$)"],
    ["meta_vendas", "Vendas/mês"],
    ["ligacoes_dia", "Ligações por dia"],
    ["whatsapps_dia", "WhatsApps por dia"],
    ["apresentacoes_semana", "Apresentações por semana"],
    ["propostas_semana", "Propostas por semana"],
  ];

  const inputCls = "w-full mt-1 bg-input border border-border rounded-md px-4 py-3 text-sm font-mono";

  return (
    <div className="min-h-screen bg-background text-foreground py-10">
      <div className="max-w-2xl mx-auto px-6">
        <h1 className="font-serif text-3xl mb-2">Suas metas</h1>
        <p className="text-muted-foreground text-sm mb-8">Poucos números para começarmos a calcular seu score.</p>
        <form onSubmit={submit} className="grid md:grid-cols-2 gap-4 bg-card border border-border rounded-lg p-6">
          <label className="block md:col-span-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">O que você vende? (máx. 100)</span>
            <input
              type="text"
              maxLength={100}
              required
              value={g.descricao_venda}
              onChange={(e) => set("descricao_venda", e.target.value.slice(0, 100))}
              placeholder="Ex.: software de gestão para clínicas odontológicas"
              className="w-full mt-1 bg-input border border-border rounded-md px-4 py-3 text-sm"
            />
            <span className="text-[10px] text-muted-foreground">{g.descricao_venda.length}/100</span>
          </label>

          {fields.map(([k, label]) => (
            <label key={k as string} className="block">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
              {CURRENCY_KEYS.has(k as string) ? (
                <CurrencyInput value={(g as any)[k]} onChange={(v) => set(k as string, v)} className={inputCls} />
              ) : INTEGER_KEYS.has(k as string) ? (
                <IntegerInput value={(g as any)[k]} onChange={(v) => set(k as string, v)} className={inputCls} />
              ) : null}
            </label>
          ))}

          <label className="block md:col-span-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Segmento de atuação</span>
            <input
              type="text"
              value={g.segmento}
              onChange={(e) => set("segmento", e.target.value)}
              className="w-full mt-1 bg-input border border-border rounded-md px-4 py-3 text-sm"
            />
          </label>

          <button disabled={loading} className="md:col-span-2 bg-primary text-primary-foreground uppercase tracking-wide text-sm py-3 rounded-md flex items-center justify-center">
            {loading ? <Loader2 className="animate-spin" size={16} /> : "Salvar e continuar"}
          </button>
        </form>
      </div>
    </div>
  );
}
