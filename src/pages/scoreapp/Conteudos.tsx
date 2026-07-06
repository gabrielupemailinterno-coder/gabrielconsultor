import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ScoreLayout from "@/components/scoreapp/ScoreLayout";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, PlayCircle } from "lucide-react";
import type { ContentModule } from "@/lib/scoreapp/types";

export default function ScoreConteudos() {
  const [mods, setMods] = useState<ContentModule[]>([]);
  const [done, setDone] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("score_content_modules").select("*").eq("published", true).order("sort_order");
      setMods((data as any) || []);
      const { data: sess } = await supabase.auth.getSession();
      if (sess.session) {
        const { data: prog } = await supabase.from("score_content_progress").select("module_id").eq("user_id", sess.session.user.id);
        setDone(new Set((prog || []).map((p: any) => p.module_id)));
      }
    })();
  }, []);

  const grouped = mods.reduce((acc, m) => {
    (acc[m.categoria] ||= []).push(m); return acc;
  }, {} as Record<string, ContentModule[]>);

  return (
    <ScoreLayout>
      <h1 className="font-serif text-3xl mb-6">Conteúdos</h1>
      <div className="space-y-8">
        {Object.entries(grouped).map(([cat, list]) => (
          <div key={cat}>
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">{cat}</h2>
            <div className="grid md:grid-cols-2 gap-3">
              {list.map((m) => (
                <Link key={m.id} to={`/scoreapp/app/conteudos/${m.slug}`}
                  className="bg-card border border-border rounded-lg p-4 hover:border-primary/40 transition flex items-start gap-3">
                  {done.has(m.id) ? <CheckCircle2 className="text-primary shrink-0 mt-0.5" size={20} /> : <PlayCircle className="text-muted-foreground shrink-0 mt-0.5" size={20} />}
                  <div>
                    <div className="font-serif">{m.titulo}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{m.descricao}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ScoreLayout>
  );
}
