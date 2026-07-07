import { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  delta?: { value: number; suffix?: string };
  accent?: boolean;
}

export default function KpiCard({ icon: Icon, label, value, sub, delta, accent }: Props) {
  const positive = delta && delta.value >= 0;
  return (
    <div
      className={`bg-card border rounded-lg p-4 transition hover:border-primary/40 ${accent ? "border-primary/40" : "border-border"}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <Icon size={16} className="text-primary" />
      </div>
      <div className="font-serif text-3xl leading-none tabular-nums">{value}</div>
      <div className="mt-2 flex items-center gap-2 text-xs">
        {delta && (
          <span
            className={`px-1.5 py-0.5 rounded font-mono ${positive ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"}`}
          >
            {positive ? "+" : ""}
            {delta.value}
            {delta.suffix || ""}
          </span>
        )}
        {sub && <span className="text-muted-foreground truncate">{sub}</span>}
      </div>
    </div>
  );
}
