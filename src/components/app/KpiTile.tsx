import { LucideIcon } from "lucide-react";

interface Props {
  icon?: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}

export function KpiTile({ icon: Icon, label, value, sub, accent }: Props) {
  return (
    <div
      className={
        "surface-elevated surface-elevated-hover p-4 flex flex-col gap-2 " +
        (accent ? "ring-1 ring-primary/40" : "")
      }
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
      </div>
      <p className="font-serif text-2xl leading-none">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}
