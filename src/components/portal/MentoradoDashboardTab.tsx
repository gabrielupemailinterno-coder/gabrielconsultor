import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CalendarDays, ListChecks, FolderOpen, ArrowRight, Sparkles, CheckCircle2, Video, FileText, Link as LinkIcon, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/app/SectionCard";
import { EmptyState } from "@/components/app/EmptyState";
import { StatusBadge } from "@/components/app/StatusBadge";
import { KpiTile } from "@/components/app/KpiTile";

type Meeting = {
  id: string;
  sequence: number;
  title: string;
  description: string | null;
  status: "blocked" | "available" | "scheduled" | "completed";
  scheduled_at: string | null;
  meet_link: string | null;
};
type Task = { id: string; title: string; description: string | null; completed: boolean; meeting_id: string | null };
type Resource = { id: string; kind: string; title: string; url: string; meeting_id: string };

interface Props {
  menteeId: string;
  onGoTo: (tab: string) => void;
}

export default function MentoradoDashboardTab({ menteeId, onGoTo }: Props) {
  const [loading, setLoading] = useState(true);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [m, t, r] = await Promise.all([
        supabase.from("meetings").select("id,sequence,title,description,status,scheduled_at,meet_link").eq("mentee_id", menteeId).order("sequence"),
        supabase.from("homework_tasks").select("id,title,description,completed,meeting_id").eq("mentee_id", menteeId),
        supabase.from("meeting_resources").select("id,kind,title,url,meeting_id,meetings!inner(mentee_id,status,sequence)").eq("meetings.mentee_id", menteeId),
      ]);
      setMeetings((m.data as any) ?? []);
      setTasks((t.data as any) ?? []);
      const flat = ((r.data as any) ?? [])
        .filter((x: any) => x.meetings?.status !== "blocked")
        .map((x: any) => ({ id: x.id, kind: x.kind, title: x.title, url: x.url, meeting_id: x.meeting_id }));
      setResources(flat);
      setLoading(false);
    })();
  }, [menteeId]);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div>;
  }

  const total = meetings.length;
  const done = meetings.filter((m) => m.status === "completed").length;
  const pendingTasks = tasks.filter((t) => !t.completed);
  const nextMeeting =
    meetings.find((m) => m.status === "scheduled") ??
    meetings.find((m) => m.status === "available") ??
    null;
  const lastCompleted = [...meetings].reverse().find((m) => m.status === "completed") ?? null;
  const recentResources = resources.slice(0, 4);

  const nextStep = (() => {
    if (nextMeeting?.status === "available") {
      return {
        title: "Agende seu próximo encontro",
        description: `Encontro ${nextMeeting.sequence} liberado. Escolha um horário no Google Agenda para dar sequência à sua jornada.`,
        cta: "Ir para o cronograma",
        action: () => onGoTo("cronograma"),
      };
    }
    if (nextMeeting?.status === "scheduled") {
      return {
        title: "Prepare-se para o próximo encontro",
        description: `Encontro ${nextMeeting.sequence} agendado. ${pendingTasks.length > 0 ? `Você tem ${pendingTasks.length} tarefa(s) pendente(s) — resolva antes.` : "Revise os materiais e chegue pronto."}`,
        cta: pendingTasks.length > 0 ? "Ver tarefas pendentes" : "Ver cronograma",
        action: () => onGoTo(pendingTasks.length > 0 ? "tarefas" : "cronograma"),
      };
    }
    if (pendingTasks.length > 0) {
      return {
        title: "Conclua suas tarefas pendentes",
        description: `Você tem ${pendingTasks.length} tarefa(s) para concluir e destravar o próximo encontro.`,
        cta: "Ir para tarefas",
        action: () => onGoTo("tarefas"),
      };
    }
    if (done === total && total > 0) {
      return {
        title: "Jornada concluída",
        description: "Você concluiu todos os encontros. Fale com seu mentor sobre o próximo ciclo.",
        cta: "Ver métricas",
        action: () => onGoTo("metricas"),
      };
    }
    return {
      title: "Aguarde a liberação do próximo passo",
      description: "Seu mentor está preparando os próximos passos da sua jornada.",
      cta: "Ver cronograma",
      action: () => onGoTo("cronograma"),
    };
  })();

  return (
    <div className="space-y-6">
      {/* Próximo passo — hero */}
      <div className="surface-elevated p-6 ring-1 ring-primary/30 bg-gradient-to-br from-primary/8 to-transparent">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
            <Sparkles size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-primary font-medium">Próximo passo</p>
            <h2 className="font-serif text-2xl mt-1">{nextStep.title}</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-xl">{nextStep.description}</p>
            <Button size="sm" className="mt-4 gap-1.5" onClick={nextStep.action}>
              {nextStep.cta} <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      </div>

      {/* KPIs de jornada */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiTile icon={CalendarDays} label="Encontros" value={`${done}/${total || "—"}`} sub="concluídos" />
        <KpiTile icon={ListChecks} label="Tarefas pendentes" value={pendingTasks.length} accent={pendingTasks.length > 0} />
        <KpiTile icon={FolderOpen} label="Materiais liberados" value={resources.length} />
        <KpiTile icon={CheckCircle2} label="Última entrega" value={lastCompleted ? `Enc. ${lastCompleted.sequence}` : "—"} sub={lastCompleted?.title} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Próximo encontro */}
        <SectionCard
          title="Próximo encontro"
          actions={<Button size="sm" variant="ghost" onClick={() => onGoTo("cronograma")}>Ver todos</Button>}
        >
          {nextMeeting ? (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Encontro {nextMeeting.sequence}</p>
                  <h4 className="font-medium mt-0.5">{nextMeeting.title}</h4>
                </div>
                <StatusBadge tone={nextMeeting.status === "scheduled" ? "info" : "success"}>
                  {nextMeeting.status === "scheduled" ? "Agendado" : "Disponível"}
                </StatusBadge>
              </div>
              {nextMeeting.description && (
                <p className="text-sm text-muted-foreground">{nextMeeting.description}</p>
              )}
              {nextMeeting.scheduled_at && (
                <div className="flex items-center gap-2 text-sm text-foreground font-mono-data">
                  <CalendarDays size={14} className="text-primary" />
                  {new Date(nextMeeting.scheduled_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                </div>
              )}
              <div className="flex gap-2 pt-1">
                {nextMeeting.status === "scheduled" && nextMeeting.meet_link && (
                  <Button size="sm" asChild><a href={nextMeeting.meet_link} target="_blank" rel="noreferrer">Entrar no Meet</a></Button>
                )}
                <Button size="sm" variant="outline" onClick={() => onGoTo("cronograma")}>Detalhes</Button>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={CalendarDays}
              title="Seu próximo encontro aparecerá aqui quando for agendado."
              description="Assim que um novo encontro for liberado, ele aparece por aqui."
            />
          )}
        </SectionCard>

        {/* Tarefas pendentes */}
        <SectionCard
          title="Tarefas pendentes"
          actions={<Button size="sm" variant="ghost" onClick={() => onGoTo("tarefas")}>Ver todas</Button>}
        >
          {pendingTasks.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="Você ainda não tem tarefas pendentes."
              description="Quando novas tarefas forem liberadas, elas aparecem aqui."
            />
          ) : (
            <ul className="divide-y divide-border/60">
              {pendingTasks.slice(0, 5).map((t) => (
                <li key={t.id} className="py-2.5 flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{t.title}</p>
                    {t.description && <p className="text-xs text-muted-foreground truncate">{t.description}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      {/* Materiais recomendados */}
      <SectionCard
        title="Materiais recomendados"
        description="Conteúdos liberados a partir dos seus encontros"
        actions={<Button size="sm" variant="ghost" onClick={() => onGoTo("repositorio")}>Abrir repositório</Button>}
      >
        {recentResources.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="Assim que um novo material for liberado, ele aparecerá aqui."
          />
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {recentResources.map((r) => {
              const Icon = r.kind === "video" ? Video : r.kind === "pdf" ? FileText : LinkIcon;
              return (
                <a
                  key={r.id}
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="surface-elevated surface-elevated-hover p-3 flex items-start gap-3"
                >
                  <div className="w-9 h-9 rounded-md bg-primary/15 text-primary flex items-center justify-center shrink-0">
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{r.title}</p>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{r.kind}</p>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* Últimas entregas */}
      {lastCompleted && (
        <SectionCard title="Últimas entregas">
          <ul className="divide-y divide-border/60">
            {meetings.filter((m) => m.status === "completed").slice(-3).reverse().map((m) => (
              <li key={m.id} className="py-2.5 flex items-center gap-3">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">Encontro {m.sequence} — {m.title}</p>
                </div>
                <StatusBadge tone="success">Concluído</StatusBadge>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}
    </div>
  );
}
