import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Trash2, Upload, CheckCircle2, Unlock, Pencil, Link2, KeyRound, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import AdminNotesCard from "./AdminNotesCard";
import MenteePaymentCard from "./MenteePaymentCard";
import InviteMenteeDialog from "./InviteMenteeDialog";

type Mentee = { id: string; full_name: string; email: string; status: string; plan_id: string; plan_name?: string };
type PresenceStat = { last_seen_at: string | null; total_seconds: number; sessions: number };
type Meeting = { id: string; sequence: number; title: string; description: string | null; status: string; scheduled_at: string | null };
type Task = { id: string; title: string; description: string | null; meeting_id: string | null; completed: boolean };
type Resource = { id: string; title: string; kind: string; url: string; meeting_id: string };

const SPIN_PDF_URL = "/__l5e/assets-v1/0758221d-f958-42c2-9c7b-feef035826cd/spin-selling.pdf";

const statusLabel: Record<string, string> = {
  blocked: "Bloqueado",
  available: "Disponível",
  scheduled: "Agendado",
  completed: "Concluído",
};

export default function MenteesAdmin() {
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);
  const [meetingsDone, setMeetingsDone] = useState<Record<string, number>>({});

  const [taskForm, setTaskForm] = useState({ title: "", description: "" });
  const [linkForm, setLinkForm] = useState({ kind: "pdf", title: "", url: "" });
  const [savingLink, setSavingLink] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [editingMeeting, setEditingMeeting] = useState(false);
  const [meetingDraft, setMeetingDraft] = useState({ title: "", description: "" });

  const [resettingPwd, setResettingPwd] = useState(false);
  const [newPassword, setNewPassword] = useState<string | null>(null);

  const resetPassword = async () => {
    if (!selectedId || !selected) return;
    if (!confirm(`Gerar uma NOVA senha para ${selected.full_name}? A senha antiga deixará de funcionar imediatamente.`)) return;
    setResettingPwd(true);
    setNewPassword(null);
    const { data, error } = await supabase.functions.invoke("admin-reset-mentee-password", {
      body: { mentee_id: selectedId },
    });
    setResettingPwd(false);
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error ?? error?.message ?? "Falha ao redefinir senha");
      return;
    }
    setNewPassword((data as any).password);
    toast.success("Nova senha gerada. Copie e envie ao mentorado.");
  };

  const copyCredentials = async () => {
    if (!newPassword || !selected) return;
    const txt = `Acesso ao portal:\nE-mail: ${selected.email}\nSenha: ${newPassword}\nLogin: ${window.location.origin}/mentorados/login`;
    await navigator.clipboard.writeText(txt);
    toast.success("Credenciais copiadas.");
  };

  const loadMentees = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("mentees")
      .select("id,full_name,email,status,plan_id,mentorship_plans(name)")
      .order("created_at", { ascending: false });
    const list = (data ?? []).map((m: any) => ({ ...m, plan_name: m.mentorship_plans?.name }));
    setMentees(list);
    if (list.length) {
      const { data: ms } = await supabase
        .from("meetings")
        .select("mentee_id,status")
        .in("mentee_id", list.map((m: Mentee) => m.id));
      const counts: Record<string, number> = {};
      (ms ?? []).forEach((m: any) => {
        if (m.status === "completed") counts[m.mentee_id] = (counts[m.mentee_id] ?? 0) + 1;
      });
      setMeetingsDone(counts);
    }
    setLoading(false);
  };

  const loadDetail = async (menteeId: string) => {
    const [m, t, r] = await Promise.all([
      supabase.from("meetings").select("id,sequence,title,description,status,scheduled_at").eq("mentee_id", menteeId).order("sequence"),
      supabase.from("homework_tasks").select("id,title,description,meeting_id,completed").eq("mentee_id", menteeId),
      supabase.from("meeting_resources").select("id,title,kind,url,meeting_id,meetings!inner(mentee_id)").eq("meetings.mentee_id", menteeId),
    ]);
    const meetingList = (m.data as Meeting[]) ?? [];
    setMeetings(meetingList);
    setTasks((t.data as Task[]) ?? []);
    setResources(((r.data as any[]) ?? []).map((x) => ({ id: x.id, title: x.title, kind: x.kind, url: x.url, meeting_id: x.meeting_id })));
    setActiveMeetingId((cur) => cur && meetingList.some((mm) => mm.id === cur) ? cur : (meetingList[0]?.id ?? null));
  };

  useEffect(() => { loadMentees(); }, []);
  useEffect(() => {
    if (selectedId) loadDetail(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const toggleMeetingStatus = async (mt: Meeting, newStatus: string) => {
    await supabase.from("meetings").update({ status: newStatus }).eq("id", mt.id);
    if (newStatus === "completed") {
      const next = meetings.find((x) => x.sequence === mt.sequence + 1);
      if (next && next.status === "blocked") {
        await supabase.from("meetings").update({ status: "available" }).eq("id", next.id);
      }
    }
    toast.success("Status atualizado");
    loadDetail(selectedId!);
    loadMentees();
  };

  const unlockMeeting = async (mt: Meeting) => {
    await supabase.from("meetings").update({ status: "available" }).eq("id", mt.id);
    toast.success("Encontro liberado");
    loadDetail(selectedId!);
  };

  const startEditMeeting = (mt: Meeting) => {
    setMeetingDraft({ title: mt.title, description: mt.description ?? "" });
    setEditingMeeting(true);
  };

  const saveMeeting = async () => {
    if (!activeMeetingId) return;
    if (!meetingDraft.title.trim()) return toast.error("Título obrigatório.");
    const { error } = await supabase.from("meetings").update({
      title: meetingDraft.title,
      description: meetingDraft.description || null,
    }).eq("id", activeMeetingId);
    if (error) return toast.error("Falha ao salvar.");
    toast.success("Encontro atualizado.");
    setEditingMeeting(false);
    loadDetail(selectedId!);
  };

  const addTask = async () => {
    if (!activeMeetingId || !taskForm.title) return toast.error("Selecione encontro e título.");
    const { error } = await supabase.from("homework_tasks").insert({
      mentee_id: selectedId,
      meeting_id: activeMeetingId,
      title: taskForm.title,
      description: taskForm.description || null,
    });
    if (error) return toast.error("Falha ao adicionar.");
    toast.success("Tarefa adicionada.");
    setTaskForm({ title: "", description: "" });
    loadDetail(selectedId!);
  };

  const deleteTask = async (id: string) => {
    if (!confirm("Remover tarefa?")) return;
    await supabase.from("homework_tasks").delete().eq("id", id);
    loadDetail(selectedId!);
  };

  const addLinkResource = async () => {
    if (!activeMeetingId) return toast.error("Selecione um encontro.");
    const title = linkForm.title.trim();
    const url = linkForm.url.trim();
    if (!title || !url) return toast.error("Preencha título e URL.");
    setSavingLink(true);
    const { error } = await supabase.from("meeting_resources").insert({
      meeting_id: activeMeetingId,
      kind: linkForm.kind,
      title,
      url,
    });
    setSavingLink(false);
    if (error) {
      console.error("addLinkResource error", error);
      return toast.error(`Falha: ${error.message}`);
    }
    toast.success("Material adicionado.");
    setLinkForm({ kind: linkForm.kind, title: "", url: "" });
    loadDetail(selectedId!);
  };

  const uploadResource = async (file: File) => {
    if (!activeMeetingId) return toast.error("Selecione um encontro.");
    setUploading(true);
    const path = `admin/${selectedId}/${Date.now()}-${file.name}`;
    const up = await supabase.storage.from("mentee-evidence").upload(path, file, { upsert: true });
    if (up.error) { setUploading(false); console.error(up.error); return toast.error(`Upload: ${up.error.message}`); }
    const { data: signed } = await supabase.storage.from("mentee-evidence").createSignedUrl(path, 60 * 60 * 24 * 365);
    const url = signed?.signedUrl ?? path;
    const { error } = await supabase.from("meeting_resources").insert({
      meeting_id: activeMeetingId,
      kind: file.type.includes("pdf") ? "pdf" : file.type.startsWith("video") ? "video" : "link",
      title: file.name,
      url,
    });
    setUploading(false);
    if (error) { console.error(error); return toast.error(`Falha: ${error.message}`); }
    toast.success("Material enviado.");
    loadDetail(selectedId!);
  };

  const deleteResource = async (id: string, url: string) => {
    if (url === SPIN_PDF_URL) return toast.error("Material base não pode ser removido.");
    if (!confirm("Remover material?")) return;
    await supabase.from("meeting_resources").delete().eq("id", id);
    loadDetail(selectedId!);
  };

  const filteredMentees = mentees.filter((m) =>
    (m.full_name + m.email).toLowerCase().includes(search.toLowerCase())
  );
  const selected = mentees.find((m) => m.id === selectedId);
  const activeMeeting = meetings.find((m) => m.id === activeMeetingId);
  const meetingTasks = tasks.filter((t) => t.meeting_id === activeMeetingId);
  const meetingResources = resources.filter((r) => r.meeting_id === activeMeetingId);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="grid md:grid-cols-[280px_1fr] gap-6">
      {/* List */}
      <div className="space-y-3">
        <InviteMenteeDialog
          triggerClassName="w-full"
          onDone={() => loadMentees()}
        />
        <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="border border-border rounded-lg divide-y divide-border max-h-[700px] overflow-y-auto">
          {filteredMentees.length === 0 && <p className="p-4 text-sm text-muted-foreground">Nenhum mentorado.</p>}
          {filteredMentees.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedId(m.id)}
              className={`w-full text-left p-3 transition hover:bg-secondary/50 ${selectedId === m.id ? "bg-secondary" : ""}`}
            >
              <p className="font-medium text-sm truncate">{m.full_name}</p>
              <p className="text-xs text-muted-foreground truncate">{m.email}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {m.plan_name ?? "—"} · {meetingsDone[m.id] ?? 0}/6
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Detail */}
      <div>
        {!selected ? (
          <div className="border border-dashed border-border rounded-lg p-12 text-center text-muted-foreground">
            Selecione um mentorado à esquerda.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <h2 className="font-serif text-2xl">{selected.full_name}</h2>
                <p className="text-sm text-muted-foreground">{selected.email} · {selected.plan_name}</p>
              </div>
              <Button size="sm" variant="outline" onClick={resetPassword} disabled={resettingPwd} className="gap-1.5">
                {resettingPwd ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
                Redefinir senha
              </Button>
            </div>

            {newPassword && (
              <div className="border-2 border-primary/40 bg-primary/5 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs uppercase tracking-wider text-primary font-semibold">Nova senha gerada</p>
                  <Button size="sm" variant="ghost" onClick={() => setNewPassword(null)} className="h-7 text-xs">Fechar</Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Por segurança, senhas são armazenadas com hash irreversível. Esta senha aparece <strong>uma única vez</strong>. Copie agora e envie ao mentorado.
                </p>
                <div className="bg-background border border-border rounded p-3 font-mono text-sm break-all select-all">{newPassword}</div>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" onClick={copyCredentials} className="gap-1.5"><Copy size={14} /> Copiar credenciais</Button>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Acesso ao portal:\nE-mail: ${selected.email}\nSenha: ${newPassword}\nLogin: ${window.location.origin}/mentorados/login`)}`}
                    target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 border border-border rounded-md hover:bg-secondary"
                  >Enviar por WhatsApp</a>
                </div>
              </div>
            )}

            <MenteePaymentCard menteeId={selected.id} onChange={() => loadDetail(selected.id)} />
            <AdminNotesCard menteeId={selected.id} />

            {/* Meetings */}
            <div>
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Cronograma</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {meetings.map((mt) => (
                  <button
                    key={mt.id}
                    onClick={() => { setActiveMeetingId(mt.id); setEditingMeeting(false); }}
                    className={`p-3 border rounded-lg text-left transition ${activeMeetingId === mt.id ? "border-primary bg-primary/10" : "border-border hover:bg-secondary/50"}`}
                  >
                    <p className="text-xs font-mono text-muted-foreground">#{mt.sequence}</p>
                    <p className="text-sm font-medium truncate">{mt.title}</p>
                    <p className="text-[10px] uppercase tracking-wider mt-1 text-muted-foreground">{statusLabel[mt.status]}</p>
                  </button>
                ))}
              </div>
            </div>

            {activeMeeting && (
              <>
                {/* Meeting header / edit */}
                <div className="border border-border rounded-lg p-4 space-y-3">
                  {!editingMeeting ? (
                    <>
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="min-w-0">
                          <p className="text-xs font-mono text-muted-foreground">ENCONTRO {activeMeeting.sequence}</p>
                          <h3 className="font-semibold">{activeMeeting.title}</h3>
                          {activeMeeting.description && (
                            <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{activeMeeting.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Button size="sm" variant="outline" onClick={() => startEditMeeting(activeMeeting)} className="gap-1.5">
                            <Pencil size={14} /> Editar conteúdo
                          </Button>
                          {activeMeeting.status === "blocked" && (
                            <Button size="sm" variant="outline" onClick={() => unlockMeeting(activeMeeting)} className="gap-1.5">
                              <Unlock size={14} /> Liberar
                            </Button>
                          )}
                          {activeMeeting.status !== "completed" && (
                            <Button size="sm" variant="outline" onClick={() => toggleMeetingStatus(activeMeeting, "completed")} className="gap-1.5">
                              <CheckCircle2 size={14} /> Concluído
                            </Button>
                          )}
                          {activeMeeting.status === "completed" && (
                            <Button size="sm" variant="outline" onClick={() => toggleMeetingStatus(activeMeeting, "available")}>
                              Reabrir
                            </Button>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs font-mono text-muted-foreground">ENCONTRO {activeMeeting.sequence} — editando</p>
                      <Input value={meetingDraft.title} onChange={(e) => setMeetingDraft({ ...meetingDraft, title: e.target.value })} placeholder="Título" />
                      <Textarea value={meetingDraft.description} onChange={(e) => setMeetingDraft({ ...meetingDraft, description: e.target.value })} placeholder="Descrição (o mentorado vê)" rows={4} />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveMeeting}>Salvar</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingMeeting(false)}>Cancelar</Button>
                      </div>
                      <p className="text-xs text-muted-foreground">Esta personalização aparece no portal do mentorado como "Adaptado para você".</p>
                    </div>
                  )}
                </div>

                {/* Tasks */}
                <div className="border border-border rounded-lg p-4 space-y-3">
                  <h4 className="text-sm font-semibold">Tarefas ({meetingTasks.length})</h4>
                  <ul className="space-y-2">
                    {meetingTasks.map((t) => (
                      <li key={t.id} className="flex items-start gap-2 p-2 rounded bg-secondary/30">
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${t.completed ? "line-through text-muted-foreground" : ""}`}>{t.title}</p>
                          {t.description && <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>}
                        </div>
                        <button onClick={() => deleteTask(t.id)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 size={14} />
                        </button>
                      </li>
                    ))}
                    {meetingTasks.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma tarefa.</p>}
                  </ul>
                  <div className="border-t border-border pt-3 space-y-2">
                    <Input placeholder="Título da tarefa" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} />
                    <Textarea placeholder="Descrição (opcional)" value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} rows={2} />
                    <Button size="sm" onClick={addTask} className="gap-1.5"><Plus size={14} /> Adicionar tarefa</Button>
                  </div>
                </div>

                {/* Resources */}
                <div className="border border-border rounded-lg p-4 space-y-4">
                  <h4 className="text-sm font-semibold">Materiais ({meetingResources.length})</h4>
                  <ul className="space-y-2">
                    {meetingResources.map((r) => (
                      <li key={r.id} className="flex items-center gap-2 p-2 rounded bg-secondary/30">
                        <a href={r.url} target="_blank" rel="noreferrer" className="flex-1 text-sm truncate hover:text-primary">
                          [{r.kind.toUpperCase()}] {r.title}
                        </a>
                        <button onClick={() => deleteResource(r.id, r.url)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 size={14} />
                        </button>
                      </li>
                    ))}
                    {meetingResources.length === 0 && <p className="text-xs text-muted-foreground">Nenhum material.</p>}
                  </ul>

                  <div className="grid md:grid-cols-2 gap-4 border-t border-border pt-4">
                    {/* Link */}
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Link2 size={12} /> Adicionar via link</p>
                      <div className="flex gap-2">
                        <Select value={linkForm.kind} onValueChange={(v) => setLinkForm({ ...linkForm, kind: v })}>
                          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pdf">PDF</SelectItem>
                            <SelectItem value="video">Vídeo</SelectItem>
                            <SelectItem value="link">Link</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input placeholder="Título" value={linkForm.title} onChange={(e) => setLinkForm({ ...linkForm, title: e.target.value })} />
                      </div>
                      <Input placeholder="URL (https://...)" value={linkForm.url} onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })} />
                      <Button
                        size="sm"
                        onClick={addLinkResource}
                        disabled={savingLink || !linkForm.title.trim() || !linkForm.url.trim()}
                        className="gap-1.5 w-full"
                      >
                        {savingLink ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                        Adicionar link
                      </Button>
                    </div>

                    {/* Upload */}
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Upload size={12} /> Upload de arquivo</p>
                      <label className="block border border-dashed border-border rounded p-6 text-center cursor-pointer hover:bg-secondary/40 transition">
                        {uploading ? (
                          <span className="text-sm text-muted-foreground inline-flex items-center gap-1.5"><Loader2 size={14} className="animate-spin" /> enviando…</span>
                        ) : (
                          <>
                            <Upload size={20} className="mx-auto text-muted-foreground mb-1" />
                            <p className="text-sm">Selecionar arquivo</p>
                            <p className="text-xs text-muted-foreground">PDF, vídeo, qualquer formato</p>
                          </>
                        )}
                        <input
                          type="file"
                          className="hidden"
                          disabled={uploading}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) uploadResource(f);
                            e.currentTarget.value = "";
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
