import { useLocation } from "react-router-dom";
import { useLocale } from "@/contexts/LocaleContext";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "floating" | "inline";

interface Props {
  variant?: Variant;
  className?: string;
}

const LanguageSwitcher = ({ variant, className }: Props) => {
  const { locale, setLocale } = useLocale();
  const { pathname } = useLocation();

  // Auto: hide global floating on /app (AppHeader renders inline variant)
  if (!variant && pathname.startsWith("/app")) return null;

  const isInline = variant === "inline";

  const containerClass = isInline
    ? "inline-flex items-center gap-0.5 h-8 rounded-md border border-border/60 bg-muted/40 p-0.5"
    : "fixed top-4 right-4 z-40 inline-flex items-center gap-0.5 h-9 rounded-full border border-border/60 bg-card/90 backdrop-blur px-1 shadow-sm";

  const btnBase =
    "text-[11px] font-sans font-semibold tracking-wider uppercase h-7 px-2 rounded transition-colors";

  return (
    <div className={cn(containerClass, className)} role="group" aria-label="Idioma">
      <Globe
        size={12}
        className={cn(
          "mx-1 opacity-60",
          isInline ? "text-muted-foreground" : "text-muted-foreground"
        )}
        strokeWidth={2}
      />
      <button
        type="button"
        onClick={() => setLocale("pt")}
        aria-label="Português"
        aria-pressed={locale === "pt"}
        className={cn(
          btnBase,
          locale === "pt"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        PT
      </button>
      <button
        type="button"
        onClick={() => setLocale("en")}
        aria-label="English"
        aria-pressed={locale === "en"}
        className={cn(
          btnBase,
          locale === "en"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        EN
      </button>
    </div>
  );
};

export default LanguageSwitcher;
