import { useNavigate } from "react-router-dom";
import { Eye, X } from "lucide-react";
import { useImpersonation } from "@/hooks/useImpersonation";

const KIND_LABEL: Record<string, string> = {
  mentee: "Mentorado",
  score: "Score Comercial",
  partner: "Parceiro",
};

export function ImpersonationBanner() {
  const { impersonation, clear } = useImpersonation();
  const navigate = useNavigate();

  if (!impersonation) return null;

  const exit = () => {
    clear();
    navigate("/app/admin", { replace: true });
  };

  return (
    <div className="w-full border-b border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-1.5 flex items-center gap-3 text-xs">
        <Eye className="h-3.5 w-3.5 shrink-0" />
        <span className="min-w-0 truncate">
          <span className="uppercase tracking-widest text-[10px] opacity-70 mr-1">
            Modo inspeção admin
          </span>
          <span className="font-medium">{KIND_LABEL[impersonation.kind] ?? impersonation.kind}</span>
          <span className="opacity-70"> · </span>
          <span className="truncate">{impersonation.name}</span>
          {impersonation.email && (
            <span className="opacity-60 hidden sm:inline"> ({impersonation.email})</span>
          )}
        </span>
        <div className="flex-1" />
        <button
          type="button"
          onClick={exit}
          className="inline-flex items-center gap-1 rounded-md border border-amber-500/50 px-2 py-1 text-[11px] hover:bg-amber-500/20 transition-colors"
        >
          <X className="h-3 w-3" /> Sair da inspeção
        </button>
      </div>
    </div>
  );
}
