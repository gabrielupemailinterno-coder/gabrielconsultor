import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Play, MessageSquare, HelpCircle, GitBranch, Zap, Flag } from "lucide-react";

const CONFIG: Record<string, { color: string; icon: any; label: string }> = {
  trigger: { color: "bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300", icon: Play, label: "Início" },
  message: { color: "bg-sky-500/15 border-sky-500/40 text-sky-700 dark:text-sky-300", icon: MessageSquare, label: "Mensagem" },
  question: { color: "bg-primary/15 border-primary/40 text-primary", icon: HelpCircle, label: "Pergunta" },
  condition: { color: "bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300", icon: GitBranch, label: "Condição" },
  action: { color: "bg-violet-500/15 border-violet-500/40 text-violet-700 dark:text-violet-300", icon: Zap, label: "Ação" },
  end: { color: "bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-300", icon: Flag, label: "Fim" },
};

const BotFlowNode = ({ data, type, selected }: NodeProps) => {
  const cfg = CONFIG[type as string] || CONFIG.message;
  const Icon = cfg.icon;
  const preview: string =
    data.prompt || data.text || data.message ||
    (data.action ? `→ ${data.action}` : "") ||
    (data.field ? `campo: ${data.field}` : "");

  return (
    <div className={`min-w-[220px] max-w-[280px] border rounded-lg p-3 shadow-sm bg-card ${cfg.color} ${selected ? "ring-2 ring-primary" : ""}`}>
      <Handle type="target" position={Position.Top} className="!bg-muted-foreground" />
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} />
        <span className="text-[10px] uppercase tracking-wider font-semibold">{cfg.label}</span>
      </div>
      <div className="text-sm font-medium text-foreground truncate">{data.label || cfg.label}</div>
      {preview && (
        <div className="text-xs text-muted-foreground mt-1 line-clamp-2 whitespace-pre-wrap">{preview}</div>
      )}
      {type === "condition" ? (
        <>
          <Handle id="true" type="source" position={Position.Bottom} style={{ left: "30%" }} className="!bg-emerald-500" />
          <Handle id="false" type="source" position={Position.Bottom} style={{ left: "70%" }} className="!bg-rose-500" />
        </>
      ) : type === "end" ? null : (
        <Handle type="source" position={Position.Bottom} className="!bg-muted-foreground" />
      )}
    </div>
  );
};

export default memo(BotFlowNode);
