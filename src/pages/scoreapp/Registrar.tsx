import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ScoreLayout from "@/components/scoreapp/ScoreLayout";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CurrencyInput, IntegerInput } from "@/components/scoreapp/MaskedInputs";

const numFields: { k: string; label: string }[] = [
  { k: "ligacoes", label: "Ligações" },
  { k: "whatsapps", label: "WhatsApps" },
  { k: "prospeccoes", label: "Novos leads" },
  { k: "contatos_efetivos", label: "Contatos efetivos" },
  { k: "reunioes_agendadas", label: "Reuniões agendadas" },
  { k: "apresentacoes", label: "Apresentações" },
  { k: "propostas", label: "Propostas" },
  { k: "vendas", label: "Vendas" },
];

export default function ScoreRegistrar() {
  const navigate = useNavigate();
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [values, setValues] = useState<Record<string, number>>(() => Object.fromEntries(numFields.map((f) => [f.k, 0])));
  const [valor, setValor] = useState(0);
  const [obs, setObs] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate("/scoreapp/login", { replace: true });
      else setUid(data.session.user.id);
    });
  }, [navigate]);

  useEffect(() => {
    if (!uid) return;
    supabase.from("score_daily_logs").select("*").eq("user_id", uid).eq("date", date).maybeSingle().then(({ data }) => {
      if (data) {
        setValues(Object.fromEntries(numFields.map((f) => [f.k, (data as any)[f.k] || 0])));
        setValor((data as any).valor_vendido || 0);
        setObs((data as any).observacoes || "");
      } else {
        setValues(Object.fromEntries(numFields.map((f) => [f.k, 0])));
        setValor(0); setObs("");
      }
    });
  }, [uid, date]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!uid) return;
    setLoading(true);
    const payload = { user_id: uid, date, ...values, valor_vendido: valor, observacoes: obs || null };
    const { error } = await supabase.from("score_daily_logs").upsert(payload, { onConflict: "user_id,date" });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setSaved(true); toast.success("Dia registrado!");
    setTimeout(() => navigate("/scoreapp/app"), 600);
  };

  return (
    <ScoreLayout>
      <h1 className="font-serif text-3xl mb-6">Registrar o dia</h1>
      <form onSubmit={submit} className="bg-card border border-border rounded-lg p-6 space-y-4">
        <label className="block">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Data</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full mt-1 bg-input border border-border rounded-md px-4 py-3 text-sm" />
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {numFields.map((f) => (
            <label key={f.k} className="block">
              <span className="text-xs text-muted-foreground">{f.label}</span>
              <input type="number" inputMode="numeric" min={0} value={values[f.k]}
                onChange={(e) => setValues((v) => ({ ...v, [f.k]: Number(e.target.value) }))}
                className="w-full mt-1 bg-input border border-border rounded-md px-3 py-3 text-lg font-mono" />
            </label>
          ))}
        </div>
        <label className="block">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Valor vendido (R$)</span>
          <input type="number" inputMode="decimal" min={0} step="0.01" value={valor}
            onChange={(e) => setValor(Number(e.target.value))}
            className="w-full mt-1 bg-input border border-border rounded-md px-4 py-3 text-lg font-mono" />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Observações</span>
          <textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={3} className="w-full mt-1 bg-input border border-border rounded-md px-4 py-3 text-sm" />
        </label>
        <button disabled={loading || saved} className="w-full bg-primary text-primary-foreground uppercase tracking-wide text-sm py-4 rounded-md flex items-center justify-center">
          {loading ? <Loader2 className="animate-spin" size={16} /> : "Salvar"}
        </button>
      </form>
    </ScoreLayout>
  );
}
