import { useCallback, useEffect, useMemo, useState } from "react";
import ReactFlow, {
  addEdge, Background, Connection, Controls, Edge, MiniMap, Node,
  ReactFlowProvider, useEdgesState, useNodesState,
} from "reactflow";
import "reactflow/dist/style.css";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Plus, Save, Send } from "lucide-react";
import BotFlowNode from "./BotFlowNode";
import BotFlowSidebar from "./BotFlowSidebar";

const nodeTypes = { trigger: BotFlowNode, message: BotFlowNode, question: BotFlowNode, condition: BotFlowNode, action: BotFlowNode, end: BotFlowNode };

const NODE_TEMPLATES = [
  { type: "message", label: "Mensagem", data: { label: "Nova mensagem", message: "Escreva aqui..." } },
  { type: "question", label: "Pergunta", data: { label: "Pergunta", prompt: "Sua pergunta?", field: "ligacoes", validation: "number" } },
  { type: "condition", label: "Condição", data: { label: "Se...", field: "vendas", op: "gt", value: 0 } },
  { type: "action", label: "Ação", data: { label: "Ação", action: "save_log" } },
  { type: "end", label: "Fim", data: { label: "Fim", message: "Obrigado!" } },
];

type Flow = {
  id: string;
  name: string;
  description: string | null;
  triggers: string[];
  graph: { nodes: Node[]; edges: Edge[] };
  is_active: boolean;
  priority: number;
  version: number;
};

export default function BotFlowEditor({ flow, onBack }: { flow: Flow; onBack: () => void }) {
  const [name, setName] = useState(flow.name);
  const [triggers, setTriggers] = useState((flow.triggers || []).join(", "));
  const [isActive, setIsActive] = useState(flow.is_active);
  const [nodes, setNodes, onNodesChange] = useNodesState(flow.graph.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flow.graph.edges || []);
  const [selected, setSelected] = useState<Node | null>(null);
  const [saving, setSaving] = useState(false);
  const [testPhone, setTestPhone] = useState("");

  useEffect(() => {
    // aplica types nos nodes
    setNodes((nds) => nds.map((n) => ({ ...n, type: (n as any).type || (n.data as any)?.type || "message" })));
  }, []);

  const onConnect = useCallback((c: Connection) => setEdges((eds) => addEdge({ ...c, id: `e-${Date.now()}` }, eds)), [setEdges]);

  const addNode = (t: typeof NODE_TEMPLATES[number]) => {
    const id = `n_${Date.now()}`;
    setNodes((nds) => [...nds, { id, type: t.type, position: { x: 250, y: 100 + nds.length * 30 }, data: t.data } as Node]);
  };

  const updateNodeData = (id: string, patch: Record<string, any>) => {
    setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)));
    setSelected((s) => (s && s.id === id ? { ...s, data: { ...s.data, ...patch } } : s));
  };

  const deleteNode = (id: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    setSelected(null);
  };

  const save = async () => {
    setSaving(true);
    const graph = { nodes, edges } as any;
    const triggersArr = triggers.split(",").map((s) => s.trim()).filter(Boolean);
    await supabase.from("bot_flow_versions").insert({
      flow_id: flow.id, version: flow.version, graph, triggers: triggersArr as any,
    });
    const { error } = await supabase.from("bot_flows").update({
      name, triggers: triggersArr as any, graph, is_active: isActive, version: flow.version + 1,
    }).eq("id", flow.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Fluxo salvo");
  };

  const sendTest = async () => {
    if (!testPhone) { toast.error("Informe o telefone de teste"); return; }
    const { error } = await supabase.functions.invoke("bot-flow-test", { body: { flowId: flow.id, phone: testPhone, name: "Teste" } });
    if (error) toast.error(error.message);
    else toast.success("Teste enviado — confira o WhatsApp");
  };

  const rf = useMemo(() => (
    <ReactFlow
      nodes={nodes} edges={edges}
      onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
      onNodeClick={(_, n) => setSelected(n)}
      onPaneClick={() => setSelected(null)}
      fitView
    >
      <Background />
      <Controls />
      <MiniMap zoomable pannable />
    </ReactFlow>
  ), [nodes, edges, onNodesChange, onEdgesChange, onConnect]);

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-background">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-3 flex-1">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground"><ArrowLeft size={18} /></button>
          <input value={name} onChange={(e) => setName(e.target.value)}
            className="bg-transparent border-b border-transparent hover:border-border focus:border-primary outline-none text-lg font-serif px-1" />
          <label className="flex items-center gap-2 text-xs text-muted-foreground ml-4">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Ativo
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input placeholder="+55..." value={testPhone} onChange={(e) => setTestPhone(e.target.value)}
            className="text-sm bg-background border border-border rounded px-2 py-1.5 w-40" />
          <button onClick={sendTest} className="flex items-center gap-1.5 text-sm px-3 py-1.5 border border-border rounded hover:bg-secondary">
            <Send size={14} /> Testar
          </button>
          <button onClick={save} disabled={saving} className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-primary text-primary-foreground rounded">
            <Save size={14} /> {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>

      <div className="px-4 py-2 border-b border-border bg-card/50">
        <label className="text-xs uppercase tracking-wider text-muted-foreground">Gatilhos (separados por vírgula)</label>
        <input value={triggers} onChange={(e) => setTriggers(e.target.value)}
          className="w-full bg-transparent text-sm mt-1 outline-none" placeholder="registrar, quero registrar, score de hoje" />
      </div>

      <div className="flex" style={{ height: "70vh" }}>
        <div className="w-44 border-r border-border p-3 space-y-2 bg-card/40">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Adicionar nó</p>
          {NODE_TEMPLATES.map((t) => (
            <button key={t.type} onClick={() => addNode(t)}
              className="w-full flex items-center gap-2 text-sm px-2 py-1.5 border border-border rounded hover:bg-secondary text-left">
              <Plus size={12} /> {t.label}
            </button>
          ))}
        </div>
        <div className="flex-1 relative">
          <ReactFlowProvider>{rf}</ReactFlowProvider>
        </div>
        {selected && (
          <BotFlowSidebar node={selected} onChange={updateNodeData} onDelete={deleteNode} onClose={() => setSelected(null)} />
        )}
      </div>
    </div>
  );
}
