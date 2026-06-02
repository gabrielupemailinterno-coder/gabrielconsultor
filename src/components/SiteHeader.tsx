import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Calendar, Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetTitle,
} from "@/components/ui/sheet";
import { useLocale } from "@/contexts/LocaleContext";
import { trackClick } from "@/hooks/useAnalytics";
import monogramaFull from "@/assets/monograma-gv-full-tpn.png.asset.json";

const CALENDAR_URL = "https://calendar.app.google/1GgJUz3DD3KuznGMA";

type NavItem = { href: string; label: string };

const SiteHeader = () => {
  const { locale } = useLocale();
  const { pathname } = useLocation();
  const onHome = pathname === "/";
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY.current;
      if (y < 80) {
        setHidden(false);
      } else if (delta > 6) {
        // scrolling down → hide
        setHidden(true);
      } else if (delta < -6) {
        // scrolling up → show
        setHidden(false);
      }
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const sectionAnchor = (anchor: string) => (onHome ? `#${anchor}` : `/#${anchor}`);

  const navItems: NavItem[] = locale === "pt"
    ? [
        { href: sectionAnchor("sobre"), label: "Sobre" },
        { href: sectionAnchor("numeros"), label: "Cases" },
        { href: sectionAnchor("formacao"), label: "Formação" },
        { href: sectionAnchor("servicos"), label: "Serviços" },
        { href: sectionAnchor("pacotes"), label: "Pacotes" },
        { href: "/mentoria-profissional", label: "Mentoria" },
        { href: "/blog", label: "Blog" },
      ]
    : [
        { href: sectionAnchor("sobre"), label: "About" },
        { href: sectionAnchor("numeros"), label: "Cases" },
        { href: sectionAnchor("formacao"), label: "Training" },
        { href: sectionAnchor("servicos"), label: "Services" },
        { href: sectionAnchor("pacotes"), label: "Packages" },
        { href: "/mentoria-profissional", label: "Mentoring" },
        { href: "/blog", label: "Blog" },
      ];

  const ctaLabel = locale === "pt" ? "Agendar diagnóstico" : "Book a diagnostic";
  const openCalendar = () => {
    trackClick("cta", "header_calendar");
    window.open(CALENDAR_URL, "_blank", "noopener,noreferrer");
  };

  const renderNavLink = (it: NavItem, base: string) => {
    const isInternal = it.href.startsWith("/") && !it.href.startsWith("/#");
    if (isInternal) {
      return (
        <Link to={it.href} className={base}>
          {it.label}
        </Link>
      );
    }
    return (
      <a href={it.href} className={base}>
        {it.label}
      </a>
    );
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        hidden ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="relative">
        <div className="absolute inset-0 bg-background/55 backdrop-blur-2xl backdrop-saturate-150 border-b border-white/[0.06]" />
        <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-60" />
        <div className="container max-w-6xl relative flex items-center justify-between h-20 md:h-24">
          <Link
            to="/"
            aria-label="Gabriel Consultor"
            className="flex items-center transition-transform duration-300 hover:scale-[1.02]"
          >
            <img
              src={monogramaFull.url}
              alt="Gabriel Consultor"
              className="h-14 md:h-16 w-auto"
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.02] px-1.5 py-1">
            {navItems.map((it) =>
              renderNavLink(
                it,
                "px-3.5 py-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground rounded-full hover:bg-white/[0.06] transition-all duration-200"
              )
            )}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={openCalendar}
              className="hidden md:inline-flex items-center gap-2 bg-primary text-primary-foreground text-[13px] font-medium px-4 py-2 rounded-full hover:bg-primary/90 active:scale-[0.97] transition-all duration-200 shadow-[0_4px_14px_-2px_hsl(var(--primary)/0.45)]"
              data-track="header_cta"
            >
              <Calendar size={14} strokeWidth={2.25} />
              {ctaLabel}
            </button>
            <Sheet>
              <SheetTrigger asChild>
                <button
                  aria-label="Menu"
                  className="lg:hidden w-10 h-10 inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-foreground hover:bg-white/[0.08] transition-colors"
                >
                  <Menu size={18} />
                </button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[300px] bg-background/85 backdrop-blur-2xl border-l border-white/[0.06]"
              >
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <div className="flex flex-col gap-0.5 mt-10">
                  {navItems.map((it) => (
                    <SheetClose asChild key={it.href}>
                      {renderNavLink(
                        it,
                        "px-4 py-3 rounded-2xl text-[15px] font-medium text-foreground hover:bg-white/[0.06] transition-colors"
                      )}
                    </SheetClose>
                  ))}
                  <button
                    onClick={openCalendar}
                    className="mt-6 inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-4 py-3 rounded-full hover:bg-primary/90 active:scale-[0.98] transition-all shadow-[0_6px_20px_-4px_hsl(var(--primary)/0.5)]"
                  >
                    <Calendar size={14} />
                    {ctaLabel}
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default SiteHeader;
