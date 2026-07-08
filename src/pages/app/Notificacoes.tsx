import { AppLayout } from "@/components/app/AppLayout";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { Bell } from "lucide-react";

export default function Notificacoes() {
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto p-6">
        <PageHeader
          eyebrow="Central"
          title="Notificações"
          description="Alertas de atividades, lembretes e mensagens da plataforma."
        />
        <EmptyState
          icon={Bell}
          title="Nenhuma notificação ainda"
          description="Assim que houver novidades — tarefas, comissões, novos conteúdos — elas aparecerão aqui."
        />
      </div>
    </AppLayout>
  );
}
