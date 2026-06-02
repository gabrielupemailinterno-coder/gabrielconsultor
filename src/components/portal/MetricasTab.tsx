import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, TrendingUp } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { toast } from "sonner";

type Checkpoint = {
  id: string; period_start: string;
  leads_inbound: number; leads_outbound: number; connection_rate: number;
  meetings_scheduled: number; meetings_held: number;
  sales_count: number; revenue_cents: number;
};

const emptyForm = {
  period_start: new Date().toISOString().slice(0, 10),
  leads_inbound: 0, leads_outbound: 0, connection_rate: 0,
  meetings_scheduled: 0, meetings_held: 0, sales_count: 0, revenue_cents: 0,
};

export default function MetricasTab({ menteeId }: { menteeId: string }) {
  const [data, setData] = useState<Checkpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [revenueInput, setRevenueInput] = useState("0");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("metrics_checkpoints").select("*").eq("mentee_id", menteeId).order("period_start");
    setData((data as Checkpoint[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [menteeId]);

  const save = async () => {
    setSaving(true);
    const cents = Math.round(parseFloat(revenueInput.replace(",", ".") || "0") * 100);
    const payload = { ...form, revenue_cents: cents, mentee_id: menteeId };
    const { error } = await supabase.from("metrics_checkpoints").upsert(payload, { onConflict: "mentee_id,period_start" });
    setSaving(false);
    if (error) { toast.error("Não foi possível salvar."); return; }
    toast.success("Checkpoint salvo.");
    setOpen(false);
    setForm({ ...emptyForm });
    setRevenueInput("0");
    load();
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div>;

  const last = data[data.length - 1];
  const fmtBRL = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="Leads (últ.)" value={last ? `${last.leads_inbound + last.leads_outbound}` : "—"} />
        <KPI label="Reuniões realizadas" value={last ? `${last.meetings_held}/${last.meetings_scheduled}` : "—"} />
        <KPI label="Vendas" value={last ? `${last.sales_count}` : "—"} />
        <KPI label="Faturamento" value={last ? fmtBRL(last.revenue_cents) : "—"} />
      </div>

      {data.length >= 2 && (
        <Card className="p-5 border-border/60">
          <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground"><TrendingUp size={14} /> Evolução por período</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.map((d) => ({ name: d.period_start.slice(5), Receita: d.revenue_cents / 100, Reuniões: d.meetings_held }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Line type="monotone" dataKey="Receita" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Reuniões" stroke="hsl(var(--accent-foreground))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <Card className="p-0 overflow-hidden border-border/60">
        <div className="flex items-center justify-between p-4 border-b border-border/60">
          <h3 className="font-semibold">Histórico de Checkpoints</h3>
          <Button size="sm" onClick={() => setOpen(true)} className="gap-1.5"><Plus size={14} /> Novo</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-mono-data">
            <thead className="text-xs text-muted-foreground uppercase border-b border-border/60">
              <tr><th className="text-left p-3">Período</th><th className="text-right p-3">Leads</th><th className="text-right p-3">Conexão</th><th className="text-right p-3">Reuniões</th><th className="text-right p-3">Vendas</th><th className="text-right p-3">Receita</th></tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr><td colSpan={6} className="text-center p-8 text-muted-foreground">Nenhum checkpoint registrado.</td></tr>
              ) : data.map((d) => (
                <tr key={d.id} className="border-b border-border/40">
                  <td className="p-3">{new Date(d.period_start).toLocaleDateString("pt-BR")}</td>
                  <td className="text-right p-3">{d.leads_inbound + d.leads_outbound}</td>
                  <td className="text-right p-3">{Number(d.connection_rate).toFixed(1)}%</td>
                  <td className="text-right p-3">{d.meetings_held}/{d.meetings_scheduled}</td>
                  <td className="text-right p-3">{d.sales_count}</td>
                  <td className="text-right p-3">{fmtBRL(d.revenue_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Novo checkpoint quinzenal</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Início do período" type="date" value={form.period_start} onChange={(v) => setForm({ ...form, period_start: v })} />
            <Field label="Taxa de conexão (%)" type="number" value={String(form.connection_rate)} onChange={(v) => setForm({ ...form, connection_rate: parseFloat(v) || 0 })} />
            <Field label="Leads inbound" type="number" value={String(form.leads_inbound)} onChange={(v) => setForm({ ...form, leads_inbound: parseInt(v) || 0 })} />
            <Field label="Leads outbound" type="number" value={String(form.leads_outbound)} onChange={(v) => setForm({ ...form, leads_outbound: parseInt(v) || 0 })} />
            <Field label="Reuniões agendadas" type="number" value={String(form.meetings_scheduled)} onChange={(v) => setForm({ ...form, meetings_scheduled: parseInt(v) || 0 })} />
            <Field label="Reuniões realizadas" type="number" value={String(form.meetings_held)} onChange={(v) => setForm({ ...form, meetings_held: parseInt(v) || 0 })} />
            <Field label="Quantidade de vendas" type="number" value={String(form.sales_count)} onChange={(v) => setForm({ ...form, sales_count: parseInt(v) || 0 })} />
            <Field label="Faturamento (R$)" type="text" value={revenueInput} onChange={setRevenueInput} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="animate-spin" size={14} /> : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const KPI = ({ label, value }: { label: string; value: string }) => (
  <Card className="p-4 border-border/60">
    <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
    <p className="font-mono-data text-xl mt-1">{value}</p>
  </Card>
);

const Field = ({ label, ...props }: { label: string } & React.ComponentProps<typeof Input>) => (
  <div className="space-y-1">
    <label className="text-xs text-muted-foreground">{label}</label>
    <Input {...props} onChange={(e) => (props as any).onChange(e.target.value)} />
  </div>
);
