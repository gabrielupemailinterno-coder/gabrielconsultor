import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ScoreLayout from "@/components/scoreapp/ScoreLayout";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, PlayCircle, Sparkles, BookOpen, TrendingUp } from "lucide-react";
import type { ScoreContent, SmartFeedback } from "@/lib/scoreapp/types";
import { useScoreData } from "@/hooks/useScoreData";
import { evaluateTriggers } from "@/lib/scoreapp/recommendations";

export default function ScoreConteudos() {
  const [tab, setTab] = useState<"base" | "feedbacks">("base");
  const [contents, setContents] = useState<ScoreContent[]>([]);
  const [feedbacks, setFeedbacks] = useState<SmartFeedback[]>([]);
  const [viewed, setViewed] = useState<Set<string>>(new Set());
  const [interacted, setInteracted] = useState<Set<string>>(new Set());
  const { logs, goals, loading } = useScoreData();

  useEffect(() => {
    (async () => {
      const [{ data: c }, { data: f }] = await Promise.all([
        supabase.from("score_contents").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("score_smart_feedbacks").select("*").eq("is_active", true).order("priority"),
      ]);
      setContents((c as any) || []);
      setFeedbacks((f as any) || []);
      const { data: sess } = await supabase.auth.getSession();
      if (sess.session) {
        const uid = sess.session.user.id;
        const [{ data: vs }, { data: fs }] = await Promise.all([
          supabase.from("score_content_views").select("content_id").eq("user_id", uid),
          supabase.from("score_feedback_interactions").select("feedback_id").eq("user_id", uid).not("viewed_at", "is", null),
        ]);
        setViewed(new Set((vs || []).map((x: any) => x.content_id)));
        setInteracted(new Set((fs || []).map((x: any) => x.feedback_id)));
      }
    })();
  }, []);

  const hits = useMemo(() => evaluateTriggers(logs, goals), [logs, goals]);
  const applicable = useMemo(() => {
    const byKey = new Map(feedbacks.map((f) => [f.trigger_key, f]));
    return hits
      .map((h) => ({ hit: h, feedback: byKey.get(h.key) }))
      .filter((x) => !!x.feedback) as { hit: (typeof hits)[number]; feedback: SmartFeedback }[];
  }, [feedbacks, hits]);
  const top = applicable[0];
  const others = applicable.slice(1);

  const grouped = contents.reduce((acc, m) => {
    (acc[m.category] ||= []).push(m); return acc;
  }, {} as Record<string, ScoreContent[]>);

  return (
    <ScoreLayout>
      <h1 className="font-serif text-3xl mb-2">Conteúdos</h1>
      <p className="text-sm text-muted-foreground mb-6">Conteúdo base + feedbacks inteligentes personalizados pelos seus indicadores.</p>

      <div className="flex gap-2 border-b border-border mb-6">
        {[
          { id: "base", label: "Conteúdo Base", icon: BookOpen },
          { id: "feedbacks", label: "Feedbacks Inteligentes", icon: Sparkles },
        ].map((t) => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition ${active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              <t.icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "base" && (
        <div className="space-y-8">
          {Object.entries(grouped).map(([cat, list]) => (
            <div key={cat}>
              <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">{cat}</h2>
              <div className="grid md:grid-cols-2 gap-3">
                {list.map((m) => (
                  <Link key={m.id} to={`/scoreapp/app/conteudos/base/${m.slug}`}
                    className="bg-card border border-border rounded-lg p-4 hover:border-primary/40 transition flex items-start gap-3">
                    {viewed.has(m.id) ? <CheckCircle2 className="text-primary shrink-0 mt-0.5" size={20} /> : <PlayCircle className="text-muted-foreground shrink-0 mt-0.5" size={20} />}
                    <div>
                      <div className="font-serif">{m.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{m.short_description}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
          {contents.length === 0 && <p className="text-sm text-muted-foreground">Nenhum conteúdo publicado ainda.</p>}
        </div>
      )}

      {tab === "feedbacks" && (
        <div className="space-y-4">
          {loading && <p className="text-sm text-muted-foreground">Analisando seus indicadores…</p>}

          {!loading && applicable.length === 0 && (
            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <TrendingUp className="mx-auto text-primary mb-2" size={28} />
              <p className="font-serif text-lg">Seus indicadores estão saudáveis.</p>
              <p className="text-sm text-muted-foreground mt-1">Nenhum gargalo crítico identificado no momento. Continue registrando suas atividades para receber recomendações ao longo do tempo.</p>
              <Link to="/scoreapp/app/registrar" className="inline-block mt-4 bg-primary text-primary-foreground text-xs uppercase tracking-wide px-4 py-2 rounded-md">
                Registrar dia
              </Link>
            </div>
          )}

          {top && (
            <div className="bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/40 rounded-lg p-6">
              <p className="text-[10px] uppercase tracking-wider text-primary mb-2 flex items-center gap-1">
                <Sparkles size={12} /> Recomendação principal para você
              </p>
              <div className="font-serif text-xl">{top.feedback.title}</div>
              <p className="text-sm text-foreground/80 mt-2">{top.hit.reason}</p>
              {top.feedback.short_description && (
                <p className="text-sm text-muted-foreground mt-1">{top.feedback.short_description}</p>
              )}
              <Link to={`/scoreapp/app/conteudos/feedback/${top.feedback.trigger_key}`}
                className="inline-block mt-4 bg-primary text-primary-foreground text-xs uppercase tracking-wide px-4 py-2.5 rounded-md">
                Ver recomendação
              </Link>
            </div>
          )}

          {others.length > 0 && (
            <>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mt-6 mb-2">Outros pontos de atenção</p>
              <div className="grid md:grid-cols-2 gap-3">
                {others.map(({ hit, feedback }) => (
                  <Link key={feedback.id} to={`/scoreapp/app/conteudos/feedback/${feedback.trigger_key}`}
                    className="bg-card border border-border rounded-lg p-4 hover:border-primary/40 transition flex items-start gap-3">
                    {interacted.has(feedback.id) ? <CheckCircle2 className="text-primary shrink-0 mt-0.5" size={20} /> : <Sparkles className="text-muted-foreground shrink-0 mt-0.5" size={20} />}
                    <div>
                      <div className="font-serif">{feedback.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{hit.reason}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </ScoreLayout>
  );
}
