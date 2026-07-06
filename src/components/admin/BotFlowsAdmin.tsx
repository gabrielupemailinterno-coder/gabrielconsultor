import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, Edit, Plus, Trash2 } from "lucide-react";
import BotFlowEditor from "./BotFlowEditor";

type Flow = {
  id: string;
  name: string;
  description: string | null;
  triggers: string[];
  graph: any;
  is_active: boolean;
  priority: number;
  version: number;
  updated_at: string;
};

const EMPTY_GRAPH = {
  nodes: [
    { id: "start", type: "trigger", position: { x: 0, y: 0 }, data: { label: "Início" } },
    { id: "end", type: "end", position: { x: 0, y: 200 }, data: { label: "Fim", message: "Obrigado!" } },
  ],
  edges: [{ id: "e1", source: "start", target: "end" }],
};

export default function BotFlowsAdmin() {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [editing, setEditing] = useState<Flow | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("bot_flows").select("*").order("priority", { ascending: false });
    setFlows((data as any) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const createFlow = async () => {
    const name = prompt("Nome do fluxo?");
    if (!name) return;
    const { data, error } = await supabase.from("bot_flows").insert({
      name, triggers: [], graph: EMPTY_GRAPH, is_active: false, priority: 0,
    }).select().single();
    if (error) return toast.error(error.message);
    setEditing(data as any);
    load();
  };

  const duplicate = async (f: Flow) => {
    const { error } = await supabase.from("bot_flows").insert({
      name: `${f.name} (cópia)`, triggers: f.triggers, graph: f.graph, is_active: false, priority: f.priority,
    });
    if (error) toast.error(error.message); else { toast.success("Duplicado"); load(); }
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este fluxo?")) return;
    await supabase.from("bot_flows").delete().eq("id", id);
    load();
  };

  const toggleActive = async (f: Flow) => {
    await supabase.from("bot_flows").update({ is_active: !f.is_active }).eq("id", f.id);
    load();
  };

  if (editing) {
    return <BotFlowEditor flow={editing} onBack={() => { setEditing(null); load(); }} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl">Fluxos do bot WhatsApp</h2>
          <p className="text-sm text-muted-foreground">Edite os fluxos que o bot dispara quando o usuário fala com ele.</p>
        </div>
        <button onClick={createFlow} className="flex items-center gap-2 text-sm px-3 py-2 bg-primary text-primary-foreground rounded">
          <Plus size={14} /> Novo fluxo
        </button>
      </div>

      {loading ? <p className="text-sm text-muted-foreground">Carregando...</p> : flows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum fluxo. Crie o primeiro.</p>
      ) : (
        <div className="grid gap-3">
          {flows.map((f) => (
            <div key={f.id} className="border border-border rounded-lg p-4 bg-card flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-serif text-lg">{f.name}</h3>
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${f.is_active ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300" : "bg-muted border-border text-muted-foreground"}`}>
                    {f.is_active ? "Ativo" : "Rascunho"}
                  </span>
                  <span className="text-xs text-muted-foreground">v{f.version} · prioridade {f.priority}</span>
                </div>
                {f.description && <p className="text-sm text-muted-foreground mb-2">{f.description}</p>}
                <div className="flex flex-wrap gap-1">
                  {(f.triggers || []).map((t) => (
                    <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{t}</span>
                  ))}
                  {(!f.triggers || f.triggers.length === 0) && <span className="text-xs text-muted-foreground italic">sem gatilhos</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => toggleActive(f)} className="text-xs px-2 py-1 border border-border rounded hover:bg-secondary">
                  {f.is_active ? "Desativar" : "Ativar"}
                </button>
                <button onClick={() => setEditing(f)} className="text-muted-foreground hover:text-foreground p-2"><Edit size={16} /></button>
                <button onClick={() => duplicate(f)} className="text-muted-foreground hover:text-foreground p-2"><Copy size={16} /></button>
                <button onClick={() => remove(f.id)} className="text-muted-foreground hover:text-destructive p-2"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
