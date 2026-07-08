import { Link, Navigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/app/AppLayout";
import { PageHeader } from "@/components/app/PageHeader";
import { SectionCard } from "@/components/app/SectionCard";
import { aulaBySlug } from "@/lib/escola-comercial/mock";
import { ArrowLeft, ChevronLeft, ChevronRight, PlayCircle } from "lucide-react";

export default function EscolaAula() {
  const { moduloSlug, aulaSlug } = useParams();
  const found = aulaBySlug(moduloSlug || "", aulaSlug || "");
  if (!found) return <Navigate to={`/app/escola-comercial/${moduloSlug || ""}`} replace />;
  const { modulo, aula, prev, next } = found;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-6">
        <Link
          to={`/app/escola-comercial/${modulo.slug}`}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-3 w-3" /> {modulo.title}
        </Link>

        <PageHeader
          eyebrow={`${modulo.category} · ${aula.duration}`}
          title={aula.title}
        />

        <SectionCard className="mb-6">
          <div className="aspect-video rounded-lg bg-muted/40 border border-border flex items-center justify-center">
            <div className="text-center">
              <PlayCircle className="h-10 w-10 text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Conteúdo em preparação</p>
              <p className="text-[11px] text-muted-foreground/70">
                Este é um placeholder — o player e o material chegam quando o módulo entrar no ar.
              </p>
            </div>
          </div>
        </SectionCard>

        <div className="flex items-center justify-between gap-3">
          {prev ? (
            <Link
              to={`/app/escola-comercial/${modulo.slug}/${prev.slug}`}
              className="surface-elevated surface-elevated-hover p-3 flex items-center gap-2 flex-1 min-w-0"
            >
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Anterior</p>
                <p className="text-sm truncate">{prev.title}</p>
              </div>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
          {next ? (
            <Link
              to={`/app/escola-comercial/${modulo.slug}/${next.slug}`}
              className="surface-elevated surface-elevated-hover p-3 flex items-center gap-2 flex-1 min-w-0 text-right justify-end"
            >
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Próxima</p>
                <p className="text-sm truncate">{next.title}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ) : (
            <div className="flex-1" />
          )}
        </div>
      </div>
    </AppLayout>
  );
}
