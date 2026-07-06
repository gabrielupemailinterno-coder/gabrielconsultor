import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { computeScore, computeTemperature, sum, monthLogs } from "@/lib/scoreapp/calc";
import type { DailyLog, ScoreGoals, ScoreProfile } from "@/lib/scoreapp/types";
import { Flame, Snowflake, Zap, Users } from "lucide-react";

type Row = ScoreProfile & { goals: ScoreGoals | null; logs: DailyLog[]; score: number; temperature: string };

const tempColor: Record<string, string> = {
  quente: "bg-primary/20 text-primary border-primary/40",
  engajado: "bg-accent/20 text-accent border-accent/40",
  ativacao: "bg-secondary text-foreground border-border",
  frio: "bg-muted text-muted-foreground border-border",
};
const tempIcon: Record<string, any> = { quente: Flame, engajado: Zap, ativacao: Users, frio: Snowflake };

export default function ScoreAdmin() {
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: profiles }, { data: goals }, { data: logs }] = await Promise.all([
        supabase.from("score_profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("score_goals").select("*"),
        supabase.from("score_daily_logs").select("*"),
      ]);
      const goalsBy = new Map<string, ScoreGoals>();
      (goals || []).forEach((g: any) => { const prev = goalsBy.get(g.user_id); if (!prev || new Date(g.effective_from) > new Date(prev.effective_from)) goalsBy.set(g.user_id, g); });
      const logsBy = new Map<string, DailyLog[]>();
      (logs || []).forEach((l: any) => { const arr = logsBy.get(l.user_id) || []; arr.push(l); logsBy.set(l.user_id, arr); });
      const built = (profiles || []).map((p: any) => {
        const g = goalsBy.get(p.user_id) || null;
        const l = logsBy.get(p.user_id) || [];
        const { score } = computeScore(l, g);
        const t = computeTemperature(l, g, !!p.phone && !!p.email);
        return { ...p, goals: g, logs: l, score, temperature: t } as Row;
      });
      setRows(built); setLoading(false);
    })();
  }, []);

  const stats = useMemo(() => {
    const now = Date.now();
    const active = rows.filter((r) => r.logs.some((l) => now - new Date(l.date).getTime() < 7 * 864e5)).length;
    return {
      total: rows.length, active, inactive: rows.length - active,
      quente: rows.filter((r) => r.temperature === "quente").length,
    };
  }, [rows]);

  const filtered = filter === "all" ? rows : rows.filter((r) => r.temperature === filter);

  if (loading) return <p className="text-muted-foreground text-sm">Carregando…</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[["Usuários", stats.total], ["Ativos 7d", stats.active], ["Inativos", stats.inactive], ["Leads quentes", stats.quente]].map(([l, v]) => (
          <div key={l as string} className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{l}</div>
            <div className="font-serif text-2xl mt-1">{v}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {["all", "quente", "engajado", "ativacao", "frio"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs border ${filter === f ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}>
            {f === "all" ? "Todos" : f}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto border border-border rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-secondary/30 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left p-3">Nome</th><th className="text-left p-3">Contato</th>
              <th className="text-left p-3">Segmento</th><th className="text-left p-3">Origem</th>
              <th className="text-left p-3">Plano</th><th className="text-left p-3">Cadastro</th>
              <th className="text-left p-3">Último</th><th className="text-left p-3">Score</th>
              <th className="text-left p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const Icon = tempIcon[r.temperature];
              return (
                <tr key={r.id} className="border-t border-border">
                  <td className="p-3">{r.full_name}</td>
                  <td className="p-3 text-xs">{r.email}<br /><span className="text-muted-foreground">{r.phone}</span></td>
                  <td className="p-3 text-xs">{r.segment || r.goals?.segmento || "-"}</td>
                  <td className="p-3 text-xs">{r.lead_origin || "-"}</td>
                  <td className="p-3 text-xs">{r.plan}</td>
                  <td className="p-3 text-xs">{new Date(r.created_at).toLocaleDateString("pt-BR")}</td>
                  <td className="p-3 text-xs">{r.last_seen_at ? new Date(r.last_seen_at).toLocaleDateString("pt-BR") : "-"}</td>
                  <td className="p-3 font-mono">{r.score}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 text-[11px] uppercase px-2 py-1 rounded border ${tempColor[r.temperature]}`}>
                      <Icon size={12} /> {r.temperature}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
