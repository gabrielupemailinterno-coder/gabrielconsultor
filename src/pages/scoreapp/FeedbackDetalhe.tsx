import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ScoreLayout from "@/components/scoreapp/ScoreLayout";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, CheckCircle2, Sparkles, Target, MessageCircle } from "lucide-react";
import type { SmartFeedback } from "@/lib/scoreapp/types";
import { toast } from "sonner";

const WHATSAPP_NUMBER = "5532920005961";

export default function FeedbackDetalhe() {
  const { trigger } = useParams();
  const [f, setF] = useState<SmartFeedback | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [viewed, setViewed] = useState(false);
  const [missionApplied, setMissionApplied] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("score_smart_feedbacks").select("*").eq("trigger_key", trigger).maybeSingle();
      setF((data as any) || null);
      const { data: sess } = await supabase.auth.getSession();
      if (sess.session && data) {
        const u = sess.session.user.id;
        setUid(u);
        await supabase.from("score_feedback_interactions").upsert(
          { user_id: u, feedback_id: (data as any).id, viewed_at: new Date().toISOString() },
          { onConflict: "user_id,feedback_id" }
        );
        const { data: prev } = await supabase
          .from("score_feedback_interactions")
          .select("viewed_at, mission_applied_at")
          .eq("user_id", u)
          .eq("feedback_id", (data as any).id)
          .maybeSingle();
        setViewed(!!(prev as any)?.viewed_at);
        setMissionApplied(!!(prev as any)?.mission_applied_at);
      }
    })();
  }, [trigger]);

  const marcarVisto = async () => {
    if (!uid || !f) return;
    await supabase.from("score_feedback_interactions").upsert(
      { user_id: uid, feedback_id: f.id, viewed_at: new Date().toISOString() },
      { onConflict: "user_id,feedback_id" }
    );
    setViewed(true);
    toast.success("Marcado como visto.");
  };

  const aplicarMissao = async () => {
    if (!uid || !f) return;
    await supabase.from("score_feedback_interactions").upsert(
      { user_id: uid, feedback_id: f.id, mission_applied_at: new Date().toISOString() },
      { onConflict: "user_id,feedback_id" }
    );
    setMissionApplied(true);
    toast.success("Missão aplicada! Agora é executar.");
  };

  const solicitarAnalise = async () => {
    if (!uid || !f) return;
    await supabase.from("score_feedback_interactions").upsert(
      { user_id: uid, feedback_id: f.id, clicked_cta_at: new Date().toISOString() },
      { onConflict: "user_id,feedback_id" }
    );
    await supabase.from("score_upsell_requests").insert({
      user_id: uid,
      source: `feedback:${f.trigger_key}`,
    });
    const msg = `Olá Gabriel, sou usuário do Score Comercial e quero uma análise individual do meu funil.`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  if (!f) return <ScoreLayout><p className="text-muted-foreground">Carregando…</p></ScoreLayout>;

  const isConvite = f.trigger_key === "convite_diagnostico";

  return (
    <ScoreLayout>
      <Link to="/scoreapp/app/conteudos" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-4"><ArrowLeft size={14} /> Voltar</Link>
      <article className="bg-card border border-border rounded-lg p-6 md:p-8">
        <p className="text-xs uppercase tracking-wider text-primary flex items-center gap-1"><Sparkles size={12} /> Feedback Inteligente</p>
        <h1 className="font-serif text-3xl mt-1">{f.title}</h1>
        {f.short_description && <p className="text-muted-foreground mt-2">{f.short_description}</p>}
        {f.video_url && (
          <div className="mt-6 aspect-video">
            <iframe src={f.video_url} className="w-full h-full rounded-md" allowFullScreen title={f.title} />
          </div>
        )}
        <div className="prose prose-invert prose-sm md:prose-base max-w-none mt-6 whitespace-pre-wrap font-sans text-foreground/90 leading-relaxed">
          {f.body}
        </div>

        {f.mission && (
          <div className="mt-8 border border-primary/30 bg-primary/5 rounded-lg p-5">
            <p className="text-xs uppercase tracking-wider text-primary flex items-center gap-1"><Target size={12} /> Missão da semana</p>
            <p className="mt-2 text-foreground">{f.mission}</p>
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button onClick={marcarVisto} disabled={viewed}
            className={`flex-1 py-3 rounded-md text-sm uppercase tracking-wide border flex items-center justify-center gap-2 ${viewed ? "border-primary/40 bg-primary/10 text-primary" : "border-border hover:bg-secondary"}`}>
            {viewed ? <><CheckCircle2 size={16} /> Visto</> : "Marcar como visto"}
          </button>
          <button onClick={aplicarMissao} disabled={missionApplied}
            className={`flex-1 py-3 rounded-md text-sm uppercase tracking-wide flex items-center justify-center gap-2 ${missionApplied ? "bg-primary/20 text-primary" : "bg-primary text-primary-foreground"}`}>
            {missionApplied ? <><CheckCircle2 size={16} /> Missão aplicada</> : "Aplicar missão"}
          </button>
        </div>

        {isConvite && (
          <button onClick={solicitarAnalise}
            className="mt-4 w-full py-3 rounded-md text-sm uppercase tracking-wide bg-[#25D366] text-white flex items-center justify-center gap-2">
            <MessageCircle size={16} /> Quero uma análise individual
          </button>
        )}
      </article>
    </ScoreLayout>
  );
}
