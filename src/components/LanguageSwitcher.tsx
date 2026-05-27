import { useLocale } from "@/contexts/LocaleContext";
import { Globe } from "lucide-react";

const LanguageSwitcher = () => {
  const { locale, setLocale } = useLocale();

  return (
    <div className="fixed top-4 right-4 z-40 flex items-center gap-1 bg-card/90 backdrop-blur border border-primary/30 rounded-full px-2 py-1 shadow-lg">
      <Globe size={14} className="text-primary ml-1" strokeWidth={2} />
      <button
        type="button"
        onClick={() => setLocale("pt")}
        aria-label="Português"
        className={`text-[11px] font-sans font-semibold tracking-wider uppercase px-2 py-1 rounded-full transition-colors ${
          locale === "pt"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        PT
      </button>
      <button
        type="button"
        onClick={() => setLocale("en")}
        aria-label="English"
        className={`text-[11px] font-sans font-semibold tracking-wider uppercase px-2 py-1 rounded-full transition-colors ${
          locale === "en"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        EN
      </button>
    </div>
  );
};

export default LanguageSwitcher;
