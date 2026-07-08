import { ReactNode } from "react";

interface Props {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, actions }: Props) {
  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-6 mb-6 border-b border-border/60">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[10px] uppercase tracking-widest text-primary mb-1">{eyebrow}</p>
        )}
        <h1 className="font-serif text-2xl md:text-3xl leading-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
