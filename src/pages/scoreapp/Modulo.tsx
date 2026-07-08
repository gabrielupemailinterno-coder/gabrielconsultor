import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ScoreLayout from "@/components/scoreapp/ScoreLayout";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import type { ContentModule } from "@/lib/scoreapp/types";
import { toast } from "sonner";

export default function ScoreModulo() {
  const { slug } = useParams();
  const [m, setM] = useState<ContentModule | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("score_content_modules").select("*").eq("slug", slug).maybeSingle();
      setM((data as any) || null);
      const { data: sess } = await supabase.auth.getSession();
      if (sess.session && data) {
        setUid(sess.session.user.id);
        const { data: p } = await supabase.from("score_content_progress").select("id").eq("user_id", sess.session.user.id).eq("module_id", (data as any).id).maybeSingle();
        setDone(!!p);
      }
    })();
  }, [slug]);

  const marcar = async () => {
    if (!uid || !m) return;
    await supabase.from("score_content_progress").upsert({ user_id: uid, module_id: m.id }, { onConflict: "user_id,module_id" });
    setDone(true); toast.success("Módulo concluído!");
  };

  if (!m) return <ScoreLayout><p className="text-muted-foreground">Carregando…</p></ScoreLayout>;

  return (
    <ScoreLayout>
      <Link to="/app/score/conteudos" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-4"><ArrowLeft size={14} /> Voltar</Link>
      <div className="bg-card border border-border rounded-lg p-6">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{m.categoria}</p>
        <h1 className="font-serif text-3xl mt-1">{m.titulo}</h1>
        <p className="text-muted-foreground mt-2">{m.descricao}</p>
        {m.video_url ? (
          <div className="mt-6 aspect-video">
            <iframe src={m.video_url} className="w-full h-full rounded-md" allowFullScreen title={m.titulo} />
          </div>
        ) : (
          <div className="mt-6 bg-muted/30 border border-dashed border-border rounded-md p-8 text-center text-sm text-muted-foreground">
            Aula em breve.
          </div>
        )}
        {m.material_url && (
          <a href={m.material_url} target="_blank" rel="noreferrer" className="inline-block mt-4 text-sm text-primary">Material complementar →</a>
        )}
        <button onClick={marcar} disabled={done} className={`mt-6 w-full py-3 rounded-md text-sm uppercase tracking-wide flex items-center justify-center gap-2 ${done ? "bg-primary/20 text-primary" : "bg-primary text-primary-foreground"}`}>
          {done ? <><CheckCircle2 size={16} /> Concluído</> : "Marcar como concluído"}
        </button>
      </div>
    </ScoreLayout>
  );
}
