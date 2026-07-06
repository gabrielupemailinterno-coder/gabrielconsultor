import { Node } from "reactflow";
import { X } from "lucide-react";

const FIELD_OPTIONS = [
  "ligacoes", "whatsapps", "prospeccoes", "contatos_efetivos",
  "reunioes_agendadas", "apresentacoes", "propostas", "vendas", "valor_vendido", "data",
];

const ACTION_OPTIONS = [
  { value: "set_date_today", label: "Definir data = hoje" },
  { value: "save_log", label: "Salvar log do dia" },
];

const VALIDATIONS = [
  { value: "number", label: "Número" },
  { value: "date_past_7", label: "Data (até 7 dias atrás)" },
  { value: "text", label: "Texto livre" },
];

type Props = {
  node: Node | null;
  onChange: (id: string, dataPatch: Record<string, any>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
};

export default function BotFlowSidebar({ node, onChange, onDelete, onClose }: Props) {
  if (!node) return null;
  const patch = (p: Record<string, any>) => onChange(node.id, p);
  const d = node.data as any;

  return (
    <aside className="w-80 border-l border-border bg-card p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-lg capitalize">{node.type}</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
      </div>

      <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">Rótulo</label>
      <input
        className="w-full mb-4 bg-background border border-border rounded px-3 py-2 text-sm"
        value={d.label || ""}
        onChange={(e) => patch({ label: e.target.value })}
      />

      {(node.type === "message" || node.type === "end") && (
        <>
          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">Mensagem</label>
          <textarea
            className="w-full mb-4 bg-background border border-border rounded px-3 py-2 text-sm min-h-[120px]"
            value={d.message || d.text || ""}
            onChange={(e) => patch({ message: e.target.value })}
            placeholder="Use {{primeiro_nome}}, {{data_br}}, {{score}}, {{score_label}}, {{streak_line}}"
          />
        </>
      )}

      {node.type === "question" && (
        <>
          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">Prompt (pergunta)</label>
          <textarea
            className="w-full mb-3 bg-background border border-border rounded px-3 py-2 text-sm min-h-[100px]"
            value={d.prompt || ""}
            onChange={(e) => patch({ prompt: e.target.value })}
          />
          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">Campo</label>
          <select
            className="w-full mb-3 bg-background border border-border rounded px-3 py-2 text-sm"
            value={d.field || ""}
            onChange={(e) => patch({ field: e.target.value })}
          >
            <option value="">—</option>
            {FIELD_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">Validação</label>
          <select
            className="w-full mb-3 bg-background border border-border rounded px-3 py-2 text-sm"
            value={d.validation || "text"}
            onChange={(e) => patch({ validation: e.target.value })}
          >
            {VALIDATIONS.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
          </select>
        </>
      )}

      {node.type === "action" && (
        <>
          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">Ação</label>
          <select
            className="w-full mb-4 bg-background border border-border rounded px-3 py-2 text-sm"
            value={d.action || ""}
            onChange={(e) => patch({ action: e.target.value })}
          >
            <option value="">—</option>
            {ACTION_OPTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
        </>
      )}

      {node.type === "condition" && (
        <>
          <p className="text-xs text-muted-foreground mb-2">Compara uma variável com um valor. Aresta "true" segue quando verdade.</p>
          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">Variável</label>
          <select
            className="w-full mb-3 bg-background border border-border rounded px-3 py-2 text-sm"
            value={d.field || ""}
            onChange={(e) => patch({ field: e.target.value })}
          >
            <option value="">—</option>
            {FIELD_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">Operador</label>
          <select
            className="w-full mb-3 bg-background border border-border rounded px-3 py-2 text-sm"
            value={d.op || "gt"}
            onChange={(e) => patch({ op: e.target.value })}
          >
            <option value="gt">maior que</option>
            <option value="lt">menor que</option>
            <option value="eq">igual a</option>
          </select>
          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">Valor</label>
          <input
            type="number"
            className="w-full mb-4 bg-background border border-border rounded px-3 py-2 text-sm"
            value={d.value ?? 0}
            onChange={(e) => patch({ value: Number(e.target.value) })}
          />
        </>
      )}

      {node.type !== "trigger" && (
        <button
          onClick={() => onDelete(node.id)}
          className="w-full mt-4 text-sm text-destructive border border-destructive/40 rounded px-3 py-2 hover:bg-destructive/10"
        >
          Excluir nó
        </button>
      )}
    </aside>
  );
}
