import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Loader2, Video, FileText, Link as LinkIcon, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type Row = {
  id: string;
  kind: string;
  title: string;
  url: string;
  meeting_id: string;
  meeting_title: string;
  meeting_status: string;
  sequence: number;
  shared_count: number;
};

type MeetingOpt = { id: string; sequence: number; title: string };

export default function RepositorioTab({ menteeId }: { menteeId: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "video" | "pdf" | "link">("all");
  const [isAdmin, setIsAdmin] = useState(false);
  const [meetings, setMeetings] = useState<MeetingOpt[]>([]);
  const [form, setForm] = useState({ meeting_id: "", kind: "pdf", title: "", url: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: me } = await supabase.auth.getUser();
    if (me.user) {
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", me.user.id);
      setIsAdmin(!!roles?.some((r) => r.role === "admin"));
    }

    const { data: meetingRows } = await supabase
      .from("meetings")
      .select("id,sequence,title")
      .eq("mentee_id", menteeId)
      .order("sequence");
    setMeetings(meetingRows ?? []);

    const { data } = await supabase
      .from("meeting_resources")
      .select("id,kind,title,url,meeting_id,meetings!inner(sequence,title,status,mentee_id)")
      .eq("meetings.mentee_id", menteeId);

    // Count how many meetings (across all mentees) share the same resource URL to detect "personalized"
    const urls = Array.from(new Set((data ?? []).map((r: any) => r.url)));
    const counts: Record<string, number> = {};
    if (urls.length > 0) {
      const { data: shared } = await supabase.from("meeting_resources").select("url").in("url", urls);
      (shared ?? []).forEach((s: any) => {
        counts[s.url] = (counts[s.url] ?? 0) + 1;
      });
    }

    const flat = (data ?? []).map((r: any) => ({
      id: r.id,
      kind: r.kind,
      title: r.title,
      url: r.url,
      meeting_id: r.meeting_id,
      meeting_title: r.meetings.title,
      meeting_status: r.meetings.status,
      sequence: r.meetings.sequence,
      shared_count: counts[r.url] ?? 1,
    }));
    setRows(flat);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menteeId]);

  const handleAdd = async () => {
    if (!form.meeting_id || !form.title || !form.url) {
      toast.error("Preencha encontro, título e URL.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("meeting_resources").insert({
      meeting_id: form.meeting_id,
      kind: form.kind,
      title: form.title,
      url: form.url,
    });
    setSaving(false);
    if (error) {
      toast.error("Falha ao adicionar material.");
      return;
    }
    toast.success("Material adicionado.");
    setForm({ meeting_id: "", kind: "pdf", title: "", url: "" });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover este material?")) return;
    const { error } = await supabase.from("meeting_resources").delete().eq("id", id);
    if (error) return toast.error("Falha ao remover.");
    toast.success("Removido.");
    load();
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div>;

  const visible = rows
    .filter((r) => r.meeting_status !== "blocked")
    .filter((r) => filter === "all" || r.kind === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(["all", "video", "pdf", "link"] as const).map((k) => (
          <Button key={k} variant={filter === k ? "default" : "outline"} size="sm" onClick={() => setFilter(k)}>
            {k === "all" ? "Todos" : k.toUpperCase()}
          </Button>
        ))}
      </div>

      {visible.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground border-border/60">
          Nenhum recurso disponível ainda. À medida que os encontros forem liberados, os materiais aparecem aqui.
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {visible.map((r) => {
            const Icon = r.kind === "video" ? Video : r.kind === "pdf" ? FileText : LinkIcon;
            const isPersonal = r.shared_count === 1;
            return (
              <Card key={r.id} className="p-4 border-border/60 hover:border-primary/50 transition flex items-start gap-3">
                <a href={r.url} target="_blank" rel="noreferrer" className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-md bg-primary/15 text-primary flex items-center justify-center shrink-0"><Icon size={18} /></div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-mono-data text-muted-foreground">ENCONTRO {r.sequence}</p>
                      {isPersonal && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider bg-primary/15 text-primary px-1.5 py-0.5 rounded">
                          Personalizado
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-sm">{r.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{r.meeting_title}</p>
                  </div>
                </a>
                {isAdmin && (
                  <button onClick={() => handleDelete(r.id)} className="text-muted-foreground hover:text-destructive shrink-0">
                    <Trash2 size={14} />
                  </button>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {isAdmin && (
        <Card className="p-5 border-dashed border-primary/40">
          <div className="flex items-center gap-2 mb-4">
            <Plus size={16} className="text-primary" />
            <h3 className="font-semibold">Adicionar material para este mentorado</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <Select value={form.meeting_id} onValueChange={(v) => setForm((f) => ({ ...f, meeting_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Encontro" /></SelectTrigger>
              <SelectContent>
                {meetings.map((m) => (
                  <SelectItem key={m.id} value={m.id}>#{m.sequence} — {m.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={form.kind} onValueChange={(v) => setForm((f) => ({ ...f, kind: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="video">Vídeo</SelectItem>
                <SelectItem value="link">Link</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Título" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            <Input placeholder="URL (https://...)" value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} />
          </div>
          <Button onClick={handleAdd} disabled={saving} className="mt-4">
            {saving ? <Loader2 className="animate-spin" size={14} /> : "Adicionar material"}
          </Button>
        </Card>
      )}
    </div>
  );
}
