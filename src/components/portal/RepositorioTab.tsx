import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Loader2, Video, FileText, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type Row = {
  id: string;
  kind: string;
  title: string;
  url: string;
  meeting_id: string;
  meeting_title: string;
  meeting_status: string;
  sequence: number;
};

export default function RepositorioTab({ menteeId }: { menteeId: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "video" | "pdf" | "link">("all");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("meeting_resources")
        .select("id,kind,title,url,meeting_id,meetings!inner(sequence,title,status,mentee_id)")
        .eq("meetings.mentee_id", menteeId);
      const flat = (data ?? []).map((r: any) => ({
        id: r.id,
        kind: r.kind,
        title: r.title,
        url: r.url,
        meeting_id: r.meeting_id,
        meeting_title: r.meetings.title,
        meeting_status: r.meetings.status,
        sequence: r.meetings.sequence,
      }));
      setRows(flat);
      setLoading(false);
    })();
  }, [menteeId]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div>;

  const visible = rows
    .filter((r) => r.meeting_status !== "blocked")
    .filter((r) => filter === "all" || r.kind === filter)
    .sort((a, b) => a.sequence - b.sequence);

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
            return (
              <a
                key={r.id}
                href={r.url}
                target="_blank"
                rel="noreferrer"
                className="block"
              >
                <Card className="p-4 border-border/60 hover:border-primary/50 transition flex items-start gap-3">
                  <div className="w-10 h-10 rounded-md bg-primary/15 text-primary flex items-center justify-center shrink-0"><Icon size={18} /></div>
                  <div className="min-w-0">
                    <p className="text-xs font-mono-data text-muted-foreground">ENCONTRO {r.sequence}</p>
                    <p className="font-medium text-sm">{r.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{r.meeting_title}</p>
                  </div>
                </Card>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
