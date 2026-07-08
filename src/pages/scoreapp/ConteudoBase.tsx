import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ScoreLayout from "@/components/scoreapp/ScoreLayout";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import type { ScoreContent } from "@/lib/scoreapp/types";
import { toast } from "sonner";

export default function ConteudoBase() {
  const { slug } = useParams();
  const [c, setC] = useState<ScoreContent | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("score_contents").select("*").eq("slug", slug).maybeSingle();
      setC((data as any) || null);
      const { data: sess } = await supabase.auth.getSession();
      if (sess.session && data) {
        setUid(sess.session.user.id);
        // register view
        await supabase.from("score_content_views").upsert(
          { user_id: sess.session.user.id, content_id: (data as any).id },
          { onConflict: "user_id,content_id" }
        );
        const { data: v } = await supabase
          .from("score_content_views")
          .select("completed_at")
          .eq("user_id", sess.session.user.id)
          .eq("content_id", (data as any).id)
          .maybeSingle();
        setDone(!!(v as any)?.completed_at);
      }
    })();
  }, [slug]);

  const marcar = async () => {
    if (!uid || !c) return;
    await supabase.from("score_content_views").upsert(
      { user_id: uid, content_id: c.id, completed_at: new Date().toISOString() },
      { onConflict: "user_id,content_id" }
    );
    setDone(true);
    toast.success("Conteúdo concluído!");
  };

  if (!c) return <ScoreLayout><p className="text-muted-foreground">Carregando…</p></ScoreLayout>;

  return (
    <ScoreLayout>
      <Link to="/app/score/conteudos" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-4"><ArrowLeft size={14} /> Voltar</Link>
      <article className="bg-card border border-border rounded-lg p-6 md:p-8">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{c.category}</p>
        <h1 className="font-serif text-3xl mt-1">{c.title}</h1>
        {c.short_description && <p className="text-muted-foreground mt-2">{c.short_description}</p>}
        {c.video_url && (
          <div className="mt-6 aspect-video">
            <iframe src={c.video_url} className="w-full h-full rounded-md" allowFullScreen title={c.title} />
          </div>
        )}
        <div className="prose prose-invert prose-sm md:prose-base max-w-none mt-6 whitespace-pre-wrap font-sans text-foreground/90 leading-relaxed">
          {c.body}
        </div>
        <button onClick={marcar} disabled={done}
          className={`mt-8 w-full py-3 rounded-md text-sm uppercase tracking-wide flex items-center justify-center gap-2 ${done ? "bg-primary/20 text-primary" : "bg-primary text-primary-foreground"}`}>
          {done ? <><CheckCircle2 size={16} /> Concluído</> : "Marcar como concluído"}
        </button>
      </article>
    </ScoreLayout>
  );
}
