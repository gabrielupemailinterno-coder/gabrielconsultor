import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Eye, MousePointerClick, Users, TrendingUp } from "lucide-react";

type CampaignDef = {
  key: string;
  name: string;
  description: string;
  pathPrefix: string; // ex: "/contagem"
  ctaType: string;    // ex: "cta_whatsapp_group"
  variants: { id: string; headline: string }[];
};

const CAMPAIGNS: CampaignDef[] = [
  {
    key: "contagem-p1",
    name: "Contagem — Parte 1 (A/B/C/D/E)",
    description: "Teste A/B/C/D/E de headlines em /contagem. Variante sorteada por sessão. (Encerrada — dados históricos.)",
    pathPrefix: "/contagem",
    ctaType: "cta_whatsapp_group",
    variants: [
      { id: "A", headline: "Vendedor sem rotina não tem resultado." },
      { id: "B", headline: "Quem não mede, não bate meta." },
      { id: "C", headline: "Meta não se bate no dia 28." },
      { id: "D", headline: "Pare de vender no escuro." },
      { id: "E", headline: "Disciplina vende mais que talento." },
    ],
  },
  {
    key: "contagem-p2",
    name: "Contagem — Parte 2 (Redirect Score)",
    description: "Página /contagem redireciona direto para o WhatsApp do Score comercial. Em execução.",
    pathPrefix: "/contagem",
    ctaType: "cta_whatsapp_score",
    variants: [
      { id: "P2", headline: "Redirect direto → WhatsApp Score comercial" },
    ],
  },
];

type VisitRow = { session_id: string; path: string; referrer: string | null; created_at: string };
type ClickRow = { session_id: string; path: string; element_type: string | null; element_label: string | null; created_at: string };

type VariantStats = {
  id: string;
  headline: string;
  visits: number;
  uniqueSessions: number;
  clicks: number;
  conversion: number;
};

type Stats = {
  totalVisits: number;
  totalSessions: number;
  totalClicks: number;
  totalConversion: number;
  perVariant: VariantStats[];
  recentClicks: ClickRow[];
};

function variantFromPath(path: string): string {
  const m = path.match(/[?&]v=([^&]+)/);
  return m ? m[1] : "?";
}

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
          .select("session_id, path, referrer, created_at")
          .like("path", `${selected.pathPrefix}%`)
          .order("created_at", { ascending: false })
          .limit(5000),
        supabase
          .from("page_clicks")
          .select("session_id, path, element_type, element_label, created_at")
          .like("path", `${selected.pathPrefix}%`)
          .order("created_at", { ascending: false })
          .limit(5000),
      ]);

      const validIds = new Set(selected.variants.map((v) => v.id));
      const visits = ((visitsRes.data || []) as VisitRow[]).filter((x) =>
        validIds.has(variantFromPath(x.path)),
      );
      const clicks = ((clicksRes.data || []) as ClickRow[]).filter(
        (c) => c.element_type === selected.ctaType && validIds.has(variantFromPath(c.path)),
      );

      const perVariant: VariantStats[] = selected.variants.map((v) => {
        const vs = visits.filter((x) => variantFromPath(x.path) === v.id);
        const cs = clicks.filter((x) => variantFromPath(x.path) === v.id);
        const uniq = new Set(vs.map((x) => x.session_id)).size;
        const clickCount = cs.length;
        return {
          id: v.id,
          headline: v.headline,
          visits: vs.length,
          uniqueSessions: uniq,
          clicks: clickCount,
          conversion: uniq > 0 ? (clickCount / uniq) * 100 : 0,
        };
      });

      const totalSessions = new Set(visits.map((v) => v.session_id)).size;
      const totalClicks = clicks.length;

      setStats({
        totalVisits: visits.length,
        totalSessions,
        totalClicks,
        totalConversion: totalSessions > 0 ? (totalClicks / totalSessions) * 100 : 0,
        perVariant,
        recentClicks: clicks.slice(0, 20),
      });
      setLoading(false);
    })();
  }, [selected]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-xs uppercase tracking-wider text-muted-foreground">Campanha</label>
        <select
          value={selected.key}
          onChange={(e) => {
            const next = CAMPAIGNS.find((c) => c.key === e.target.value);
            if (next) setSelected(next);
          }}
          className="px-3 py-2 rounded-md text-sm bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          {CAMPAIGNS.map((c) => (
            <option key={c.key} value={c.key}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="text-sm text-muted-foreground">
        {selected.description} <span className="font-mono text-xs">({selected.pathPrefix})</span>
      </div>

      {loading || !stats ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Kpi icon={<Eye className="h-4 w-4" />} label="Acessos totais" value={stats.totalVisits} />
            <Kpi icon={<Users className="h-4 w-4" />} label="Sessões únicas" value={stats.totalSessions} />
            <Kpi icon={<MousePointerClick className="h-4 w-4" />} label="Cliques no grupo" value={stats.totalClicks} />
            <Kpi icon={<TrendingUp className="h-4 w-4" />} label="Conversão" value={`${stats.totalConversion.toFixed(1)}%`} />
          </div>

          <div className="border border-border rounded-lg bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold">Desempenho por headline (A/B test)</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Cada sessão vê uma variante sorteada. A melhor conversão indica a headline vencedora.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-muted-foreground tracking-wider bg-muted/30">
                  <tr>
                    <th className="text-left px-4 py-2">Var</th>
                    <th className="text-left px-4 py-2">Headline</th>
                    <th className="text-right px-4 py-2">Acessos</th>
                    <th className="text-right px-4 py-2">Sessões</th>
                    <th className="text-right px-4 py-2">Cliques</th>
                    <th className="text-right px-4 py-2">Conversão</th>
                  </tr>
                </thead>
                <tbody>
                  {[...stats.perVariant]
                    .sort((a, b) => b.conversion - a.conversion)
                    .map((v) => {
                      const isWinner =
                        v.uniqueSessions >= 5 &&
                        v.conversion === Math.max(...stats.perVariant.map((x) => x.conversion));
                      return (
                        <tr key={v.id} className="border-t border-border">
                          <td className="px-4 py-3 font-mono font-semibold">
                            <span className={isWinner ? "text-primary" : ""}>{v.id}</span>
                          </td>
                          <td className="px-4 py-3">{v.headline}</td>
                          <td className="px-4 py-3 text-right font-mono">{v.visits}</td>
                          <td className="px-4 py-3 text-right font-mono">{v.uniqueSessions}</td>
                          <td className="px-4 py-3 text-right font-mono">{v.clicks}</td>
                          <td className={"px-4 py-3 text-right font-mono " + (isWinner ? "text-primary font-semibold" : "")}>
                            {v.conversion.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="border border-border rounded-lg p-4 bg-card">
            <h3 className="text-sm font-semibold mb-3">Últimos cliques no grupo do WhatsApp</h3>
            {stats.recentClicks.length === 0 ? (
              <div className="text-sm text-muted-foreground py-6 text-center">Sem cliques ainda.</div>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {stats.recentClicks.map((c, i) => (
                  <li key={i} className="py-2 flex justify-between gap-3">
                    <span className="whitespace-nowrap text-muted-foreground">
                      {new Date(c.created_at).toLocaleString("pt-BR")}
                    </span>
                    <span className="font-mono text-xs">
                      var <span className="text-primary">{variantFromPath(c.path)}</span>
                      <span className="text-muted-foreground/60"> · {c.session_id.slice(0, 8)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
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
