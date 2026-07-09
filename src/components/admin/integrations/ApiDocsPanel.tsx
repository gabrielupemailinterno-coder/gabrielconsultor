import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Copy,
  Check,
  Search,
  ChevronDown,
  ChevronRight,
  Webhook,
  FileText,
  Shield,
  Activity,
} from "lucide-react";

/* ============================================================
 * Swagger-like API documentation for the Gabriel Consultor API.
 * Purely presentational — no live calls. Contracts are documented
 * with implementation status badges.
 * ============================================================ */

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
type ImplStatus = "implemented" | "planned" | "testing";

interface Endpoint {
  method: HttpMethod;
  path: string;
  name: string;
  description: string;
  status: ImplStatus;
  auth?: string;
  params?: { name: string; in: "path" | "query"; required?: boolean; description: string }[];
  body?: unknown;
  response?: unknown;
  errors?: { code: number; description: string }[];
}

interface Group {
  id: string;
  name: string;
  description?: string;
  endpoints: Endpoint[];
}

interface EventDoc {
  key: string;
  when: string;
  status: ImplStatus;
  payload: unknown;
}

/* -------------------- data -------------------- */

const GROUPS: Group[] = [
  {
    id: "leads",
    name: "Leads",
    description: "Captura e gestão de leads da plataforma.",
    endpoints: [
      {
        method: "POST",
        path: "/api/leads",
        name: "Criar lead",
        description:
          "Registra um novo lead com origem, produto de interesse e UTMs. Se product_interest = 'score_comercial' (ou landing/source do Score), a plataforma dispara automaticamente 'lead.created' e 'score.lead.created'.",
        status: "implemented",
        auth: "Bearer token",
        body: {
          name: "Maria Souza",
          phone: "5532999999999",
          profile_type: "vendedora",
          company: "Autônoma",
          product_interest: "score_comercial",
          landing_page: "score_comercial",
          source_path: "/scoreapp",
          partner_code: "ABC123",
          utm_source: "instagram",
          utm_medium: "bio",
          utm_campaign: "score_lancamento",
        },
        response: {
          id: "uuid",
          status: "created",
          events: ["lead.created", "score.lead.created"],
        },
        errors: [
          { code: 400, description: "Payload inválido" },
          { code: 401, description: "Token ausente ou inválido" },
        ],
      },
      {
        method: "GET",
        path: "/api/leads",
        name: "Listar leads",
        description: "Lista leads com filtros opcionais por origem, produto e período.",
        status: "planned",
        params: [
          { name: "landing_page", in: "query", description: "Filtra por landing de origem" },
          { name: "product_interest", in: "query", description: "Filtra por produto" },
          { name: "since", in: "query", description: "Data inicial ISO 8601" },
        ],
        response: { data: [{ id: "uuid", name: "João Silva", phone: "5532999999999" }] },
      },
      {
        method: "GET",
        path: "/api/leads/:id",
        name: "Consultar lead",
        description: "Retorna os dados completos de um lead pelo ID.",
        status: "planned",
        params: [{ name: "id", in: "path", required: true, description: "UUID do lead" }],
      },
      {
        method: "PATCH",
        path: "/api/leads/:id",
        name: "Atualizar lead",
        description: "Atualiza status, notas ou dados de um lead.",
        status: "planned",
        params: [{ name: "id", in: "path", required: true, description: "UUID do lead" }],
        body: { status: "qualified", notes: "Reunião marcada." },
      },
    ],
  },
  {
    id: "score",
    name: "Score Comercial",
    description: "Usuários e check-ins do Score Comercial.",
    endpoints: [
      {
        method: "POST",
        path: "/api/score/users",
        name: "Criar usuário do Score",
        description: "Cria/atualiza usuário do Score identificado pelo telefone.",
        status: "planned",
        body: { phone: "5532999999999", full_name: "João Silva", profession: "vendedor" },
      },
      {
        method: "POST",
        path: "/api/score/checkins",
        name: "Criar check-in",
        description: "Registra um check-in diário com respostas por bloco.",
        status: "planned",
        body: {
          phone: "5532999999999",
          answers: { prospeccao: 8, follow_up: 6, negociacao: 7 },
          notes: "Dificuldade em manter cadência.",
        },
        response: { id: "uuid", event: "score.checkin.completed" },
      },
      {
        method: "GET",
        path: "/api/score/users/:id",
        name: "Consultar usuário Score",
        description: "Retorna perfil do usuário Score.",
        status: "planned",
        params: [{ name: "id", in: "path", required: true, description: "UUID do usuário" }],
      },
      {
        method: "GET",
        path: "/api/score/checkins/:user_id",
        name: "Listar check-ins do usuário",
        description: "Histórico de check-ins do usuário.",
        status: "planned",
        params: [{ name: "user_id", in: "path", required: true, description: "UUID do usuário" }],
      },
    ],
  },
  {
    id: "mentees",
    name: "Mentoria Comercial",
    description: "Mentorados, planos e tarefas.",
    endpoints: [
      {
        method: "POST",
        path: "/api/mentees",
        name: "Criar mentorado",
        description: "Provisiona mentorado a partir de compra confirmada.",
        status: "planned",
        body: {
          name: "João Silva",
          phone: "5532999999999",
          cpf: "00000000000",
          product: "mentoria_comercial",
          plan: "mentoria_1_1",
        },
        response: { id: "uuid", event: "mentee.created" },
      },
      {
        method: "GET",
        path: "/api/mentees/:id",
        name: "Consultar mentorado",
        description: "Retorna dados do mentorado.",
        status: "planned",
        params: [{ name: "id", in: "path", required: true, description: "UUID do mentorado" }],
      },
      {
        method: "POST",
        path: "/api/mentees/tasks",
        name: "Criar tarefa",
        description: "Adiciona uma tarefa (homework) ao mentorado.",
        status: "planned",
        body: { mentee_id: "uuid", title: "Enviar 20 mensagens de prospecção", due_at: "2026-07-15" },
      },
      {
        method: "PATCH",
        path: "/api/mentees/tasks/:id",
        name: "Atualizar tarefa",
        description: "Atualiza status ou nota de uma tarefa.",
        status: "planned",
        params: [{ name: "id", in: "path", required: true, description: "UUID da tarefa" }],
        body: { status: "completed", note: "Concluída no prazo." },
      },
    ],
  },
  {
    id: "partners",
    name: "Parceiros / Afiliados",
    endpoints: [
      {
        method: "POST",
        path: "/api/partners",
        name: "Criar parceiro",
        description: "Cadastra parceiro com taxa de comissão.",
        status: "planned",
        body: { name: "Parceiro X", phone: "5532999999999", company: "Empresa X", commission_rate: 70 },
      },
      {
        method: "GET",
        path: "/api/partners/:id",
        name: "Consultar parceiro",
        status: "planned",
        description: "Retorna dados do parceiro.",
        params: [{ name: "id", in: "path", required: true, description: "UUID do parceiro" }],
      },
      {
        method: "POST",
        path: "/api/partners/links",
        name: "Criar link de divulgação",
        description: "Gera link atribuído a um parceiro/produto.",
        status: "planned",
        body: {
          partner_code: "ABC123",
          product: "score_comercial",
          channel: "instagram_bio",
          destination: "/scoreapp",
        },
        response: { id: "uuid", url: "https://gabrielconsultor.com/r/ABC123", event: "partner.link.created" },
      },
      {
        method: "GET",
        path: "/api/partners/:id/conversions",
        name: "Consultar conversões do parceiro",
        status: "planned",
        description: "Lista conversões atribuídas ao parceiro.",
        params: [{ name: "id", in: "path", required: true, description: "UUID do parceiro" }],
      },
    ],
  },
  {
    id: "conversions",
    name: "Conversões & Comissões",
    endpoints: [
      {
        method: "POST",
        path: "/api/partner-conversions",
        name: "Criar conversão atribuída",
        description: "Registra conversão vinculada a um parceiro.",
        status: "planned",
        body: {
          partner_code: "ABC123",
          kind: "purchase",
          product: "score_comercial",
          amount_cents: 9700,
          source_id: "uuid",
        },
      },
      {
        method: "PATCH",
        path: "/api/partner-conversions/:id/status",
        name: "Atualizar status da comissão",
        description: "Aprova, marca como paga ou cancela a comissão.",
        status: "planned",
        params: [{ name: "id", in: "path", required: true, description: "UUID da conversão" }],
        body: { status: "approved" },
        errors: [{ code: 422, description: "Status inválido — use pending | approved | paid | canceled" }],
      },
    ],
  },
  {
    id: "payments",
    name: "Pagamentos / Assinaturas",
    endpoints: [
      {
        method: "POST",
        path: "/api/payments/confirmed",
        name: "Registrar pagamento confirmado",
        status: "planned",
        description: "Notifica pagamento confirmado.",
        body: { phone: "5532999999999", product: "score_comercial", amount_cents: 9700, external_id: "asaas_xxx" },
      },
      {
        method: "POST",
        path: "/api/payments/failed",
        name: "Registrar pagamento falhou",
        status: "planned",
        description: "Notifica falha de pagamento.",
        body: { phone: "5532999999999", product: "score_comercial", reason: "card_declined" },
      },
      {
        method: "POST",
        path: "/api/subscriptions/canceled",
        name: "Registrar assinatura cancelada",
        status: "planned",
        description: "Notifica cancelamento de assinatura.",
        body: { phone: "5532999999999", product: "mentoria_comercial" },
      },
    ],
  },
  {
    id: "events",
    name: "Eventos",
    endpoints: [
      {
        method: "POST",
        path: "/api/events",
        name: "Criar evento manual",
        description: "Dispara um evento arbitrário para os webhooks registrados.",
        status: "testing",
        body: {
          event_name: "lead.created",
          phone: "5532999999999",
          payload: { name: "João Silva", product_interest: "score_comercial" },
        },
        response: { delivered: 2, event: "lead.created" },
      },
      {
        method: "GET",
        path: "/api/events",
        name: "Listar eventos disponíveis",
        description: "Lista todos os eventos catalogados na plataforma.",
        status: "implemented",
      },
    ],
  },
  {
    id: "system",
    name: "Sistema",
    endpoints: [
      {
        method: "GET",
        path: "/api/health",
        name: "Status da API",
        description: "Health-check simples.",
        status: "implemented",
        response: { status: "ok", ts: "2026-07-09T12:00:00Z" },
      },
    ],
  },
];

const WEBHOOK_EVENTS: EventDoc[] = [
  { key: "lead.created", when: "Lead capturado em qualquer landing.", status: "implemented", payload: { id: "uuid", name: "João", phone: "5532999999999", landing_page: "score_comercial" } },
  { key: "lead.updated", when: "Status ou dados do lead atualizados.", status: "planned", payload: { id: "uuid", status: "qualified" } },
  { key: "score.user.created", when: "Novo usuário no Score Comercial.", status: "implemented", payload: { user_id: "uuid", phone: "5532999999999" } },
  { key: "score.checkin.completed", when: "Check-in diário finalizado.", status: "implemented", payload: { user_id: "uuid", answers: { prospeccao: 8 } } },
  { key: "score.diagnosis.completed", when: "Diagnóstico do Score finalizado.", status: "planned", payload: { user_id: "uuid", score: 720 } },
  { key: "mentee.created", when: "Mentorado provisionado.", status: "implemented", payload: { mentee_id: "uuid", plan: "mentoria_1_1" } },
  { key: "mentee.task.created", when: "Nova tarefa atribuída.", status: "planned", payload: { task_id: "uuid", mentee_id: "uuid" } },
  { key: "mentee.task.completed", when: "Tarefa concluída.", status: "planned", payload: { task_id: "uuid" } },
  { key: "partner.created", when: "Novo parceiro criado.", status: "implemented", payload: { partner_id: "uuid", code: "ABC123" } },
  { key: "partner.link.created", when: "Novo link de divulgação criado.", status: "implemented", payload: { link_id: "uuid", url: "..." } },
  { key: "partner.conversion.created", when: "Conversão atribuída a um parceiro.", status: "implemented", payload: { conversion_id: "uuid", amount_cents: 9700 } },
  { key: "partner.commission.pending", when: "Comissão registrada em pendente.", status: "planned", payload: { conversion_id: "uuid" } },
  { key: "partner.commission.approved", when: "Comissão aprovada.", status: "planned", payload: { conversion_id: "uuid" } },
  { key: "partner.commission.paid", when: "Comissão paga.", status: "planned", payload: { conversion_id: "uuid" } },
  { key: "payment.created", when: "Cobrança criada.", status: "planned", payload: { external_id: "asaas_xxx" } },
  { key: "payment.confirmed", when: "Pagamento confirmado.", status: "implemented", payload: { external_id: "asaas_xxx", amount_cents: 9700 } },
  { key: "payment.failed", when: "Pagamento com falha.", status: "planned", payload: { external_id: "asaas_xxx", reason: "card_declined" } },
  { key: "subscription.created", when: "Nova assinatura ativada.", status: "planned", payload: { phone: "5532999999999" } },
  { key: "subscription.canceled", when: "Assinatura cancelada.", status: "planned", payload: { phone: "5532999999999" } },
  { key: "access.link.generated", when: "Link seguro de acesso gerado (para envio via integração externa).", status: "planned", payload: { phone: "5532999999999", url: "..." } },
];

/* -------------------- primitives -------------------- */

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: "bg-sky-500/10 text-sky-600 border-sky-500/30",
  POST: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  PATCH: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  PUT: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  DELETE: "bg-rose-500/10 text-rose-600 border-rose-500/30",
};

const STATUS_LABEL: Record<ImplStatus, string> = {
  implemented: "Implementado",
  planned: "Planejado",
  testing: "Em teste",
};

const STATUS_COLORS: Record<ImplStatus, string> = {
  implemented: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  testing: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  planned: "bg-muted text-muted-foreground border-border",
};

function MethodBadge({ method }: { method: HttpMethod }) {
  return (
    <span
      className={
        "font-mono text-[10px] px-2 py-0.5 rounded border uppercase tracking-wider " +
        METHOD_COLORS[method]
      }
    >
      {method}
    </span>
  );
}

function StatusBadge({ status }: { status: ImplStatus }) {
  return (
    <span
      className={
        "text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider " +
        STATUS_COLORS[status]
      }
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function CopyButton({ value, label, small }: { value: string; label?: string; small?: boolean }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      onClick={async (e) => {
        e.stopPropagation();
        await navigator.clipboard.writeText(value);
        setOk(true);
        toast.success("Copiado");
        setTimeout(() => setOk(false), 1500);
      }}
      className={
        "inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition " +
        (small ? "text-[10px]" : "text-[11px]")
      }
      title="Copiar"
    >
      {ok ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {label && <span>{label}</span>}
    </button>
  );
}

function JsonBlock({ value, label }: { value: unknown; label?: string }) {
  const text = typeof value === "string" ? value : JSON.stringify(value, null, 2);
  return (
    <div className="relative">
      {label && (
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
          {label}
        </div>
      )}
      <div className="relative">
        <pre className="bg-secondary/40 border border-border/60 rounded-md p-3 text-[11px] font-mono overflow-x-auto max-h-[320px]">
          {text}
        </pre>
        <div className="absolute top-2 right-2">
          <CopyButton value={text} />
        </div>
      </div>
    </div>
  );
}

/* -------------------- endpoint card -------------------- */

function EndpointCard({ ep, baseUrl }: { ep: Endpoint; baseUrl: string }) {
  const [open, setOpen] = useState(false);
  const fullUrl = `${baseUrl}${ep.path}`;

  return (
    <div className="border border-border rounded-md bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/30 transition text-left"
      >
        <MethodBadge method={ep.method} />
        <code className="font-mono text-[12px] truncate flex-1">{ep.path}</code>
        <span className="hidden sm:inline text-xs text-muted-foreground truncate max-w-[240px]">
          {ep.name}
        </span>
        <StatusBadge status={ep.status} />
        {open ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {open && (
        <div className="border-t border-border p-4 space-y-4 bg-background/40">
          <div>
            <div className="text-sm font-medium">{ep.name}</div>
            <p className="text-xs text-muted-foreground mt-0.5">{ep.description}</p>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <CopyButton value={fullUrl} label="Copiar URL completa" />
            <span className="text-border">·</span>
            <CopyButton value={ep.path} label="Copiar rota" />
            {ep.auth && (
              <>
                <span className="text-border">·</span>
                <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                  <Shield className="h-3 w-3" /> {ep.auth}
                </span>
              </>
            )}
          </div>

          {ep.params && ep.params.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                Parâmetros
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] uppercase text-muted-foreground border-b border-border">
                    <th className="text-left font-normal py-1.5 pr-2">Nome</th>
                    <th className="text-left font-normal py-1.5 pr-2">Em</th>
                    <th className="text-left font-normal py-1.5 pr-2">Obrig.</th>
                    <th className="text-left font-normal py-1.5">Descrição</th>
                  </tr>
                </thead>
                <tbody>
                  {ep.params.map((p) => (
                    <tr key={p.name} className="border-b border-border/40">
                      <td className="py-1.5 pr-2 font-mono">{p.name}</td>
                      <td className="py-1.5 pr-2 text-muted-foreground">{p.in}</td>
                      <td className="py-1.5 pr-2 text-muted-foreground">
                        {p.required ? "sim" : "não"}
                      </td>
                      <td className="py-1.5 text-muted-foreground">{p.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ep.body !== undefined && <JsonBlock label="Request body" value={ep.body} />}
            {ep.response !== undefined && <JsonBlock label="Response 200" value={ep.response} />}
          </div>

          <JsonBlock
            label="cURL"
            value={`curl -X ${ep.method} '${fullUrl}' \\\n  -H 'Authorization: Bearer SEU_TOKEN' \\\n  -H 'Content-Type: application/json'${
              ep.body ? ` \\\n  -d '${JSON.stringify(ep.body)}'` : ""
            }`}
          />

          {ep.errors && ep.errors.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                Erros possíveis
              </div>
              <ul className="text-xs space-y-1">
                {ep.errors.map((e) => (
                  <li key={e.code} className="flex gap-2">
                    <span className="font-mono text-rose-600">{e.code}</span>
                    <span className="text-muted-foreground">{e.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* -------------------- main panel -------------------- */

interface Props {
  onNavigate?: (tab: "webhooks" | "logs" | "events") => void;
}

export default function ApiDocsPanel({ onNavigate }: Props) {
  const baseUrl = useMemo(
    () =>
      typeof window !== "undefined"
        ? window.location.origin
        : "https://gabrielconsultor.com",
    [],
  );
  const [query, setQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | ImplStatus>("all");

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return GROUPS.filter((g) => groupFilter === "all" || g.id === groupFilter)
      .map((g) => ({
        ...g,
        endpoints: g.endpoints.filter((ep) => {
          if (statusFilter !== "all" && ep.status !== statusFilter) return false;
          if (!q) return true;
          return (
            ep.path.toLowerCase().includes(q) ||
            ep.name.toLowerCase().includes(q) ||
            ep.description.toLowerCase().includes(q)
          );
        }),
      }))
      .filter((g) => g.endpoints.length > 0);
  }, [query, groupFilter, statusFilter]);

  const filteredEvents = useMemo(() => {
    const q = query.trim().toLowerCase();
    return WEBHOOK_EVENTS.filter((e) => {
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      if (!q) return true;
      return e.key.toLowerCase().includes(q) || e.when.toLowerCase().includes(q);
    });
  }, [query, statusFilter]);

  const headersExample = `{
  "Authorization": "Bearer SEU_TOKEN",
  "Content-Type": "application/json"
}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-lg p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-serif text-xl">API</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Documentação para conectar sistemas externos à plataforma Gabriel Consultor.
              Use API e Webhooks para integrar ferramentas externas — a plataforma não envia
              comunicação diretamente.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onNavigate?.("webhooks")}
              className="inline-flex items-center gap-1.5 text-xs border border-border px-3 py-1.5 rounded-md hover:bg-muted/40"
            >
              <Webhook className="h-3.5 w-3.5" /> Ver Webhooks
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.("logs")}
              className="inline-flex items-center gap-1.5 text-xs border border-border px-3 py-1.5 rounded-md hover:bg-muted/40"
            >
              <FileText className="h-3.5 w-3.5" /> Ver logs
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
          <div className="surface-elevated rounded-md p-3">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Base URL
            </div>
            <div className="flex items-center gap-2 mt-1">
              <code className="font-mono text-xs truncate flex-1">{baseUrl}/api</code>
              <CopyButton value={`${baseUrl}/api`} />
            </div>
          </div>
          <div className="surface-elevated rounded-md p-3">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Ambiente
            </div>
            <div className="text-sm mt-1">Produção</div>
          </div>
          <div className="surface-elevated rounded-md p-3">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Autenticação
            </div>
            <code className="text-[11px] font-mono block mt-1 truncate">
              Bearer SEU_TOKEN
            </code>
          </div>
          <div className="surface-elevated rounded-md p-3">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Status
            </div>
            <div className="text-sm mt-1 inline-flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-emerald-500" /> Operacional
            </div>
          </div>
        </div>
      </div>

      {/* Auth */}
      <div className="bg-card border border-border rounded-lg p-5">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-serif text-base">Autenticação</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Todas as chamadas exigem um header <code className="font-mono">Authorization</code>{" "}
          com token de portador.
        </p>
        <JsonBlock label="Headers recomendados" value={headersExample} />
        <p className="text-[11px] text-muted-foreground mt-3">
          Gestão de tokens será configurada na próxima etapa. Atualmente, integrações ativas
          usam Edge Functions e Webhooks existentes.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-3 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar endpoint, evento ou descrição…"
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <select
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
          className="text-xs bg-background border border-border rounded-md px-2 py-1.5"
        >
          <option value="all">Todos os grupos</option>
          {GROUPS.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="text-xs bg-background border border-border rounded-md px-2 py-1.5"
        >
          <option value="all">Todos os status</option>
          <option value="implemented">Implementado</option>
          <option value="testing">Em teste</option>
          <option value="planned">Planejado</option>
        </select>
      </div>

      {/* Groups */}
      {filteredGroups.length === 0 ? (
        <div className="text-center text-sm text-muted-foreground py-10">
          Nenhum endpoint corresponde aos filtros.
        </div>
      ) : (
        filteredGroups.map((g) => (
          <section key={g.id} className="space-y-2">
            <div className="flex items-baseline justify-between">
              <div>
                <h3 className="font-serif text-lg">{g.name}</h3>
                {g.description && (
                  <p className="text-xs text-muted-foreground">{g.description}</p>
                )}
              </div>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {g.endpoints.length} endpoint{g.endpoints.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="space-y-2">
              {g.endpoints.map((ep) => (
                <EndpointCard key={ep.method + ep.path} ep={ep} baseUrl={baseUrl} />
              ))}
            </div>
          </section>
        ))
      )}

      {/* Webhook events */}
      <section className="space-y-2">
        <div className="flex items-baseline justify-between">
          <div>
            <h3 className="font-serif text-lg">Eventos para Webhook</h3>
            <p className="text-xs text-muted-foreground">
              Eventos disparados pela plataforma para integrações externas.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate?.("webhooks")}
            className="text-xs text-primary hover:underline inline-flex items-center gap-1"
          >
            <Webhook className="h-3.5 w-3.5" /> Configurar webhooks
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {filteredEvents.map((e) => (
            <EventDocCard key={e.key} event={e} />
          ))}
          {filteredEvents.length === 0 && (
            <div className="text-sm text-muted-foreground py-6 text-center col-span-full">
              Nenhum evento corresponde aos filtros.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function EventDocCard({ event }: { event: EventDoc }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-md bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/30 transition text-left"
      >
        <code className="font-mono text-[12px] truncate flex-1">{event.key}</code>
        <StatusBadge status={event.status} />
        {open ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>
      {open && (
        <div className="border-t border-border p-3 space-y-2 bg-background/40">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">
              Quando dispara
            </div>
            <p className="text-xs">{event.when}</p>
          </div>
          <JsonBlock label="Payload" value={event.payload} />
        </div>
      )}
    </div>
  );
}
