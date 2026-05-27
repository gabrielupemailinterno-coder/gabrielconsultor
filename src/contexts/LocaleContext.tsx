import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Locale = "pt" | "en";

const STORAGE_KEY = "gv_locale";
const USD_RATE = 5.0; // R$ por USD — ajustar se a cotação variar muito

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  /** Converte um valor em BRL e devolve string formatada conforme locale */
  formatPrice: (brl: number) => string;
  /** Símbolo da moeda corrente */
  currencySymbol: string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function detectInitialLocale(): Locale {
  if (typeof window === "undefined") return "pt";
  const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
  if (saved === "pt" || saved === "en") return saved;
  const nav = (navigator.language || "pt").toLowerCase();
  return nav.startsWith("pt") ? "pt" : "en";
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("pt");

  useEffect(() => {
    setLocaleState(detectInitialLocale());
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale === "pt" ? "pt-BR" : "en";
    }
  }, [locale]);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  };

  const formatPrice = (brl: number) => {
    if (locale === "pt") {
      return `R$ ${brl.toLocaleString("pt-BR")}`;
    }
    const usd = Math.round(brl / USD_RATE);
    return `USD ${usd.toLocaleString("en-US")}`;
  };

  const currencySymbol = locale === "pt" ? "R$" : "USD";

  return (
    <LocaleContext.Provider value={{ locale, setLocale, formatPrice, currencySymbol }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used inside <LocaleProvider>");
  return ctx;
}

/** Helper: dado um par {pt, en}, retorna o valor do locale atual. */
export function useT() {
  const { locale } = useLocale();
  return function t<T>(dict: { pt: T; en: T }): T {
    return dict[locale];
  };
}
