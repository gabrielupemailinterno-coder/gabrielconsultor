import { Settings, Users, Plug, Shield } from "lucide-react";
import { SectionCard } from "@/components/app/SectionCard";
import { EmptyState } from "@/components/app/EmptyState";

interface Props {
  onNavigate?: (v: any) => void;
}

/** Placeholder settings hub. Ponto único para futuras configurações do sistema. */
export default function SettingsAdmin({ onNavigate }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl">Configurações</h2>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mt-1">
          Sistema, usuários e integrações
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Usuários & permissões" description="Gerencie papéis e acessos administrativos.">
          <EmptyState
            icon={Users}
            title="Em breve"
            description="A tela de administração de papéis e permissões será liberada em uma próxima etapa. Por enquanto, papéis são gerenciados diretamente na base."
          />
        </SectionCard>

        <SectionCard title="Integrações & webhooks" description="Chaves, endpoints e disparos externos.">
          <div className="text-sm text-muted-foreground mb-3">
            As integrações ativas do sistema estão em Automações &amp; Integrações.
          </div>
          <button
            type="button"
            onClick={() => onNavigate?.("integrations")}
            className="inline-flex items-center gap-2 text-xs bg-primary text-primary-foreground px-3 py-2 rounded-md"
          >
            <Plug className="h-3.5 w-3.5" /> Abrir Webhooks & API
          </button>
        </SectionCard>

        <SectionCard title="Preferências gerais" description="Ajustes globais da plataforma.">
          <EmptyState
            icon={Settings}
            title="Em breve"
            description="Preferências gerais (branding, notificações padrão, defaults) serão adicionadas aqui."
          />
        </SectionCard>

        <SectionCard title="Segurança" description="Sessões, tokens e auditoria.">
          <EmptyState
            icon={Shield}
            title="Em breve"
            description="Logs de auditoria e revisão de sessões administrativas serão exibidos aqui."
          />
        </SectionCard>
      </div>
    </div>
  );
}
