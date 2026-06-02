import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, FileCheck2 } from "lucide-react";
import { toast } from "sonner";

type Task = { id: string; title: string; description: string | null; completed: boolean; completed_at: string | null; evidence_url: string | null; meeting_id: string | null };
type Meeting = { id: string; sequence: number; title: string; status: string };

export default function TarefasTab({ menteeId }: { menteeId: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [t, m] = await Promise.all([
      supabase.from("homework_tasks").select("*").eq("mentee_id", menteeId),
      supabase.from("meetings").select("id,sequence,title,status").eq("mentee_id", menteeId).order("sequence"),
    ]);
    setTasks((t.data as Task[]) ?? []);
    setMeetings((m.data as Meeting[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [menteeId]);

  const toggle = async (task: Task) => {
    const completed = !task.completed;
    await supabase.from("homework_tasks").update({ completed, completed_at: completed ? new Date().toISOString() : null }).eq("id", task.id);
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, completed, completed_at: completed ? new Date().toISOString() : null } : t));
  };

  const upload = async (task: Task, file: File) => {
    setUploadingId(task.id);
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session!.user.id;
    const path = `${uid}/${task.id}-${file.name}`;
    const up = await supabase.storage.from("mentee-evidence").upload(path, file, { upsert: true });
    if (up.error) { toast.error("Falha no upload."); setUploadingId(null); return; }
    await supabase.from("homework_tasks").update({ evidence_url: path }).eq("id", task.id);
    toast.success("Evidência enviada.");
    setUploadingId(null);
    load();
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div>;

  const visibleMeetings = meetings.filter((m) => m.status !== "blocked");
  const hasAny = visibleMeetings.some((m) => tasks.some((t) => t.meeting_id === m.id));

  return (
    <div className="space-y-6">
      {!hasAny && (
        <div className="border border-dashed border-border/60 rounded-lg p-8 text-center text-sm text-muted-foreground">
          Suas tarefas serão liberadas conforme você avança no cronograma.
        </div>
      )}
      {visibleMeetings.map((m) => {
        const items = tasks.filter((t) => t.meeting_id === m.id);
        if (items.length === 0) return null;
        return (
          <Card key={m.id} className="p-5 border-border/60">
            <div className="mb-4">
              <p className="text-xs text-muted-foreground font-mono-data">ENCONTRO {m.sequence}</p>
              <h3 className="font-semibold">{m.title}</h3>
            </div>
            <ul className="space-y-3">
              {items.map((t) => (
                <li key={t.id} className="flex items-start gap-3 p-3 rounded-md hover:bg-muted/40 transition">
                  <Checkbox checked={t.completed} onCheckedChange={() => toggle(t)} className="mt-1" />
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm ${t.completed ? "line-through text-muted-foreground" : ""}`}>{t.title}</p>
                    {t.description && <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>}
                    <div className="mt-2 flex items-center gap-3">
                      <label className="text-xs text-primary hover:underline cursor-pointer flex items-center gap-1.5">
                        {uploadingId === t.id ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                        {t.evidence_url ? "Substituir evidência" : "Enviar evidência"}
                        <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && upload(t, e.target.files[0])} />
                      </label>
                      {t.evidence_url && <span className="text-xs text-emerald-400 flex items-center gap-1"><FileCheck2 size={12} /> enviada</span>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        );
      })}
    </div>
  );
}
