import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { savePartnerRef } from "@/lib/partnerRef";

// GET /r/:slug — resolves the slug on the edge function, persists the ref,
// then hard-redirects to the destination with ?ref=CODE appended.
export default function RedirectPartnerLink() {
  const { slug } = useParams<{ slug: string }>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setError("Link inválido.");
      return;
    }
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("partner-track", {
          method: "GET" as any,
          body: undefined,
          // supabase-js doesn't allow custom query easily; call via fetch instead:
        } as any);
        // Fallback: use direct fetch since functions.invoke doesn't support GET query
        void data;
        void error;
      } catch {
        // ignore, we use fetch below
      }

      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined;
        const url = projectId
          ? `https://${projectId}.supabase.co/functions/v1/partner-track?slug=${encodeURIComponent(slug)}`
          : `/functions/v1/partner-track?slug=${encodeURIComponent(slug)}`;
        const res = await fetch(url, { method: "GET" });
        if (!res.ok) {
          setError("Link não encontrado ou inativo.");
          return;
        }
        const info = (await res.json()) as {
          link_id: string;
          partner_id: string;
          partner_code: string;
          destination: string;
        };
        savePartnerRef(info.partner_code);

        // Log the click (POST)
        try {
          const sessionId =
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : Math.random().toString(36).slice(2);
          await supabase.functions.invoke("partner-track", {
            body: {
              partner_code: info.partner_code,
              link_id: info.link_id,
              session_id: sessionId,
              destination: info.destination,
              referrer: document.referrer,
            },
          });
        } catch {
          // silent
        }

        const dest = info.destination.startsWith("http")
          ? info.destination
          : `${window.location.origin}${info.destination.startsWith("/") ? info.destination : "/" + info.destination}`;
        const sep = dest.includes("?") ? "&" : "?";
        window.location.replace(`${dest}${sep}ref=${encodeURIComponent(info.partner_code)}`);
      } catch (e: any) {
        setError(e?.message || "Falha ao redirecionar.");
      }
    })();
  }, [slug]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      {error ? (
        <div className="text-center">
          <p className="text-sm text-destructive mb-2">{error}</p>
          <a href="/" className="text-xs underline text-muted-foreground">Ir para o site</a>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="animate-spin" size={16} /> Redirecionando…
        </div>
      )}
    </div>
  );
}
