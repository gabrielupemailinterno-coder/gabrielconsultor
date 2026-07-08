import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface Props {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: Props) {
  return (
    <div
      className={
        "surface-elevated p-10 flex flex-col items-center justify-center text-center gap-3 " +
        (className || "")
      }
    >
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
      <div>
        <p className="font-serif text-lg">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground mt-1 max-w-md">{description}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
