import { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  label: string;
  description?: string;
  onClick: () => void;
}

export default function QuickAction({ icon: Icon, label, description, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="group text-left bg-card border border-border hover:border-primary/50 hover:bg-primary/5 transition rounded-lg p-4 flex items-start gap-3"
    >
      <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition">
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-tight">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
    </button>
  );
}
