import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { notFoundCopy } from "@/locales/copy";

const NotFound = () => {
  const location = useLocation();
  const { locale } = useLocale();
  const c = notFoundCopy[locale];

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">{c.heading}</h1>
        <p className="mb-4 text-xl text-muted-foreground">{c.message}</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          {c.cta}
        </a>
      </div>
    </div>
  );
};

export default NotFound;
