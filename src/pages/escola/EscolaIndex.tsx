import { Link } from "react-router-dom";
import { AppLayout } from "@/components/app/AppLayout";
import { PageHeader } from "@/components/app/PageHeader";
import { SectionCard } from "@/components/app/SectionCard";
import { StatusBadge } from "@/components/app/StatusBadge";
import { MODULOS, CATEGORIES } from "@/lib/escola-comercial/mock";
import { BookOpen, Lock, PlayCircle, Search } from "lucide-react";
import { useState } from "react";

export default function EscolaIndex() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string | null>(null);

  const filtered = MODULOS.filter((m) => {
    if (cat && m.category !== cat) return false;
    if (query && !`${m.title} ${m.description}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto p-6">
        <PageHeader
          eyebrow="Escola Comercial"
          title="Aprenda o método completo"
          description="Módulos práticos organizados por temas. Comece pelos fundamentos e siga a trilha até liderança comercial."
        />

        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar módulo…"
              className="w-full bg-muted/40 border border-border rounded-md pl-9 pr-3 py-2 text-sm outline-none focus:border-primary/50"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setCat(null)}
              className={
                "text-[11px] px-3 py-1.5 rounded-full border transition-colors " +
                (cat === null ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground")
              }
            >
              Tudo
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={
                  "text-[11px] px-3 py-1.5 rounded-full border transition-colors " +
                  (cat === c ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground")
                }
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => (
            <Link
              key={m.slug}
              to={`/app/escola-comercial/${m.slug}`}
              className="surface-elevated surface-elevated-hover p-5 flex flex-col gap-3 group"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-md bg-primary/10 border border-primary/25 flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-primary" />
                </div>
                {m.locked ? (
                  <StatusBadge tone="warning">
                    <Lock className="h-2.5 w-2.5" /> Em breve
                  </StatusBadge>
                ) : (
                  <StatusBadge tone="success">Liberado</StatusBadge>
                )}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {m.category}
                </p>
                <h3 className="font-serif text-lg leading-tight mt-1">{m.title}</h3>
                <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{m.description}</p>
              </div>
              <div className="mt-auto flex items-center justify-between pt-2 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <PlayCircle className="h-3 w-3" /> {m.aulas.length} aulas
                </span>
                <span className="text-primary opacity-70 group-hover:opacity-100">Abrir →</span>
              </div>
            </Link>
          ))}
        </div>

        <SectionCard className="mt-8" title="Como funciona a Escola">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div>
              <p className="text-foreground font-medium mb-1">Trilhas por tema</p>
              Módulos organizados por competência comercial — do vendedor iniciante ao líder.
            </div>
            <div>
              <p className="text-foreground font-medium mb-1">Aulas curtas e práticas</p>
              Vídeos de 15–30 minutos, com material de apoio e workshops.
            </div>
            <div>
              <p className="text-foreground font-medium mb-1">Liberação por plano</p>
              Módulos avançados são liberados conforme seu plano ativo.
            </div>
          </div>
        </SectionCard>
      </div>
    </AppLayout>
  );
}
