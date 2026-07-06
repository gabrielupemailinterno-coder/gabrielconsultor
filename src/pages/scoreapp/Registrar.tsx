import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ScoreLayout from "@/components/scoreapp/ScoreLayout";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Download, Upload, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { CurrencyInput, IntegerInput } from "@/components/scoreapp/MaskedInputs";
import { fmtBRL, computeDayScore } from "@/lib/scoreapp/calc";
import type { DailyLog, ScoreGoals } from "@/lib/scoreapp/types";

const numFields: { k: keyof DailyLog; label: string }[] = [
  { k: "ligacoes", label: "Ligações" },
  { k: "whatsapps", label: "WhatsApps" },
  { k: "prospeccoes", label: "Novos leads" },
  { k: "contatos_efetivos", label: "Contatos efetivos" },
  { k: "reunioes_agendadas", label: "Reuniões agendadas" },
  { k: "apresentacoes", label: "Apresentações" },
  { k: "propostas", label: "Propostas" },
  { k: "vendas", label: "Vendas" },
];

const EXPORT_HEADERS: { key: keyof DailyLog; label: string }[] = [
  { key: "date", label: "Data" },
  ...(numFields as any),
  { key: "valor_vendido", label: "Valor vendido (R$)" },
  { key: "observacoes", label: "Observações" },
];

function parseImportedDate(v: any): string | null {
  if (v == null || v === "") return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "number") {
    // Excel serial date
    const d = XLSX.SSF.parse_date_code(v);
    if (!d) return null;
    return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
  }
  const s = String(v).trim();
  // dd/mm/yyyy
  const br = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (br) {
    const y = br[3].length === 2 ? 2000 + Number(br[3]) : Number(br[3]);
    return `${y}-${String(br[2]).padStart(2, "0")}-${String(br[1]).padStart(2, "0")}`;
  }
  // yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

function parseImportedNumber(v: any): number {
  if (v == null || v === "") return 0;
  if (typeof v === "number") return v;
  const cleaned = String(v).replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  const n = Number(cleaned);
  return isNaN(n) ? 0 : n;
}

export default function ScoreRegistrar() {
  const navigate = useNavigate();
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [values, setValues] = useState<Record<string, number>>(() => Object.fromEntries(numFields.map((f) => [f.k, 0])));
  const [valor, setValor] = useState(0);
  const [obs, setObs] = useState("");
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [goals, setGoals] = useState<ScoreGoals | null>(null);
  const [reloadTick, setReloadTick] = useState(0);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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
  }, [uid, date, reloadTick]);

  useEffect(() => {
    if (!uid) return;
    supabase.from("score_daily_logs").select("*").eq("user_id", uid).order("date", { ascending: false }).limit(180)
      .then(({ data }) => setLogs((data as any) || []));
    supabase.from("score_goals").select("*").eq("user_id", uid).order("effective_from", { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => setGoals((data as any) || null));
  }, [uid, reloadTick]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!uid) return;
    setLoading(true);
    const payload = { user_id: uid, date, ...values, valor_vendido: valor, observacoes: obs || null };
    const { error } = await supabase.from("score_daily_logs").upsert(payload, { onConflict: "user_id,date" });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Dia registrado!");
    setReloadTick((t) => t + 1);
  };

  const removeLog = async (d: string) => {
    if (!uid) return;
    if (!confirm(`Excluir o registro de ${new Date(d + "T00:00:00").toLocaleDateString("pt-BR")}?`)) return;
    const { error } = await supabase.from("score_daily_logs").delete().eq("user_id", uid).eq("date", d);
    if (error) return toast.error(error.message);
    toast.success("Registro excluído.");
    setReloadTick((t) => t + 1);
  };

  const exportXlsx = () => {
    const rows = logs.map((l) => {
      const obj: any = {};
      EXPORT_HEADERS.forEach(({ key, label }) => {
        if (key === "date") obj[label] = l.date;
        else obj[label] = (l as any)[key] ?? "";
      });
      return obj;
    });
    const ws = XLSX.utils.json_to_sheet(rows, { header: EXPORT_HEADERS.map((h) => h.label) });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Score Comercial");
    XLSX.writeFile(wb, `score-comercial-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const downloadTemplate = () => {
    const example = [{
      "Data": new Date().toISOString().slice(0, 10),
      "Ligações": 20, "WhatsApps": 15, "Novos leads": 10, "Contatos efetivos": 8,
      "Reuniões agendadas": 3, "Apresentações": 2, "Propostas": 1, "Vendas": 0,
      "Valor vendido (R$)": 0, "Observações": "",
    }];
    const ws = XLSX.utils.json_to_sheet(example);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Modelo");
    XLSX.writeFile(wb, "modelo-score-comercial.xlsx");
  };

  const handleFile = async (file: File) => {
    if (!uid) return;
    setImporting(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array", cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
      if (rows.length === 0) { toast.error("Planilha vazia."); return; }

      // Detect column name variants (case-insensitive, accent-insensitive)
      const norm = (s: string) => s.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      const first = rows[0];
      const cols = Object.keys(first);
      const findCol = (...names: string[]) => cols.find((c) => names.map(norm).includes(norm(c)));
      const map = {
        date: findCol("data", "date", "dia"),
        ligacoes: findCol("ligações", "ligacoes", "calls"),
        whatsapps: findCol("whatsapps", "whatsapp", "wpp"),
        prospeccoes: findCol("novos leads", "prospecções", "prospeccoes", "leads", "prospecção"),
        contatos_efetivos: findCol("contatos efetivos", "contatos", "conexões"),
        reunioes_agendadas: findCol("reuniões agendadas", "reunioes agendadas", "reuniões", "reunioes"),
        apresentacoes: findCol("apresentações", "apresentacoes"),
        propostas: findCol("propostas", "orçamentos", "orcamentos"),
        vendas: findCol("vendas", "fechamentos"),
        valor_vendido: findCol("valor vendido (r$)", "valor vendido", "valor", "receita", "faturamento"),
        observacoes: findCol("observações", "observacoes", "obs", "notas"),
      };
      if (!map.date) { toast.error("Coluna 'Data' não encontrada na planilha."); return; }

      const payloads: any[] = [];
      const errors: string[] = [];
      rows.forEach((r, i) => {
        const d = parseImportedDate(r[map.date!]);
        if (!d) { errors.push(`Linha ${i + 2}: data inválida`); return; }
        payloads.push({
          user_id: uid, date: d,
          ligacoes: map.ligacoes ? parseImportedNumber(r[map.ligacoes]) : 0,
          whatsapps: map.whatsapps ? parseImportedNumber(r[map.whatsapps]) : 0,
          prospeccoes: map.prospeccoes ? parseImportedNumber(r[map.prospeccoes]) : 0,
          contatos_efetivos: map.contatos_efetivos ? parseImportedNumber(r[map.contatos_efetivos]) : 0,
          reunioes_agendadas: map.reunioes_agendadas ? parseImportedNumber(r[map.reunioes_agendadas]) : 0,
          apresentacoes: map.apresentacoes ? parseImportedNumber(r[map.apresentacoes]) : 0,
          propostas: map.propostas ? parseImportedNumber(r[map.propostas]) : 0,
          vendas: map.vendas ? parseImportedNumber(r[map.vendas]) : 0,
          valor_vendido: map.valor_vendido ? parseImportedNumber(r[map.valor_vendido]) : 0,
          observacoes: map.observacoes ? String(r[map.observacoes] || "").trim() || null : null,
        });
      });

      if (payloads.length === 0) {
        toast.error("Nenhuma linha válida encontrada.");
        return;
      }

      // Upsert in chunks
      const chunkSize = 200;
      let ok = 0;
      for (let i = 0; i < payloads.length; i += chunkSize) {
        const chunk = payloads.slice(i, i + chunkSize);
        const { error } = await supabase.from("score_daily_logs").upsert(chunk, { onConflict: "user_id,date" });
        if (error) { toast.error(`Erro ao importar: ${error.message}`); return; }
        ok += chunk.length;
      }
      toast.success(`${ok} registro(s) importado(s)${errors.length ? ` (${errors.length} linhas ignoradas)` : ""}.`);
      setReloadTick((t) => t + 1);
    } catch (err: any) {
      toast.error(`Falha ao ler planilha: ${err.message || err}`);
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const totals = useMemo(() => {
    const sum = (k: keyof DailyLog) => logs.reduce((a, l) => a + (Number((l as any)[k]) || 0), 0);
    return {
      ligacoes: sum("ligacoes"), whatsapps: sum("whatsapps"), prospeccoes: sum("prospeccoes"),
      contatos_efetivos: sum("contatos_efetivos"), reunioes_agendadas: sum("reunioes_agendadas"),
      apresentacoes: sum("apresentacoes"), propostas: sum("propostas"), vendas: sum("vendas"),
      valor_vendido: sum("valor_vendido"),
    };
  }, [logs]);

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
            <label key={f.k as string} className="block">
              <span className="text-xs text-muted-foreground">{f.label}</span>
              <IntegerInput
                value={values[f.k as string] ?? 0}
                onChange={(v) => setValues((prev) => ({ ...prev, [f.k as string]: v }))}
                className="w-full mt-1 bg-input border border-border rounded-md px-3 py-3 text-lg font-mono"
              />
            </label>
          ))}
        </div>
        <label className="block">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Valor vendido (R$)</span>
          <CurrencyInput value={valor} onChange={setValor} className="w-full mt-1 bg-input border border-border rounded-md px-4 py-3 text-lg font-mono" />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Observações</span>
          <textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={3} className="w-full mt-1 bg-input border border-border rounded-md px-4 py-3 text-sm" />
        </label>
        <button disabled={loading} className="w-full bg-primary text-primary-foreground uppercase tracking-wide text-sm py-4 rounded-md flex items-center justify-center">
          {loading ? <Loader2 className="animate-spin" size={16} /> : "Salvar"}
        </button>
      </form>

      <div className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-serif text-2xl">Meus registros</h2>
            <p className="text-xs text-muted-foreground">Últimos {logs.length} dia(s) registrados.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={downloadTemplate} className="text-xs uppercase tracking-wide border border-border px-3 py-2 rounded-md flex items-center gap-2 hover:bg-secondary/60">
              <Download size={14} /> Modelo de planilha
            </button>
            <button onClick={() => fileRef.current?.click()} disabled={importing}
              className="text-xs uppercase tracking-wide border border-border px-3 py-2 rounded-md flex items-center gap-2 hover:bg-secondary/60">
              {importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              Importar planilha
            </button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} className="hidden" />
            <button onClick={exportXlsx} disabled={logs.length === 0}
              className="text-xs uppercase tracking-wide bg-primary text-primary-foreground px-3 py-2 rounded-md flex items-center gap-2 disabled:opacity-50">
              <Download size={14} /> Exportar Excel
            </button>
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-lg p-8 text-center text-sm text-muted-foreground">
            Nenhum registro ainda. Preencha o formulário acima ou importe uma planilha.
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left p-3">Data</th>
                    {numFields.map((f) => <th key={f.k as string} className="text-right p-3">{f.label}</th>)}
                    <th className="text-right p-3">Valor</th>
                    <th className="text-right p-3">Score</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l) => {
                    const ds = computeDayScore(l, goals);
                    const color =
                      ds.score < 30 ? "bg-destructive/20 text-destructive"
                      : ds.score < 55 ? "bg-orange-500/20 text-orange-400"
                      : ds.score < 75 ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-emerald-500/20 text-emerald-400";
                    return (
                      <tr key={l.id} className="border-t border-border hover:bg-secondary/20">
                        <td className="p-3 whitespace-nowrap">{new Date(l.date + "T00:00:00").toLocaleDateString("pt-BR")}</td>
                        {numFields.map((f) => (
                          <td key={f.k as string} className="p-3 text-right font-mono text-xs">{(l as any)[f.k] || 0}</td>
                        ))}
                        <td className="p-3 text-right font-mono text-xs">{fmtBRL(l.valor_vendido || 0)}</td>
                        <td className="p-3 text-right whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded font-mono text-xs ${color}`} title={ds.label}>
                            {ds.score}
                          </span>
                        </td>
                        <td className="p-3 text-right whitespace-nowrap">
                          <button onClick={() => setDate(l.date)} className="text-muted-foreground hover:text-primary mr-2" title="Editar"><Pencil size={14} /></button>
                          <button onClick={() => removeLog(l.date)} className="text-muted-foreground hover:text-destructive" title="Excluir"><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="border-t border-border bg-secondary/20 text-xs">
                  <tr>
                    <td className="p-3 uppercase tracking-wider text-muted-foreground">Total</td>
                    {numFields.map((f) => (
                      <td key={f.k as string} className="p-3 text-right font-mono">{(totals as any)[f.k]}</td>
                    ))}
                    <td className="p-3 text-right font-mono">{fmtBRL(totals.valor_vendido)}</td>
                    <td className="p-3 text-right font-mono text-muted-foreground">
                      {logs.length > 0 ? Math.round(logs.reduce((a, l) => a + computeDayScore(l, goals).score, 0) / logs.length) : 0}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        <p className="text-[11px] text-muted-foreground mt-3">
          Dica: baixe o modelo de planilha para ver as colunas esperadas. A importação atualiza (ou cria) o registro do dia correspondente à data.
        </p>
      </div>
    </ScoreLayout>
  );
}
