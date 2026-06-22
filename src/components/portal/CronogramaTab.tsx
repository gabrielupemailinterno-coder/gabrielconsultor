import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2, Video, FileText, Link as LinkIcon, Lock, CheckCircle2, CalendarDays, ExternalLink } from "lucide-react";
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

const BOOKING_URL = "https://calendar.app.google/ZAXUC21NXxJqNAuDA";

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
  const [confirmFor, setConfirmFor] = useState<Meeting | null>(null);
  const [confirmAt, setConfirmAt] = useState("");
  const [confirmLink, setConfirmLink] = useState("");
  const [busy, setBusy] = useState(false);

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

  const submitConfirm = async () => {
    if (!confirmFor || !confirmAt) return;
    setBusy(true);
    const { error } = await supabase
      .from("meetings")
      .update({
        scheduled_at: new Date(confirmAt).toISOString(),
        meet_link: confirmLink.trim() || null,
        status: "scheduled",
      })
      .eq("id", confirmFor.id);
    setBusy(false);
    if (error) {
      toast.error("Não foi possível confirmar agora. Tente novamente.");
      return;
    }
    toast.success("Encontro confirmado!");
    setConfirmFor(null);
    setConfirmAt("");
    setConfirmLink("");
    await load();
    onChange();
  };

  const markCompleted = async (m: Meeting) => {
    await supabase.from("meetings").update({ status: "completed" }).eq("id", m.id);
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
                        <>
                          <Button size="sm" asChild className="gap-1.5">
                            <a href={BOOKING_URL} target="_blank" rel="noreferrer">
                              <ExternalLink size={14} /> Agendar no Google Agenda
                            </a>
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setConfirmFor(m)}>
                            Já agendei — confirmar data
                          </Button>
                        </>
                      )}
                      {m.status === "scheduled" && m.meet_link && (
                        <Button size="sm" asChild><a href={m.meet_link} target="_blank" rel="noreferrer">Entrar no Meet</a></Button>
                      )}
                      {m.status === "scheduled" && (
                        <Button size="sm" variant="outline" onClick={() => markCompleted(m)} className="gap-1.5">
                          <CheckCircle2 size={14} /> Marcar concluído
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

      <Dialog open={!!confirmFor} onOpenChange={(o) => !o && setConfirmFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar agendamento: {confirmFor?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Preencha com a data/horário que você escolheu no Google Agenda e cole o link do Meet que veio no convite.
            </p>
            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground">Data e horário</label>
              <Input type="datetime-local" value={confirmAt} onChange={(e) => setConfirmAt(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground">Link do Google Meet (opcional)</label>
              <Input type="url" placeholder="https://meet.google.com/..." value={confirmLink} onChange={(e) => setConfirmLink(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmFor(null)}>Cancelar</Button>
            <Button onClick={submitConfirm} disabled={!confirmAt || busy}>
              {busy ? <Loader2 className="animate-spin" size={14} /> : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
