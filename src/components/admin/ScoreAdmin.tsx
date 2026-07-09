import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { computeScore, computeTemperature } from "@/lib/scoreapp/calc";
import type { DailyLog, ScoreGoals, ScoreProfile } from "@/lib/scoreapp/types";
import { Flame, Snowflake, Zap, Users, Pencil, Power, PowerOff, Eye } from "lucide-react";
import { toast } from "sonner";
import { useImpersonation } from "@/hooks/useImpersonation";

type Row = ScoreProfile & {
  goals: ScoreGoals | null;
  logs: DailyLog[];
  score: number;
  temperature: string;
  is_active: boolean;
};

const tempColor: Record<string, string> = {
  quente: "bg-primary/20 text-primary border-primary/40",
  engajado: "bg-accent/20 text-accent border-accent/40",
  ativacao: "bg-secondary text-foreground border-border",
  frio: "bg-muted text-muted-foreground border-border",
};
const tempIcon: Record<string, any> = { quente: Flame, engajado: Zap, ativacao: Users, frio: Snowflake };

const EDITABLE_FIELDS: { key: keyof ScoreProfile; label: string; type?: string }[] = [
  { key: "full_name", label: "Nome" },
  { key: "email", label: "E-mail", type: "email" },
  { key: "phone", label: "WhatsApp" },
  { key: "segment", label: "Segmento" },
  { key: "profession", label: "Profissão" },
  { key: "experience_level", label: "Experiência" },
  { key: "lead_origin", label: "Origem" },
  { key: "plan", label: "Plano" },
];

export default function ScoreAdmin() {
  const navigate = useNavigate();
  const { setImpersonation } = useImpersonation();
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [showInactive, setShowInactive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState<Partial<ScoreProfile>>({});
  const [saving, setSaving] = useState(false);

  const inspect = (r: Row) => {
    if (!r.user_id) {
      toast.error("Perfil sem usuário vinculado.");
      return;
    }
    setImpersonation({ kind: "score", userId: r.user_id, name: r.full_name || r.email || "Usuário Score", email: r.email });
    navigate("/app/score");
  };

  async function load() {
    setLoading(true);
    const [{ data: profiles }, { data: goals }, { data: logs }] = await Promise.all([
      supabase.from("score_profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("score_goals").select("*"),
      supabase.from("score_daily_logs").select("*"),
    ]);
    const goalsBy = new Map<string, ScoreGoals>();
    (goals || []).forEach((g: any) => {
      const prev = goalsBy.get(g.user_id);
      if (!prev || new Date(g.effective_from) > new Date(prev.effective_from)) goalsBy.set(g.user_id, g);
    });
    const logsBy = new Map<string, DailyLog[]>();
    (logs || []).forEach((l: any) => {
      const arr = logsBy.get(l.user_id) || [];
      arr.push(l);
      logsBy.set(l.user_id, arr);
    });
    const built = (profiles || []).map((p: any) => {
      const g = goalsBy.get(p.user_id) || null;
      const l = logsBy.get(p.user_id) || [];
      const { score } = computeScore(l, g);
      const t = computeTemperature(l, g, !!p.phone && !!p.email);
      return { ...p, goals: g, logs: l, score, temperature: t } as Row;
    });
    setRows(built);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const activeUsers = rows.filter((r) => r.is_active !== false);
    const now = Date.now();
    const active = activeUsers.filter((r) => r.logs.some((l) => now - new Date(l.date).getTime() < 7 * 864e5)).length;
    return {
      total: activeUsers.length,
      active,
      inactive: activeUsers.length - active,
      quente: activeUsers.filter((r) => r.temperature === "quente").length,
      disabled: rows.length - activeUsers.length,
    };
  }, [rows]);

  const filtered = rows.filter((r) => {
    if (!showInactive && r.is_active === false) return false;
    if (showInactive && r.is_active !== false) return false;
    if (filter !== "all" && r.temperature !== filter) return false;
    return true;
  });

  async function toggleActive(row: Row) {
    const next = !(row.is_active !== false);
    const { error } = await supabase.from("score_profiles").update({ is_active: next }).eq("id", row.id);
    if (error) return toast.error("Falha ao atualizar: " + error.message);
    toast.success(next ? "Usuário reativado" : "Usuário inativado");
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, is_active: next } : r)));
  }

  function openEdit(row: Row) {
    setEditing(row);
    const initial: Partial<ScoreProfile> = {};
    for (const f of EDITABLE_FIELDS) (initial as any)[f.key] = (row as any)[f.key] ?? "";
    setForm(initial);
  }

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    const payload: any = {};
    for (const f of EDITABLE_FIELDS) payload[f.key] = (form as any)[f.key] || null;
    const { error } = await supabase.from("score_profiles").update(payload).eq("id", editing.id);
    setSaving(false);
    if (error) return toast.error("Falha ao salvar: " + error.message);
    toast.success("Perfil atualizado");
    setRows((prev) => prev.map((r) => (r.id === editing.id ? { ...r, ...payload } : r)));
    setEditing(null);
  }

  if (loading) return <p className="text-muted-foreground text-sm">Carregando…</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          ["Usuários", stats.total],
          ["Ativos 7d", stats.active],
          ["Inativos", stats.inactive],
          ["Leads quentes", stats.quente],
        ].map(([l, v]) => (
          <div key={l as string} className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{l}</div>
            <div className="font-serif text-2xl mt-1">{v}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {["all", "quente", "engajado", "ativacao", "frio"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs border ${
              filter === f ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"
            }`}
          >
            {f === "all" ? "Todos" : f}
          </button>
        ))}
        <div className="ml-auto">
          <button
            onClick={() => setShowInactive((s) => !s)}
            className={`px-3 py-1.5 rounded-full text-xs border ${
              showInactive
                ? "bg-destructive/20 text-destructive border-destructive/40"
                : "border-border text-muted-foreground"
            }`}
          >
            {showInactive ? `Vendo inativos (${stats.disabled})` : `Ver inativos (${stats.disabled})`}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border border-border rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-secondary/30 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left p-3">Nome</th>
              <th className="text-left p-3">Contato</th>
              <th className="text-left p-3">Segmento</th>
              <th className="text-left p-3">Origem</th>
              <th className="text-left p-3">Plano</th>
              <th className="text-left p-3">Cadastro</th>
              <th className="text-left p-3">Último</th>
              <th className="text-left p-3">Score</th>
              <th className="text-left p-3">Status</th>
              <th className="text-right p-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const Icon = tempIcon[r.temperature];
              const active = r.is_active !== false;
              return (
                <tr key={r.id} className={`border-t border-border ${!active ? "opacity-50" : ""}`}>
                  <td className="p-3">{r.full_name}</td>
                  <td className="p-3 text-xs">
                    {r.email}
                    <br />
                    <span className="text-muted-foreground">{r.phone}</span>
                  </td>
                  <td className="p-3 text-xs">{r.segment || r.goals?.segmento || "-"}</td>
                  <td className="p-3 text-xs">{r.lead_origin || "-"}</td>
                  <td className="p-3 text-xs">{r.plan}</td>
                  <td className="p-3 text-xs">{new Date(r.created_at).toLocaleDateString("pt-BR")}</td>
                  <td className="p-3 text-xs">
                    {r.last_seen_at ? new Date(r.last_seen_at).toLocaleDateString("pt-BR") : "-"}
                  </td>
                  <td className="p-3 font-mono">{r.score}</td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] uppercase px-2 py-1 rounded border ${tempColor[r.temperature]}`}
                    >
                      <Icon size={12} /> {r.temperature}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(r)}
                        title="Editar"
                        className="p-1.5 rounded border border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => {
                          if (
                            confirm(active ? `Inativar ${r.full_name}?` : `Reativar ${r.full_name}?`)
                          )
                            toggleActive(r);
                        }}
                        title={active ? "Inativar" : "Reativar"}
                        className={`p-1.5 rounded border ${
                          active
                            ? "border-destructive/40 text-destructive hover:bg-destructive/10"
                            : "border-primary/40 text-primary hover:bg-primary/10"
                        }`}
                      >
                        {active ? <PowerOff size={14} /> : <Power size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="p-6 text-center text-muted-foreground text-xs">
                  Nenhum usuário nesta visualização.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => !saving && setEditing(null)}
        >
          <div
            className="bg-card border border-border rounded-lg p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="font-serif text-lg">Editar usuário</h3>
              <p className="text-xs text-muted-foreground mt-1">{editing.email}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {EDITABLE_FIELDS.map((f) => (
                <label key={f.key as string} className="text-xs space-y-1">
                  <span className="text-muted-foreground">{f.label}</span>
                  <input
                    type={f.type || "text"}
                    value={((form as any)[f.key] ?? "") as string}
                    onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm"
                  />
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditing(null)}
                disabled={saving}
                className="px-3 py-1.5 text-xs rounded border border-border text-muted-foreground"
              >
                Cancelar
              </button>
              <button
                onClick={saveEdit}
                disabled={saving}
                className="px-3 py-1.5 text-xs rounded bg-primary text-primary-foreground"
              >
                {saving ? "Salvando…" : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
