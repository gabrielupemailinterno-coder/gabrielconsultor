import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { notFoundCopy } from "@/locales/copy";
import SiteHeader from "@/components/SiteHeader";

const NotFound = () => {
  const location = useLocation();
  const { locale } = useLocale();
  const c = notFoundCopy[locale];

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 font-serif text-5xl">{c.heading}</h1>
          <p className="mb-6 text-lg text-muted-foreground">{c.message}</p>
          <a href="/" className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-5 py-2.5 rounded-full hover:bg-primary/90 transition-colors">
            {c.cta}
          </a>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
