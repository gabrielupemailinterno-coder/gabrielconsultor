import { useState } from "react";
import { Mail, Phone, Building2, Trash2 } from "lucide-react";
import InviteMenteeDialog from "@/components/admin/InviteMenteeDialog";
import { FORM_LABELS, type FormType } from "@/lib/qualifying-forms";

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
};

const badgeColor: Record<FormType, string> = {
  contato: "bg-muted text-muted-foreground border-border",
  mentoria_1a1_vendedores: "bg-primary/15 text-primary border-primary/30",
  consultoria_operacional: "bg-accent/15 text-accent border-accent/30",
  mentoria_estrategica: "bg-secondary text-foreground border-border",
};

interface Props {
  leads: Lead[];
  onDelete: (id: string) => void;
}

export default function LeadsTable({ leads, onDelete }: Props) {
  const [filter, setFilter] = useState<FormType | "all">("all");
  const types: Array<FormType | "all"> = [
    "all",
    "contato",
    "mentoria_1a1_vendedores",
    "consultoria_operacional",
    "mentoria_estrategica",
  ];
  const counts = leads.reduce(
    (acc, l) => {
      acc[l.form_type] = (acc[l.form_type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  const filtered = filter === "all" ? leads : leads.filter((l) => l.form_type === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {types.map((t) => {
          const label = t === "all" ? "Todos" : FORM_LABELS[t];
          const count = t === "all" ? leads.length : counts[t] || 0;
          const active = filter === t;
          return (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3.5 py-1.5 text-xs rounded-full border transition-colors ${active ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50"}`}
            >
              {label} <span className="opacity-70">({count})</span>
            </button>
          );
        })}
      </div>
      {filtered.length === 0 && (
        <p className="text-muted-foreground text-sm">Nenhum cadastro neste filtro.</p>
      )}
      {filtered.map((l) => (
        <div key={l.id} className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-3 flex-wrap">
                <h3 className="font-serif text-lg">{l.name}</h3>
                <span
                  className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeColor[l.form_type] || badgeColor.contato}`}
                >
                  {FORM_LABELS[l.form_type] || l.form_type}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(l.created_at).toLocaleString("pt-BR")}
                </span>
              </div>
              <div className="grid md:grid-cols-3 gap-2 mt-3 text-sm">
                <a
                  href={`mailto:${l.email}`}
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary"
                >
                  <Mail size={14} /> {l.email}
                </a>
                <a
                  href={`tel:${l.phone}`}
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary"
                >
                  <Phone size={14} /> {l.phone}
                </a>
                {l.company_name && (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Building2 size={14} /> {l.company_name}
                  </span>
                )}
              </div>
              {l.answers && Object.keys(l.answers).length > 0 && (
                <div className="mt-3 grid sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                  {Object.entries(l.answers).map(([k, v]) => (
                    <div key={k} className="flex gap-2">
                      <span className="text-muted-foreground capitalize">
                        {k.replace(/_/g, " ")}:
                      </span>
                      <span className="text-foreground">
                        {Array.isArray(v) ? v.join(", ") : String(v)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {l.revenue && (
                <p className="text-sm mt-2">
                  <span className="text-muted-foreground">Faturamento:</span> {l.revenue}
                </p>
              )}
              {l.main_pain && !l.answers && (
                <p className="text-sm mt-2 text-muted-foreground italic">"{l.main_pain}"</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <InviteMenteeDialog
                triggerLabel="Virar mentorado"
                defaultName={l.name}
                defaultEmail={l.email}
                defaultPhone={l.phone}
                leadId={l.id}
              />
              <button
                onClick={() => onDelete(l.id)}
                className="text-muted-foreground hover:text-destructive transition"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
