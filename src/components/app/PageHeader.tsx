import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

export type Crumb = { label: string; to?: string };

interface Props {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumbs?: Crumb[];
}

export function PageHeader({ eyebrow, title, description, actions, breadcrumbs }: Props) {
  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-6 mb-6 border-b border-border/60">
      <div className="min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[11px] text-muted-foreground mb-2 flex-wrap">
            <Link to="/app" className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
              <Home className="h-3 w-3" /> App
            </Link>
            {breadcrumbs.map((c, i) => (
              <span key={i} className="inline-flex items-center gap-1">
                <ChevronRight className="h-3 w-3 opacity-60" />
                {c.to ? (
                  <Link to={c.to} className="hover:text-foreground transition-colors truncate max-w-[16ch]">
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-foreground truncate max-w-[24ch]">{c.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        {eyebrow && (
          <p className="text-[10px] uppercase tracking-widest text-primary mb-1">{eyebrow}</p>
        )}
        <h1 className="font-serif text-2xl md:text-3xl leading-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0 flex-wrap">{actions}</div>}
    </div>
  );
}
