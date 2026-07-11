import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Eye, MousePointerClick, Users, TrendingUp } from "lucide-react";

type CampaignDef = {
  key: string;
  name: string;
  description: string;
  path: string;
  ctaLabels: string[];
};

const CAMPAIGNS: CampaignDef[] = [
  {
    key: "contagem",
    name: "Contagem — Lançamento Score",
    description: "Página /contagem com CTA para o grupo do WhatsApp.",
    path: "/contagem",
    ctaLabels: ["Entrar no grupo do WhatsApp"],
  },
];

type Stats = {
  visits: number;
  uniqueSessions: number;
  ctaClicks: number;
  conversion: number;
  recentVisits: { created_at: string; referrer: string | null; session_id: string }[];
  recentClicks: { created_at: string; element_label: string | null; session_id: string }[];
};

export default function CampaignsAdmin() {
  const [selected, setSelected] = useState<CampaignDef>(CAMPAIGNS[0]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [visitsRes, clicksRes] = await Promise.all([
        supabase
          .from("page_visits")
          .select("session_id, referrer, created_at")
          .eq("path", selected.path)
          .order("created_at", { ascending: false })
          .limit(1000),
        supabase
          .from("page_clicks")
          .select("session_id, element_type, element_label, created_at")
          .eq("path", selected.path)
          .order("created_at", { ascending: false })
          .limit(1000),
      ]);

      const visits = visitsRes.data || [];
      const clicks = (clicksRes.data || []).filter((c: any) =>
        c.element_type === "cta_whatsapp_group" || selected.ctaLabels.includes(c.element_label || "")
      );
      const uniqueSessions = new Set(visits.map((v: any) => v.session_id)).size;
      const ctaClicks = clicks.length;
      const conversion = uniqueSessions > 0 ? (ctaClicks / uniqueSessions) * 100 : 0;

      setStats({
        visits: visits.length,
        uniqueSessions,
        ctaClicks,
        conversion,
        recentVisits: visits.slice(0, 20) as any,
        recentClicks: clicks.slice(0, 20) as any,
      });
      setLoading(false);
    })();
  }, [selected]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {CAMPAIGNS.map((c) => (
          <button
            key={c.key}
            onClick={() => setSelected(c)}
            className={
              "px-3 py-2 rounded-md text-sm border transition-colors " +
              (selected.key === c.key
                ? "bg-primary/15 text-primary border-primary/30"
                : "border-border text-muted-foreground hover:text-foreground")
            }
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="text-sm text-muted-foreground">
        {selected.description} <span className="font-mono text-xs">({selected.path})</span>
      </div>

      {loading || !stats ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Kpi icon={<Eye className="h-4 w-4" />} label="Acessos" value={stats.visits} />
            <Kpi icon={<Users className="h-4 w-4" />} label="Sessões únicas" value={stats.uniqueSessions} />
            <Kpi icon={<MousePointerClick className="h-4 w-4" />} label="Cliques no grupo" value={stats.ctaClicks} />
            <Kpi
              icon={<TrendingUp className="h-4 w-4" />}
              label="Conversão"
              value={`${stats.conversion.toFixed(1)}%`}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Section title="Últimos acessos">
              {stats.recentVisits.length === 0 ? (
                <Empty>Sem visitas ainda.</Empty>
              ) : (
                <ul className="divide-y divide-border text-sm">
                  {stats.recentVisits.map((v, i) => (
                    <li key={i} className="py-2 flex justify-between gap-3">
                      <span className="whitespace-nowrap text-muted-foreground">
                        {new Date(v.created_at).toLocaleString("pt-BR")}
                      </span>
                      <span className="truncate text-xs text-muted-foreground/80">
                        {v.referrer || "direto"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title="Últimos cliques no grupo do WhatsApp">
              {stats.recentClicks.length === 0 ? (
                <Empty>Sem cliques ainda.</Empty>
              ) : (
                <ul className="divide-y divide-border text-sm">
                  {stats.recentClicks.map((c, i) => (
                    <li key={i} className="py-2 flex justify-between gap-3">
                      <span className="whitespace-nowrap text-muted-foreground">
                        {new Date(c.created_at).toLocaleString("pt-BR")}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground/70">
                        {c.session_id.slice(0, 8)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>
        </>
      )}
    </div>
  );
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="border border-border rounded-lg p-4 bg-card">
      <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold font-mono">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-border rounded-lg p-4 bg-card">
      <h3 className="text-sm font-semibold mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="text-sm text-muted-foreground py-6 text-center">{children}</div>;
}
