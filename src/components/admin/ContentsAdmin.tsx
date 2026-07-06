import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ScoreContent, SmartFeedback } from "@/lib/scoreapp/types";
import { Loader2, Save, Eye, MessageSquare, Sparkles } from "lucide-react";
import { toast } from "sonner";

type UpsellRow = {
  id: string;
  user_id: string;
  source: string;
  status: string;
  notes: string | null;
  created_at: string;
};

type FeedbackStats = { feedback_id: string; viewed: number; missions: number; ctas: number };
type ContentStats = { content_id: string; views: number; completed: number };

export default function ContentsAdmin() {
  const [tab, setTab] = useState<"base" | "feedbacks" | "upsell">("base");
  const [loading, setLoading] = useState(true);
  const [contents, setContents] = useState<ScoreContent[]>([]);
  const [feedbacks, setFeedbacks] = useState<SmartFeedback[]>([]);
  const [upsells, setUpsells] = useState<UpsellRow[]>([]);
  const [fbStats, setFbStats] = useState<Record<string, FeedbackStats>>({});
  const [ctStats, setCtStats] = useState<Record<string, ContentStats>>({});
  const [profiles, setProfiles] = useState<Record<string, { full_name: string; email: string; phone: string | null }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: c }, { data: f }, { data: u }, { data: fi }, { data: cv }, { data: pf }] = await Promise.all([
      supabase.from("score_contents").select("*").order("sort_order"),
      supabase.from("score_smart_feedbacks").select("*").order("priority"),
      supabase.from("score_upsell_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("score_feedback_interactions").select("feedback_id, viewed_at, mission_applied_at, clicked_cta_at"),
      supabase.from("score_content_views").select("content_id, completed_at"),
      supabase.from("score_profiles").select("user_id, full_name, email, phone"),
    ]);
    setContents((c as any) || []);
    setFeedbacks((f as any) || []);
    setUpsells((u as any) || []);
    const fbAcc: Record<string, FeedbackStats> = {};
    (fi || []).forEach((x: any) => {
      fbAcc[x.feedback_id] ||= { feedback_id: x.feedback_id, viewed: 0, missions: 0, ctas: 0 };
      if (x.viewed_at) fbAcc[x.feedback_id].viewed++;
      if (x.mission_applied_at) fbAcc[x.feedback_id].missions++;
      if (x.clicked_cta_at) fbAcc[x.feedback_id].ctas++;
    });
    setFbStats(fbAcc);
    const ctAcc: Record<string, ContentStats> = {};
    (cv || []).forEach((x: any) => {
      ctAcc[x.content_id] ||= { content_id: x.content_id, views: 0, completed: 0 };
      ctAcc[x.content_id].views++;
      if (x.completed_at) ctAcc[x.content_id].completed++;
    });
    setCtStats(ctAcc);
    const pmap: any = {};
    (pf || []).forEach((p: any) => { pmap[p.user_id] = p; });
    setProfiles(pmap);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const saveContent = async (row: ScoreContent) => {
    setSavingId(row.id);
    const { error } = await supabase.from("score_contents").update({
      title: row.title, category: row.category, slug: row.slug,
      short_description: row.short_description, body: row.body,
      video_url: row.video_url || null, sort_order: row.sort_order, is_active: row.is_active,
    }).eq("id", row.id);
    setSavingId(null);
    if (error) toast.error(error.message); else toast.success("Conteúdo salvo.");
  };

  const saveFeedback = async (row: SmartFeedback) => {
    setSavingId(row.id);
    const { error } = await supabase.from("score_smart_feedbacks").update({
      title: row.title, short_description: row.short_description,
      body: row.body, mission: row.mission,
      video_url: row.video_url || null, priority: row.priority, is_active: row.is_active,
    }).eq("id", row.id);
    setSavingId(null);
    if (error) toast.error(error.message); else toast.success("Feedback salvo.");
  };

  const updateUpsell = async (id: string, status: string) => {
    await supabase.from("score_upsell_requests").update({ status }).eq("id", id);
    setUpsells((prev) => prev.map((u) => u.id === id ? { ...u, status } : u));
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-border">
        {[
          { id: "base", label: `Conteúdo Base (${contents.length})` },
          { id: "feedbacks", label: `Feedbacks Inteligentes (${feedbacks.length})` },
          { id: "upsell", label: `Pedidos de análise (${upsells.length})` },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`px-4 py-2.5 text-sm border-b-2 transition ${tab === t.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "base" && (
        <div className="space-y-4">
          {contents.map((c) => {
            const s = ctStats[c.id];
            return (
              <div key={c.id} className="bg-card border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <input value={c.title} onChange={(e) => setContents((prev) => prev.map((x) => x.id === c.id ? { ...x, title: e.target.value } : x))}
                    className="flex-1 bg-transparent font-serif text-lg border-b border-transparent focus:border-primary outline-none" />
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <input type="checkbox" checked={c.is_active}
                      onChange={(e) => setContents((prev) => prev.map((x) => x.id === c.id ? { ...x, is_active: e.target.checked } : x))} />
                    Ativo
                  </label>
                </div>
                <div className="grid md:grid-cols-3 gap-2 text-xs">
                  <div><label className="text-muted-foreground">Categoria</label>
                    <input value={c.category} onChange={(e) => setContents((prev) => prev.map((x) => x.id === c.id ? { ...x, category: e.target.value } : x))}
                      className="w-full bg-background border border-border rounded px-2 py-1 mt-0.5" /></div>
                  <div><label className="text-muted-foreground">Slug</label>
                    <input value={c.slug} onChange={(e) => setContents((prev) => prev.map((x) => x.id === c.id ? { ...x, slug: e.target.value } : x))}
                      className="w-full bg-background border border-border rounded px-2 py-1 mt-0.5" /></div>
                  <div><label className="text-muted-foreground">Ordem</label>
                    <input type="number" value={c.sort_order} onChange={(e) => setContents((prev) => prev.map((x) => x.id === c.id ? { ...x, sort_order: Number(e.target.value) } : x))}
                      className="w-full bg-background border border-border rounded px-2 py-1 mt-0.5" /></div>
                </div>
                <div><label className="text-xs text-muted-foreground">Descrição curta</label>
                  <input value={c.short_description || ""} onChange={(e) => setContents((prev) => prev.map((x) => x.id === c.id ? { ...x, short_description: e.target.value } : x))}
                    className="w-full bg-background border border-border rounded px-2 py-1.5 mt-0.5 text-sm" /></div>
                <div><label className="text-xs text-muted-foreground">Vídeo (URL de embed opcional)</label>
                  <input value={c.video_url || ""} onChange={(e) => setContents((prev) => prev.map((x) => x.id === c.id ? { ...x, video_url: e.target.value } : x))}
                    placeholder="https://..." className="w-full bg-background border border-border rounded px-2 py-1.5 mt-0.5 text-sm" /></div>
                <div><label className="text-xs text-muted-foreground">Texto do conteúdo</label>
                  <textarea value={c.body} rows={8} onChange={(e) => setContents((prev) => prev.map((x) => x.id === c.id ? { ...x, body: e.target.value } : x))}
                    className="w-full bg-background border border-border rounded px-2 py-2 mt-0.5 text-sm font-mono" /></div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground flex gap-4">
                    <span className="flex items-center gap-1"><Eye size={12} /> {s?.views || 0} visualizações</span>
                    <span>✓ {s?.completed || 0} concluídos</span>
                  </div>
                  <button onClick={() => saveContent(c)} disabled={savingId === c.id}
                    className="bg-primary text-primary-foreground text-xs uppercase tracking-wide px-4 py-2 rounded flex items-center gap-2">
                    {savingId === c.id ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Salvar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "feedbacks" && (
        <div className="space-y-4">
          {feedbacks.map((f) => {
            const s = fbStats[f.id];
            return (
              <div key={f.id} className="bg-card border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <span className="text-[10px] uppercase tracking-wider text-primary flex items-center gap-1"><Sparkles size={10} /> {f.trigger_key}</span>
                    <input value={f.title} onChange={(e) => setFeedbacks((prev) => prev.map((x) => x.id === f.id ? { ...x, title: e.target.value } : x))}
                      className="w-full bg-transparent font-serif text-lg border-b border-transparent focus:border-primary outline-none mt-1" />
                  </div>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <input type="checkbox" checked={f.is_active}
                      onChange={(e) => setFeedbacks((prev) => prev.map((x) => x.id === f.id ? { ...x, is_active: e.target.checked } : x))} />
                    Ativo
                  </label>
                </div>
                <div><label className="text-xs text-muted-foreground">Descrição curta</label>
                  <input value={f.short_description || ""} onChange={(e) => setFeedbacks((prev) => prev.map((x) => x.id === f.id ? { ...x, short_description: e.target.value } : x))}
                    className="w-full bg-background border border-border rounded px-2 py-1.5 mt-0.5 text-sm" /></div>
                <div><label className="text-xs text-muted-foreground">Vídeo (URL opcional)</label>
                  <input value={f.video_url || ""} onChange={(e) => setFeedbacks((prev) => prev.map((x) => x.id === f.id ? { ...x, video_url: e.target.value } : x))}
                    className="w-full bg-background border border-border rounded px-2 py-1.5 mt-0.5 text-sm" /></div>
                <div><label className="text-xs text-muted-foreground">Texto do feedback</label>
                  <textarea value={f.body} rows={6} onChange={(e) => setFeedbacks((prev) => prev.map((x) => x.id === f.id ? { ...x, body: e.target.value } : x))}
                    className="w-full bg-background border border-border rounded px-2 py-2 mt-0.5 text-sm font-mono" /></div>
                <div><label className="text-xs text-muted-foreground">Missão prática</label>
                  <textarea value={f.mission} rows={2} onChange={(e) => setFeedbacks((prev) => prev.map((x) => x.id === f.id ? { ...x, mission: e.target.value } : x))}
                    className="w-full bg-background border border-border rounded px-2 py-2 mt-0.5 text-sm" /></div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground flex gap-4">
                    <span className="flex items-center gap-1"><Eye size={12} /> {s?.viewed || 0}</span>
                    <span>🎯 {s?.missions || 0} missões</span>
                    <span>👉 {s?.ctas || 0} CTA</span>
                  </div>
                  <button onClick={() => saveFeedback(f)} disabled={savingId === f.id}
                    className="bg-primary text-primary-foreground text-xs uppercase tracking-wide px-4 py-2 rounded flex items-center gap-2">
                    {savingId === f.id ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Salvar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "upsell" && (
        <div className="space-y-3">
          {upsells.length === 0 && <p className="text-sm text-muted-foreground">Nenhum pedido de análise ainda.</p>}
          {upsells.map((u) => {
            const p = profiles[u.user_id];
            return (
              <div key={u.id} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-serif">{p?.full_name || u.user_id.slice(0, 8)}</div>
                    <div className="text-xs text-muted-foreground">{p?.email} • {p?.phone || "sem telefone"}</div>
                    <div className="text-xs text-muted-foreground mt-1">Origem: <span className="font-mono">{u.source}</span> • {new Date(u.created_at).toLocaleString("pt-BR")}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select value={u.status} onChange={(e) => updateUpsell(u.id, e.target.value)}
                      className="bg-background border border-border rounded px-2 py-1 text-xs">
                      <option value="pending">Pendente</option>
                      <option value="contacted">Contatado</option>
                      <option value="scheduled">Agendado</option>
                      <option value="done">Concluído</option>
                      <option value="dropped">Descartado</option>
                    </select>
                    {p?.phone && (
                      <a href={`https://wa.me/${p.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                        className="text-xs text-primary flex items-center gap-1"><MessageSquare size={12} /> WhatsApp</a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
