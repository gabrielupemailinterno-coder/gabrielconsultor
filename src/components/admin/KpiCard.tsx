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
      className={`bg-card border rounded-xl p-4 transition-all hover:-translate-y-px hover:shadow-sm ${accent ? "border-primary/40 ring-1 ring-primary/10" : "border-border"}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
          {label}
        </span>
        <Icon size={14} className={accent ? "text-primary" : "text-muted-foreground"} />
      </div>
      <div className={`font-mono-data text-2xl leading-none tabular-nums ${accent ? "text-primary" : "text-foreground"}`}>
        {value}
      </div>
      <div className="mt-2 flex items-center gap-2 text-[11px]">
        {delta && (
          <span
            className={`px-1.5 py-0.5 rounded font-mono-data ${positive ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"}`}
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

