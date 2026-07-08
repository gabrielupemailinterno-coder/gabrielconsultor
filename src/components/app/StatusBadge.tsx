type Tone = "success" | "warning" | "danger" | "neutral" | "info";

const styles: Record<Tone, string> = {
  success: "bg-emerald-500/12 text-emerald-400 border-emerald-500/25",
  warning: "bg-amber-500/12 text-amber-400 border-amber-500/25",
  danger: "bg-destructive/15 text-destructive border-destructive/30",
  info: "bg-sky-500/12 text-sky-400 border-sky-500/25",
  neutral: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span
      className={
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider " +
        styles[tone]
      }
    >
      {children}
    </span>
  );
}
