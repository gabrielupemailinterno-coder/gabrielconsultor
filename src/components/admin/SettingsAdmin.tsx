import { useEffect, useMemo, useState } from "react";
import {
  Settings,
  Users,
  Plug,
  Shield,
  Copy,
  Check,
  Phone,
  MessageSquareOff,
  MailX,
  KeyRound,
  Webhook,
  FileText,
} from "lucide-react";
import { SectionCard } from "@/components/app/SectionCard";
import { EmptyState } from "@/components/app/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  onNavigate?: (v: any) => void;
}

type RoleRow = { user_id: string; role: string; created_at?: string | null };

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  scoreapp_user: "Score",
  mentee: "Mentorado",
  partner: "Parceiro",
};

const ROLE_ORDER = ["admin", "scoreapp_user", "mentee", "partner"] as const;

const EVENTS = [
  "lead.created",
  "lead.updated",
  "score.user.created",
  "score.checkin.completed",
  "mentee.created",
  "mentee.task.created",
  "partner.created",
  "partner.link.created",
  "partner.conversion.created",
  "partner.commission.approved",
  "payment.confirmed",
  "payment.failed",
];

function CopyBtn({ value, label }: { value: string; label?: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setOk(true);
        toast.success("Copiado");
        setTimeout(() => setOk(false), 1500);
      }}
      className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition"
      title="Copiar"
    >
      {ok ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {label ?? "Copiar"}
    </button>
  );
}

function ToggleRow({
  icon: Icon,
  title,
  desc,
  on,
}: {
  icon: any;
  title: string;
  desc?: string;
  on: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-border/60 last:border-0">
      <div className="flex items-start gap-2.5 min-w-0">
        <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
        <div className="min-w-0">
          <div className="text-sm">{title}</div>
          {desc && <div className="text-[11px] text-muted-foreground mt-0.5">{desc}</div>}
        </div>
      </div>
      <span
        className={
          "shrink-0 text-[10px] uppercase tracking-widest px-2 py-1 rounded-full border " +
          (on
            ? "text-emerald-600 border-emerald-600/30 bg-emerald-500/5"
            : "text-muted-foreground border-border")
        }
      >
        {on ? "Ativo" : "Desativado"}
      </span>
    </div>
  );
}

export default function SettingsAdmin({ onNavigate }: Props) {
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, role, created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (!error && data) setRoles(data as any);
      setLoading(false);
    })();
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of roles) c[r.role] = (c[r.role] || 0) + 1;
    return c;
  }, [roles]);

  const filtered = useMemo(
    () => (filter === "all" ? roles : roles.filter((r) => r.role === filter)),
    [roles, filter],
  );

  const integrationSnippet = `POST https://sua-integracao.exemplo.com/webhook
Content-Type: application/json
X-Signature: <hmac-sha256>

{
  "event": "lead.created",
  "data": { ... }
}`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl">Configurações</h2>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mt-1">
          Sistema, usuários e integrações
        </p>
      </div>

      {/* Usuários & permissões */}
      <SectionCard
        title="Usuários & permissões"
        description="Papéis de acesso registrados na plataforma."
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {ROLE_ORDER.map((r) => (
            <div key={r} className="surface-elevated p-3 rounded-md">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {ROLE_LABEL[r]}
              </div>
              <div className="font-mono text-2xl mt-1">{counts[r] ?? 0}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {(["all", ...ROLE_ORDER] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={
                "text-[11px] px-2.5 py-1 rounded-full border transition " +
                (filter === f
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground")
              }
            >
              {f === "all" ? "Todos" : ROLE_LABEL[f]}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-xs text-muted-foreground py-6 text-center">Carregando…</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Sem usuários nesta visão"
            description="Nenhum usuário encontrado nesta visão. Quando usuários forem criados ou vinculados a papéis, eles aparecerão aqui."
          />
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border">
                  <th className="text-left font-normal py-2 px-1">User ID</th>
                  <th className="text-left font-normal py-2 px-1">Papel</th>
                  <th className="text-left font-normal py-2 px-1 hidden sm:table-cell">
                    Vinculado em
                  </th>
                  <th className="text-right font-normal py-2 px-1">Ação</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 100).map((r, i) => (
                  <tr key={r.user_id + r.role + i} className="border-b border-border/40">
                    <td className="py-2 px-1 font-mono text-[11px] truncate max-w-[220px]">
                      {r.user_id}
                    </td>
                    <td className="py-2 px-1">
                      <span className="text-[11px] px-2 py-0.5 rounded-full border border-border">
                        {ROLE_LABEL[r.role] ?? r.role}
                      </span>
                    </td>
                    <td className="py-2 px-1 text-xs text-muted-foreground hidden sm:table-cell">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString("pt-BR") : "—"}
                    </td>
                    <td className="py-2 px-1 text-right">
                      <CopyBtn value={r.user_id} label="ID" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length > 100 && (
              <div className="text-[11px] text-muted-foreground mt-2">
                Exibindo 100 de {filtered.length} registros.
              </div>
            )}
          </div>
        )}
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Preferências gerais */}
        <SectionCard
          title="Preferências gerais"
          description="Padrão de operação da plataforma."
        >
          <div className="space-y-1 mb-4">
            <div className="flex items-center justify-between text-sm py-1.5">
              <span className="text-muted-foreground">Nome da plataforma</span>
              <span>Gabriel Consultor Plataforma</span>
            </div>
            <div className="flex items-center justify-between text-sm py-1.5">
              <span className="text-muted-foreground">Canal principal</span>
              <span>WhatsApp / API / Webhook</span>
            </div>
          </div>

          <div className="rounded-md border border-border/60 px-3 mb-4">
            <ToggleRow
              icon={Phone}
              title="Telefone como chave do cliente"
              desc="WhatsApp/telefone identifica o cliente em todo o sistema."
              on
            />
            <ToggleRow
              icon={MailX}
              title="E-mail como canal de comunicação"
              desc="Comunicação por e-mail não é utilizada."
              on={false}
            />
            <ToggleRow
              icon={MessageSquareOff}
              title="Comunicação interna pela plataforma"
              desc="Nenhum disparo de mensagem parte da plataforma."
              on={false}
            />
            <ToggleRow
              icon={MessageSquareOff}
              title="Envio direto de mensagens pela plataforma"
              desc="Envios são feitos por ferramentas externas via API/Webhook."
              on={false}
            />
          </div>

          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
              Padrão de cadastro
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="surface-elevated p-3 rounded-md">
                <div className="font-serif text-sm mb-1">Lead simples</div>
                <ul className="text-xs text-muted-foreground space-y-0.5 list-disc pl-4">
                  <li>Nome</li>
                  <li>WhatsApp</li>
                  <li>Perfil</li>
                  <li>Empresa (opcional)</li>
                  <li>Produto de interesse</li>
                </ul>
              </div>
              <div className="surface-elevated p-3 rounded-md">
                <div className="font-serif text-sm mb-1">Cadastro de compra</div>
                <ul className="text-xs text-muted-foreground space-y-0.5 list-disc pl-4">
                  <li>Nome completo</li>
                  <li>CPF</li>
                  <li>WhatsApp</li>
                  <li>Produto</li>
                  <li>Plano</li>
                  <li>Dados de pagamento necessários</li>
                </ul>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-3">
              Leads devem ser capturados com o mínimo de dados. Dados completos só devem ser
              solicitados no momento da compra.
            </p>
          </div>
        </SectionCard>

        {/* API & Webhooks */}
        <SectionCard
          title="API & Webhooks"
          description="Conecte a plataforma Gabriel Consultor a qualquer sistema externo usando API e Webhooks."
        >
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
            Eventos principais
          </div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {EVENTS.map((e) => (
              <span
                key={e}
                className="font-mono text-[11px] px-2 py-1 rounded border border-border bg-muted/30"
              >
                {e}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onNavigate?.("integrations")}
              className="inline-flex items-center gap-2 text-xs bg-primary text-primary-foreground px-3 py-2 rounded-md"
            >
              <Plug className="h-3.5 w-3.5" /> Abrir API & Webhooks
            </button>
            <CopyBtn value={integrationSnippet} label="Copiar instrução de integração" />
          </div>
        </SectionCard>

        {/* Segurança */}
        <SectionCard
          title="Segurança"
          description="Sessões, links de acesso, tokens e auditoria."
          className="lg:col-span-2"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <KeyRound className="h-4 w-4 text-muted-foreground" />
                <div className="font-serif text-sm">Links de acesso</div>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                A plataforma gera links ou eventos de acesso. O envio ao usuário deve ser feito
                por integração externa via WhatsApp/API/Webhook.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate?.("integrations")}
                  className="inline-flex items-center gap-2 text-xs border border-border px-3 py-2 rounded-md hover:bg-muted/40"
                >
                  <Webhook className="h-3.5 w-3.5" /> Abrir API & Webhooks
                </button>
                <button
                  type="button"
                  disabled
                  title="Configure um webhook para disparar eventos de acesso."
                  className="inline-flex items-center gap-2 text-xs border border-border px-3 py-2 rounded-md opacity-50 cursor-not-allowed"
                >
                  <Shield className="h-3.5 w-3.5" /> Disparar evento de teste
                </button>
                <p className="text-[11px] text-muted-foreground">
                  Configure um webhook para disparar eventos de acesso.
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div className="font-serif text-sm">Auditoria</div>
              </div>
              <EmptyState
                icon={FileText}
                title="Sem logs"
                description="Nenhum log de auditoria disponível ainda."
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div className="font-serif text-sm">Sessões administrativas</div>
              </div>
              <EmptyState
                icon={Users}
                title="Sem sessões"
                description="As sessões administrativas serão exibidas aqui quando houver logs disponíveis."
              />
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
