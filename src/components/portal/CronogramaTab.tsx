import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2, Video, FileText, Link as LinkIcon, Lock, CheckCircle2, CalendarDays, HardDriveUpload } from "lucide-react";
import { toast } from "sonner";

type Meeting = {
  id: string;
  sequence: number;
  title: string;
  description: string | null;
  status: "blocked" | "available" | "scheduled" | "completed";
  scheduled_at: string | null;
  meet_link: string | null;
  unlocks_at: string | null;
};
type Resource = { id: string; meeting_id: string; kind: string; title: string; url: string };

const statusMeta: Record<Meeting["status"], { label: string; cls: string }> = {
  completed: { label: "Concluído", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  scheduled: { label: "Agendado", cls: "bg-sky-500/15 text-sky-400 border-sky-500/30" },
  available: { label: "Disponível", cls: "bg-primary/15 text-primary border-primary/30" },
  blocked:   { label: "Bloqueado", cls: "bg-muted text-muted-foreground border-border" },
};

export default function CronogramaTab({ menteeId, menteeEmail, onChange }: { menteeId: string; menteeEmail: string; onChange: () => void }) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [templates, setTemplates] = useState<Record<number, { title: string; description: string | null }>>({});
  const [loading, setLoading] = useState(true);
  const [scheduleFor, setScheduleFor] = useState<Meeting | null>(null);
  const [scheduledAt, setScheduledAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [drivingId, setDrivingId] = useState<string | null>(null);

  const sendToDrive = async (m: Meeting) => {
    setDrivingId(m.id);
    const { data, error } = await supabase.functions.invoke("meeting-to-drive", { body: { meeting_id: m.id } });
    setDrivingId(null);
    if (error || (data as any)?.error) {
      toast.error("Não foi possível enviar para o Drive.");
      return;
    }
    const link = (data as any)?.file?.webViewLink;
    toast.success("Agenda enviada para o seu Google Drive!", link ? { action: { label: "Abrir", onClick: () => window.open(link, "_blank") } } : undefined);
  };

  const load = async () => {
    setLoading(true);
    const { data: menteeRow } = await supabase.from("mentees").select("plan_id").eq("id", menteeId).maybeSingle();
    const planId = (menteeRow as any)?.plan_id;
    const [m, r, tpl] = await Promise.all([
      supabase.from("meetings").select("*").eq("mentee_id", menteeId).order("sequence"),
      supabase.from("meeting_resources").select("*"),
      planId ? supabase.from("meeting_templates").select("sequence,title,description").eq("plan_id", planId) : Promise.resolve({ data: [] as any[] }),
    ]);
    setMeetings((m.data as Meeting[]) ?? []);
    setResources((r.data as Resource[]) ?? []);
    const tplMap: Record<number, { title: string; description: string | null }> = {};
    ((tpl.data as any[]) ?? []).forEach((t) => { tplMap[t.sequence] = { title: t.title, description: t.description }; });
    setTemplates(tplMap);
    setLoading(false);
  };
  useEffect(() => { load(); }, [menteeId]);

  const submitSchedule = async () => {
    if (!scheduleFor || !scheduledAt) return;
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("schedule-meeting", {
      body: { meeting_id: scheduleFor.id, scheduled_at: new Date(scheduledAt).toISOString(), mentee_email: menteeEmail },
    });
    setBusy(false);
    if (error || (data as any)?.error) {
      toast.error("Não foi possível agendar agora. Tente novamente em instantes.");
      return;
    }
    toast.success("Reunião agendada! Você receberá o convite no Google Agenda.");
    setScheduleFor(null);
    setScheduledAt("");
    await load();
    onChange();
  };

  const markCompleted = async (m: Meeting) => {
    await supabase.from("meetings").update({ status: "completed" }).eq("id", m.id);
    // unlock next meeting
    const next = meetings.find((x) => x.sequence === m.sequence + 1);
    if (next && next.status === "blocked") {
      await supabase.from("meetings").update({ status: "available" }).eq("id", next.id);
    }
    await load();
    onChange();
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div>;

  const months = [1, 2, 3];
  return (
    <div className="space-y-8">
      <Card className="p-4 border-primary/30 bg-primary/5">
        <p className="text-sm text-foreground">
          <span className="font-semibold text-primary">Cronograma adaptado.</span>{" "}
          O conteúdo dos próximos encontros, tarefas e materiais pode ser ajustado pelo mentor ao longo da jornada, de acordo com sua evolução.
        </p>
      </Card>
      {months.map((month) => {
        const monthMeetings = meetings.filter((m) => m.sequence === month * 2 - 1 || m.sequence === month * 2);
        return (
          <section key={month}>
            <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">Mês {month}</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {monthMeetings.map((m) => {
                const meta = statusMeta[m.status];
                const isLocked = m.status === "blocked";
                const meetingResources = resources.filter((r) => r.meeting_id === m.id);
                const tpl = templates[m.sequence];
                const isCustomized = tpl ? (tpl.title !== m.title || (tpl.description ?? "") !== (m.description ?? "")) : false;
                return (
                  <Card key={m.id} className={`p-5 border-border/60 ${isLocked ? "opacity-60" : ""}`}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground font-mono-data">ENCONTRO {m.sequence}</p>
                        <h4 className="font-semibold mt-0.5">{m.title}</h4>
                        {isCustomized && (
                          <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider bg-primary/15 text-primary px-1.5 py-0.5 rounded">
                            Adaptado para você
                          </span>
                        )}
                      </div>
                      <Badge variant="outline" className={meta.cls}>{meta.label}</Badge>
                    </div>
                    {m.description && <p className="text-sm text-muted-foreground mb-4">{m.description}</p>}

                    {m.scheduled_at && (
                      <div className="text-sm flex items-center gap-2 text-muted-foreground mb-3 font-mono-data">
                        <CalendarDays size={14} />
                        {new Date(m.scheduled_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                      </div>
                    )}

                    {meetingResources.length > 0 && (
                      <div className="space-y-1.5 mb-4 border-t border-border/60 pt-3">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Conteúdo de apoio</p>
                        {meetingResources.map((r) => {
                          const Icon = r.kind === "video" ? Video : r.kind === "pdf" ? FileText : LinkIcon;
                          return (
                            <a key={r.id} href={r.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition">
                              <Icon size={14} /> {r.title}
                            </a>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-1">
                      {isLocked && <span className="text-xs text-muted-foreground flex items-center gap-1.5"><Lock size={12} /> Liberado em breve</span>}
                      {m.status === "available" && (
                        <Button size="sm" onClick={() => setScheduleFor(m)}>Agendar reunião</Button>
                      )}
                      {m.status === "scheduled" && m.meet_link && (
                        <Button size="sm" asChild><a href={m.meet_link} target="_blank" rel="noreferrer">Entrar no Meet</a></Button>
                      )}
                      {m.status === "scheduled" && (
                        <Button size="sm" variant="outline" onClick={() => markCompleted(m)} className="gap-1.5">
                          <CheckCircle2 size={14} /> Marcar concluído
                        </Button>
                      )}
                      {m.status === "scheduled" && (
                        <Button size="sm" variant="outline" onClick={() => sendToDrive(m)} disabled={drivingId === m.id} className="gap-1.5">
                          {drivingId === m.id ? <Loader2 className="animate-spin" size={14} /> : <HardDriveUpload size={14} />} Enviar agenda no Drive
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        );
      })}

      <Dialog open={!!scheduleFor} onOpenChange={(o) => !o && setScheduleFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agendar: {scheduleFor?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Data e horário</label>
            <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
            <p className="text-xs text-muted-foreground">Você receberá o convite por e-mail com o link do Google Meet.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleFor(null)}>Cancelar</Button>
            <Button onClick={submitSchedule} disabled={!scheduledAt || busy}>
              {busy ? <Loader2 className="animate-spin" size={14} /> : "Confirmar agendamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
