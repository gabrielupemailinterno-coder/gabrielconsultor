import { useMemo, useState } from "react";
import { Mail, Phone, Building2, Trash2, Search, Users, ExternalLink } from "lucide-react";
import InviteMenteeDialog from "@/components/admin/InviteMenteeDialog";
import { FORM_LABELS, type FormType } from "@/lib/qualifying-forms";
import {
  LANDING_LABELS,
  PRODUCT_LABELS,
  LEAD_STATUS_LABELS,
  type LeadLandingPage,
  type LeadProductInterest,
} from "@/lib/leadOrigin";

export type Lead = {
  id: string;
  name: string;
  phone: string;
  email: string;
  company_name: string | null;
  revenue: string | null;
  main_pain: string | null;
  created_at: string;
  form_type: FormType;
  answers: Record<string, string | string[]> | null;
  landing_page: string | null;
  product_interest: string | null;
  source_path: string | null;
  source: string | null;
  status: string | null;
  partner_code: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
};

type LandingFilter = LeadLandingPage | "all" | "outros";
type ProductFilter = LeadProductInterest | "all" | "outros";
type StatusFilter = "all" | "new" | "contacted" | "qualified" | "converted" | "lost";
type PeriodFilter = "all" | "today" | "7d" | "30d";

const LANDING_OPTIONS: LandingFilter[] = [
  "all",
  "site_principal",
  "mentoria_comercial",
  "score_comercial",
  "aci_del_rei",
  "parceiros",
  "outros",
];

const PRODUCT_OPTIONS: ProductFilter[] = [
  "all",
  "contato_geral",
  "mentoria_comercial",
  "score_comercial",
  "parceiros",
  "consultoria_operacional",
  "mentoria_estrategica",
];

const STATUS_OPTIONS: StatusFilter[] = [
  "all",
  "new",
  "contacted",
  "qualified",
  "converted",
  "lost",
];

const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: "all", label: "Tudo" },
  { value: "today", label: "Hoje" },
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
];

const landingBadgeColor: Record<string, string> = {
  site_principal: "bg-muted text-muted-foreground border-border",
  mentoria_comercial: "bg-primary/15 text-primary border-primary/30",
  score_comercial: "bg-accent/15 text-accent border-accent/30",
  aci_del_rei: "bg-secondary text-foreground border-border",
  parceiros: "bg-primary/10 text-foreground border-primary/20",
  outros: "bg-muted text-muted-foreground border-border",
};

const statusBadgeColor: Record<string, string> = {
  new: "bg-primary/10 text-primary border-primary/30",
  contacted: "bg-accent/15 text-accent border-accent/30",
  qualified: "bg-secondary text-foreground border-border",
  converted: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  lost: "bg-destructive/10 text-destructive border-destructive/30",
};

const normLanding = (l: string | null | undefined): string =>
  l && LANDING_LABELS[l as LeadLandingPage] ? l : "outros";

const normProduct = (p: string | null | undefined): string =>
  p && PRODUCT_LABELS[p as LeadProductInterest] ? p : "outros";

interface Props {
  leads: Lead[];
  onDelete: (id: string) => void;
}

export default function LeadsTable({ leads, onDelete }: Props) {
  const [landing, setLanding] = useState<LandingFilter>("all");
  const [product, setProduct] = useState<ProductFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const now = Date.now();
  const periodCutoff = useMemo(() => {
    if (period === "today") {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    }
    if (period === "7d") return now - 7 * 24 * 3600 * 1000;
    if (period === "30d") return now - 30 * 24 * 3600 * 1000;
    return 0;
  }, [period, now]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((l) => {
      if (landing !== "all" && normLanding(l.landing_page) !== landing) return false;
      if (product !== "all" && normProduct(l.product_interest) !== product) return false;
      if (status !== "all" && (l.status || "new") !== status) return false;
      if (periodCutoff && new Date(l.created_at).getTime() < periodCutoff) return false;
      if (q) {
        const hay = [l.name, l.email, l.phone, l.company_name, l.partner_code]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [leads, landing, product, status, periodCutoff, search]);

  const summary = useMemo(() => {
    const byLanding: Record<string, number> = {};
    let last7 = 0;
    let withPartner = 0;
    const cutoff7 = now - 7 * 24 * 3600 * 1000;
    for (const l of leads) {
      const key = normLanding(l.landing_page);
      byLanding[key] = (byLanding[key] || 0) + 1;
      if (new Date(l.created_at).getTime() >= cutoff7) last7++;
      if (l.partner_code) withPartner++;
    }
    return { byLanding, last7, withPartner, total: leads.length };
  }, [leads, now]);

  const cards = [
    { label: "Total", value: summary.total, key: "all" as LandingFilter },
    { label: "Mentoria Comercial", value: summary.byLanding.mentoria_comercial || 0, key: "mentoria_comercial" as LandingFilter },
    { label: "Score Comercial", value: summary.byLanding.score_comercial || 0, key: "score_comercial" as LandingFilter },
    { label: "ACI Del Rei", value: summary.byLanding.aci_del_rei || 0, key: "aci_del_rei" as LandingFilter },
    { label: "Site principal", value: summary.byLanding.site_principal || 0, key: "site_principal" as LandingFilter },
    { label: "Parceiros", value: summary.byLanding.parceiros || 0, key: "parceiros" as LandingFilter },
    { label: "Últimos 7 dias", value: summary.last7, key: null as LandingFilter | null },
    { label: "Com parceiro", value: summary.withPartner, key: null as LandingFilter | null },
  ];

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {cards.map((c) => {
          const active = c.key && landing === c.key;
          return (
            <button
              key={c.label}
              disabled={!c.key}
              onClick={() => c.key && setLanding(c.key)}
              className={`text-left rounded-lg border p-3 transition-colors ${
                c.key ? "hover:border-primary/50 cursor-pointer" : "cursor-default"
              } ${active ? "border-primary bg-primary/5" : "border-border bg-card"}`}
            >
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {c.label}
              </div>
              <div className="text-xl font-serif mt-1">{c.value}</div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, email, telefone, empresa ou parceiro..."
            className="w-full h-10 pl-9 pr-3 text-sm bg-card border border-border rounded-md focus:outline-none focus:border-primary/60"
          />
        </div>

        <FilterRow label="Origem">
          {LANDING_OPTIONS.map((opt) => (
            <Chip
              key={opt}
              active={landing === opt}
              onClick={() => setLanding(opt)}
              label={opt === "all" ? "Todos" : LANDING_LABELS[opt as keyof typeof LANDING_LABELS]}
            />
          ))}
        </FilterRow>

        <FilterRow label="Produto">
          {PRODUCT_OPTIONS.map((opt) => (
            <Chip
              key={opt}
              active={product === opt}
              onClick={() => setProduct(opt)}
              label={opt === "all" ? "Todos" : PRODUCT_LABELS[opt as keyof typeof PRODUCT_LABELS]}
            />
          ))}
        </FilterRow>

        <div className="flex flex-wrap gap-4">
          <FilterRow label="Status">
            {STATUS_OPTIONS.map((opt) => (
              <Chip
                key={opt}
                active={status === opt}
                onClick={() => setStatus(opt)}
                label={opt === "all" ? "Todos" : LEAD_STATUS_LABELS[opt]}
              />
            ))}
          </FilterRow>

          <FilterRow label="Período">
            {PERIOD_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                active={period === opt.value}
                onClick={() => setPeriod(opt.value)}
                label={opt.label}
              />
            ))}
          </FilterRow>
        </div>
      </div>

      {/* Table */}
      <div className="text-xs text-muted-foreground">
        {filtered.length} de {leads.length} lead{leads.length === 1 ? "" : "s"}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <Users className="mx-auto h-8 w-8 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">
            Nenhum lead nesse recorte. Ajuste os filtros ou aguarde novas captações.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden bg-card">
          <div className="hidden lg:grid grid-cols-[1.6fr_1.4fr_1fr_1fr_0.9fr_1fr_0.8fr] gap-3 px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border bg-muted/30">
            <div>Nome / Contato</div>
            <div>Origem</div>
            <div>Interesse</div>
            <div>Status</div>
            <div>Parceiro</div>
            <div>Campanha</div>
            <div className="text-right">Data</div>
          </div>
          <ul className="divide-y divide-border">
            {filtered.map((l) => {
              const landingKey = normLanding(l.landing_page);
              const productKey = normProduct(l.product_interest);
              const st = l.status || "new";
              const isOpen = expanded === l.id;
              return (
                <li key={l.id} className="text-sm">
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : l.id)}
                    className="w-full text-left grid grid-cols-1 lg:grid-cols-[1.6fr_1.4fr_1fr_1fr_0.9fr_1fr_0.8fr] gap-3 px-4 py-3 hover:bg-muted/40 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="font-medium truncate">{l.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{l.email || l.phone}</div>
                    </div>
                    <div>
                      <span
                        className={`inline-block text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${landingBadgeColor[landingKey]}`}
                      >
                        {LANDING_LABELS[landingKey as keyof typeof LANDING_LABELS]}
                      </span>
                      {l.source_path && (
                        <div className="text-[10px] text-muted-foreground mt-1 font-mono truncate">
                          {l.source_path}
                        </div>
                      )}
                    </div>
                    <div className="text-xs">
                      {PRODUCT_LABELS[productKey as keyof typeof PRODUCT_LABELS]}
                    </div>
                    <div>
                      <span
                        className={`inline-block text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusBadgeColor[st] || statusBadgeColor.new}`}
                      >
                        {LEAD_STATUS_LABELS[st] || st}
                      </span>
                    </div>
                    <div className="text-xs font-mono truncate">
                      {l.partner_code || <span className="text-muted-foreground">—</span>}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {l.utm_campaign || l.utm_source || <span className="opacity-60">—</span>}
                    </div>
                    <div className="text-xs text-muted-foreground lg:text-right">
                      {new Date(l.created_at).toLocaleDateString("pt-BR")}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="bg-muted/30 border-t border-border px-4 py-4 space-y-3">
                      <div className="grid md:grid-cols-3 gap-3 text-sm">
                        <a href={`mailto:${l.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary">
                          <Mail size={14} /> {l.email || "—"}
                        </a>
                        <a href={`tel:${l.phone}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary">
                          <Phone size={14} /> {l.phone || "—"}
                        </a>
                        {l.company_name && (
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <Building2 size={14} /> {l.company_name}
                          </span>
                        )}
                      </div>

                      <div className="grid md:grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                        <Field label="Landing" value={LANDING_LABELS[landingKey as keyof typeof LANDING_LABELS]} />
                        <Field label="Produto" value={PRODUCT_LABELS[productKey as keyof typeof PRODUCT_LABELS]} />
                        <Field label="Formulário" value={FORM_LABELS[l.form_type] || l.form_type} />
                        <Field label="Página" value={l.source_path || l.source || "—"} mono />
                        <Field label="Parceiro" value={l.partner_code || "—"} mono />
                        <Field label="UTM source" value={l.utm_source || "—"} />
                        <Field label="UTM medium" value={l.utm_medium || "—"} />
                        <Field label="UTM campaign" value={l.utm_campaign || "—"} />
                        <Field label="Recebido em" value={new Date(l.created_at).toLocaleString("pt-BR")} />
                        {l.revenue && <Field label="Faturamento" value={l.revenue} />}
                      </div>

                      {l.main_pain && (
                        <div className="text-sm text-muted-foreground italic border-l-2 border-primary/40 pl-3">
                          "{l.main_pain}"
                        </div>
                      )}

                      {l.answers && Object.keys(l.answers).length > 0 && (
                        <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
                          {Object.entries(l.answers).map(([k, v]) => (
                            <div key={k} className="flex gap-2">
                              <span className="text-muted-foreground capitalize">{k.replace(/_/g, " ")}:</span>
                              <span className="text-foreground">{Array.isArray(v) ? v.join(", ") : String(v)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-2">
                        <InviteMenteeDialog
                          triggerLabel="Virar mentorado"
                          defaultName={l.name}
                          defaultEmail={l.email}
                          defaultPhone={l.phone}
                          leadId={l.id}
                        />
                        {l.source_path && (
                          <a
                            href={l.source_path}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-2.5 py-1.5"
                          >
                            <ExternalLink size={12} /> Abrir página
                          </a>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(l.id);
                          }}
                          className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive border border-border rounded-md px-2.5 py-1.5"
                        >
                          <Trash2 size={12} /> Excluir
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground mr-1">
        {label}
      </span>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 text-[11px] rounded-full border transition-colors ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
      }`}
    >
      {label}
    </button>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex gap-2 min-w-0">
      <span className="text-muted-foreground shrink-0">{label}:</span>
      <span className={`truncate ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}
