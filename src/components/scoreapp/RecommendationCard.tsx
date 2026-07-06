import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Target, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { SmartFeedback } from "@/lib/scoreapp/types";
import type { TriggerKey } from "@/lib/scoreapp/recommendations";

export default function RecommendationCard({ triggerKey }: { triggerKey: TriggerKey | null }) {
  const [f, setF] = useState<SmartFeedback | null>(null);

  useEffect(() => {
    if (!triggerKey) { setF(null); return; }
    (async () => {
      const { data } = await supabase
        .from("score_smart_feedbacks")
        .select("*")
        .eq("trigger_key", triggerKey)
        .eq("is_active", true)
        .maybeSingle();
      setF((data as any) || null);
    })();
  }, [triggerKey]);

  if (!f) return null;

  return (
    <div className="bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/30 rounded-lg p-6 mb-6">
      <p className="text-[10px] uppercase tracking-wider text-primary flex items-center gap-1 mb-2">
        <Sparkles size={12} /> Recomendação da semana
      </p>
      <h3 className="font-serif text-xl">{f.title}</h3>
      {f.short_description && (
        <p className="text-sm text-muted-foreground mt-1.5">{f.short_description}</p>
      )}
      {f.mission && (
        <div className="mt-4 flex items-start gap-2 text-sm">
          <Target size={14} className="text-primary shrink-0 mt-0.5" />
          <div>
            <span className="text-xs uppercase tracking-wider text-primary">Missão: </span>
            <span className="text-foreground/90">{f.mission}</span>
          </div>
        </div>
      )}
      <Link to={`/scoreapp/app/conteudos/feedback/${f.trigger_key}`}
        className="mt-5 inline-flex items-center gap-2 bg-primary text-primary-foreground text-xs uppercase tracking-wide px-4 py-2.5 rounded-md">
        Ver recomendação <ArrowRight size={14} />
      </Link>
    </div>
  );
}
