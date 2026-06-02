import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, StickyNote } from "lucide-react";

export default function AdminNotesCard({ menteeId }: { menteeId: string }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const timer = useRef<number | null>(null);
  const initialLoad = useRef(true);

  useEffect(() => {
    initialLoad.current = true;
    setLoading(true);
    supabase
      .from("mentee_admin_notes")
      .select("content,updated_at")
      .eq("mentee_id", menteeId)
      .maybeSingle()
      .then(({ data }) => {
        setContent(data?.content ?? "");
        setSavedAt(data?.updated_at ? new Date(data.updated_at) : null);
        setLoading(false);
        // allow autosave on next change
        setTimeout(() => { initialLoad.current = false; }, 50);
      });
    return () => { if (timer.current) window.clearTimeout(timer.current); };
  }, [menteeId]);

  const save = async (next: string) => {
    setSaving(true);
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user.id;
    const { error } = await supabase
      .from("mentee_admin_notes")
      .upsert({ mentee_id: menteeId, content: next, updated_by: uid }, { onConflict: "mentee_id" });
    setSaving(false);
    if (!error) setSavedAt(new Date());
  };

  const onChange = (v: string) => {
    setContent(v);
    if (initialLoad.current) return;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => save(v), 800);
  };

  return (
    <div className="border border-border rounded-lg p-4 bg-secondary/20">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <StickyNote size={14} className="text-primary" />
          Anotações privadas
          <span className="text-xs text-muted-foreground font-normal">(só você vê)</span>
        </div>
        <div className="text-xs text-muted-foreground">
          {saving ? (
            <span className="flex items-center gap-1"><Loader2 size={11} className="animate-spin" /> salvando…</span>
          ) : savedAt ? (
            `Salvo às ${savedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
          ) : null}
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="animate-spin text-muted-foreground" size={16} /></div>
      ) : (
        <Textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Insights, dores, oportunidades, próximos passos, pontos de atenção…"
          rows={6}
          className="font-mono text-sm"
        />
      )}
    </div>
  );
}
