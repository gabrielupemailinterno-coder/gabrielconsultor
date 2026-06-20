import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Send, Pause, Play, Ban, Trash2, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import NewCampaignDialog from "./NewCampaignDialog";
import CampaignDetail from "./CampaignDetail";

type Campaign = {
  id: string;
  name: string;
  status: string;
  kind: string;
  destination_type: string | null;
  group_id: string | null;
  message: string;
  total: number;
  sent_count: number;
  error_count: number;
  add_optout: boolean;
  created_at: string;
};

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-blue-500/15 text-blue-500",
  running: "bg-amber-500/15 text-amber-500",
  done: "bg-green-500/15 text-green-500",
  cancelled: "bg-destructive/15 text-destructive",
  paused: "bg-secondary text-foreground",
};

export default function WhatsAppCampaignsTab() {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [openNew, setOpenNew] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any).from("campaigns").select("*").order("created_at", { ascending: false });
    setCampaigns((data as Campaign[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = (supabase as any)
      .channel("campaigns-ch")
      .on("postgres_changes", { event: "*", schema: "public", table: "campaigns" }, () => load())
      .subscribe();
    return () => { (supabase as any).removeChannel(ch); };
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await (supabase as any).from("campaigns").update({ status }).eq("id", id);
    if (error) toast.error(error.message); else toast.success("Status atualizado");
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir esta campanha e todos os contatos/logs?")) return;
    await (supabase as any).from("campaigns").delete().eq("id", id);
    setCampaigns((cs) => cs.filter((c) => c.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  if (selectedId) {
    return <CampaignDetail campaignId={selectedId} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl">Campanhas WhatsApp</h2>
        <button onClick={() => setOpenNew(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded text-sm">
          <Plus size={16} /> Nova campanha
        </button>
      </div>

      {loading && <Loader2 className="animate-spin" />}

      {!loading && campaigns.length === 0 && (
        <p className="text-muted-foreground text-sm">Nenhuma campanha ainda.</p>
      )}

      <div className="space-y-2">
        {campaigns.map((c) => (
          <div key={c.id} className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
            <button onClick={() => setSelectedId(c.id)} className="flex-1 text-left">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="font-medium">{c.name}</h3>
                <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_BADGE[c.status] ?? "bg-muted"}`}>{c.status}</span>
                <span className="text-xs text-muted-foreground">{c.destination_type === "group" ? "Grupo" : "Lista"}</span>
                <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString("pt-BR")}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{c.message}</p>
              <div className="flex gap-4 mt-2 text-xs">
                <span>Total: <strong>{c.total}</strong></span>
                <span className="text-green-500">Enviados: <strong>{c.sent_count}</strong></span>
                <span className="text-destructive">Erros: <strong>{c.error_count}</strong></span>
              </div>
            </button>
            <div className="flex items-center gap-2">
              {c.status === "running" || c.status === "scheduled" ? (
                <button onClick={() => updateStatus(c.id, "paused")} className="p-2 hover:bg-secondary/40 rounded" title="Pausar"><Pause size={14} /></button>
              ) : c.status === "paused" ? (
                <button onClick={() => updateStatus(c.id, "scheduled")} className="p-2 hover:bg-secondary/40 rounded" title="Retomar"><Play size={14} /></button>
              ) : null}
              {c.status !== "cancelled" && c.status !== "done" && (
                <button onClick={() => updateStatus(c.id, "cancelled")} className="p-2 hover:bg-secondary/40 rounded text-destructive" title="Cancelar"><Ban size={14} /></button>
              )}
              <button onClick={() => remove(c.id)} className="p-2 hover:bg-secondary/40 rounded text-destructive" title="Excluir"><Trash2 size={14} /></button>
              <button onClick={() => setSelectedId(c.id)} className="p-2 hover:bg-secondary/40 rounded"><ChevronRight size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      <NewCampaignDialog open={openNew} onClose={() => setOpenNew(false)} onCreated={load} />
    </div>
  );
}
