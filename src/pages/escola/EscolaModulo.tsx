import { Link, Navigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/app/AppLayout";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusBadge } from "@/components/app/StatusBadge";
import { moduloBySlug } from "@/lib/escola-comercial/mock";
import { PlayCircle, FileText, Users, Lock, ArrowLeft } from "lucide-react";

const KIND_ICON = {
  video: PlayCircle,
  leitura: FileText,
  workshop: Users,
} as const;

export default function EscolaModulo() {
  const { moduloSlug } = useParams();
  const m = moduloBySlug(moduloSlug || "");
  if (!m) return <Navigate to="/app/escola-comercial" replace />;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-6">
        <Link
          to="/app/escola-comercial"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-3 w-3" /> Voltar para a Escola
        </Link>

        <PageHeader
          eyebrow={m.category}
          title={m.title}
          description={m.description}
          actions={
            m.locked ? (
              <StatusBadge tone="warning">
                <Lock className="h-2.5 w-2.5" /> Em breve
              </StatusBadge>
            ) : (
              <StatusBadge tone="success">Liberado</StatusBadge>
            )
          }
        />

        <ol className="space-y-2">
          {m.aulas.map((a, i) => {
            const Icon = KIND_ICON[a.kind];
            const disabled = m.locked;
            const body = (
              <div className="surface-elevated surface-elevated-hover p-4 flex items-center gap-4">
                <span className="font-mono text-[11px] w-6 text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <Icon className="h-4 w-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{a.title}</p>
                  <p className="text-[11px] text-muted-foreground capitalize">
                    {a.kind} · {a.duration}
                  </p>
                </div>
                {disabled ? (
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <span className="text-[11px] text-primary opacity-70">Abrir →</span>
                )}
              </div>
            );
            return (
              <li key={a.slug}>
                {disabled ? (
                  <div className="opacity-60 cursor-not-allowed">{body}</div>
                ) : (
                  <Link to={`/app/escola-comercial/${m.slug}/${a.slug}`}>{body}</Link>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </AppLayout>
  );
}
