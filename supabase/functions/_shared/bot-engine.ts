// Motor de fluxo conversacional para o bot do WhatsApp.
// Nós suportados: trigger | message | question | condition | action | end
import { todayBRT } from "./gpt-maker.ts";
import { parseUserDate, toBR } from "./date-parser.ts";
import { parseWhatsAppLog } from "./whatsapp-parser.ts";

export type FlowNode = {
  id: string;
  type: "trigger" | "message" | "question" | "condition" | "action" | "end";
  data: Record<string, any>;
};
export type FlowEdge = { id: string; source: string; target: string; sourceHandle?: string; label?: string };
export type FlowGraph = { nodes: FlowNode[]; edges: FlowEdge[] };
export type BotFlow = { id: string; name: string; triggers: string[]; graph: FlowGraph; priority: number };

export type BotSession = {
  id?: string;
  phone: string;
  user_id: string | null;
  flow_id: string | null;
  current_node_id: string | null;
  variables: Record<string, any>;
};

export type StepResult = {
  messages: string[];
  session: BotSession | null; // null → encerrar
  saveLogFor?: { date: string; log: Record<string, number> };
  markPenaltyZero?: boolean;
};

const SCORE_FIELDS = [
  "ligacoes", "whatsapps", "prospeccoes", "contatos_efetivos",
  "reunioes_agendadas", "apresentacoes", "propostas", "vendas", "valor_vendido",
];

function findNode(graph: FlowGraph, id: string | null | undefined): FlowNode | null {
  if (!id) return null;
  return graph.nodes.find((n) => n.id === id) || null;
}

function nextNode(graph: FlowGraph, fromId: string, handle?: string): FlowNode | null {
  const edge = graph.edges.find((e) => e.source === fromId && (!handle || e.sourceHandle === handle));
  if (!edge) return null;
  return findNode(graph, edge.target);
}

function interpolate(text: string, vars: Record<string, any>): string {
  if (!text) return "";
  return text.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => {
    const parts = String(key).split(".");
    let v: any = vars;
    for (const p of parts) v = v?.[p];
    return v === undefined || v === null ? "" : String(v);
  });
}

function parseNumberBR(raw: string): number | null {
  if (raw == null) return null;
  let s = String(raw).trim().toLowerCase().replace(/r\$\s*/g, "").replace(/^\D+/, "").replace(/\s+/g, "");
  if (!s) return null;
  const km = s.match(/^([\d.,]+)\s*k$/);
  if (km) return Math.round(parseFloat(km[1].replace(/\./g, "").replace(",", ".")) * 1000);
  if (/,\d{1,2}$/.test(s)) s = s.replace(/\./g, "").replace(",", ".");
  else s = s.replace(/,/g, "");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

// Tenta parse rotulado completo — se casar 4+ campos, pula direto ao save.
export function tryBulkParse(message: string): Record<string, number> | null {
  const p = parseWhatsAppLog(message);
  if (p.ok && p.log && p.matched >= 4) {
    const out: Record<string, number> = {};
    for (const f of SCORE_FIELDS) out[f] = Number((p.log as any)[f]) || 0;
    return out;
  }
  return null;
}

// Avança executando nós automáticos (message/action/condition) até bater numa question ou end.
async function advance(
  graph: FlowGraph,
  startNodeId: string | null,
  session: BotSession,
  messages: string[],
  ctx: { profileName?: string },
): Promise<{ session: BotSession | null; saveLogFor?: StepResult["saveLogFor"]; markPenaltyZero?: boolean }> {
  let currentId: string | null = startNodeId;
  let saveLogFor: StepResult["saveLogFor"] | undefined;
  let markPenaltyZero = false;

  // Circuit breaker
  for (let i = 0; i < 50; i++) {
    if (!currentId) return { session: null, saveLogFor, markPenaltyZero };
    const node = findNode(graph, currentId);
    if (!node) return { session: null, saveLogFor, markPenaltyZero };

    const vars = {
      ...session.variables,
      primeiro_nome: (ctx.profileName || "").split(" ")[0] || "",
      data_br: session.variables.data ? toBR(session.variables.data) : "",
    };

    if (node.type === "trigger") {
      currentId = nextNode(graph, node.id)?.id || null;
      continue;
    }

    if (node.type === "message") {
      const txt = interpolate(node.data.text || node.data.message || "", vars);
      if (txt) messages.push(txt);
      currentId = nextNode(graph, node.id)?.id || null;
      continue;
    }

    if (node.type === "action") {
      const kind = node.data.action;
      if (kind === "set_date_today") {
        session.variables.data = todayBRT();
      } else if (kind === "save_log") {
        const date = session.variables.data || todayBRT();
        const log: Record<string, number> = {};
        for (const f of SCORE_FIELDS) log[f] = Number(session.variables[f]) || 0;
        saveLogFor = { date, log };
        markPenaltyZero = true;
      }
      currentId = nextNode(graph, node.id)?.id || null;
      continue;
    }

    if (node.type === "condition") {
      // MVP: só compara variável a valor (data.op = "gt"|"eq"|"lt", data.field, data.value)
      const { field, op = "gt", value = 0 } = node.data;
      const v = Number(session.variables[field]) || 0;
      const truthy = op === "gt" ? v > Number(value) : op === "lt" ? v < Number(value) : v === Number(value);
      currentId = nextNode(graph, node.id, truthy ? "true" : "false")?.id || nextNode(graph, node.id)?.id || null;
      continue;
    }

    if (node.type === "question") {
      // Chegamos numa pergunta: envia prompt e espera resposta
      const prompt = interpolate(node.data.prompt || node.data.text || "", vars);
      if (prompt) messages.push(prompt);
      session.current_node_id = node.id;
      return { session, saveLogFor, markPenaltyZero };
    }

    if (node.type === "end") {
      const msg = interpolate(node.data.message || "", vars);
      if (msg) messages.push(msg);
      return { session: null, saveLogFor, markPenaltyZero };
    }

    // desconhecido — sai
    return { session: null, saveLogFor, markPenaltyZero };
  }
  return { session, saveLogFor, markPenaltyZero };
}

export function matchFlow(flows: BotFlow[], message: string): BotFlow | null {
  const lower = message.trim().toLowerCase();
  const sorted = [...flows].sort((a, b) => b.priority - a.priority);
  for (const f of sorted) {
    for (const trg of f.triggers || []) {
      if (!trg) continue;
      const t = String(trg).toLowerCase();
      if (lower.includes(t)) return f;
    }
  }
  return null;
}

// Processa a mensagem do usuário no contexto de uma sessão existente.
export async function continueSession(
  graph: FlowGraph,
  session: BotSession,
  userMessage: string,
  ctx: { profileName?: string },
): Promise<StepResult> {
  const messages: string[] = [];
  const node = findNode(graph, session.current_node_id);
  if (!node) return { messages, session: null };

  if (node.type !== "question") {
    // Estado inválido — reinicia avanço a partir do nó atual.
    const r = await advance(graph, session.current_node_id, session, messages, ctx);
    return { messages, session: r.session, saveLogFor: r.saveLogFor, markPenaltyZero: r.markPenaltyZero };
  }

  // Fallback: se veio bulk rotulado, salva tudo e vai pro final.
  const bulk = tryBulkParse(userMessage);
  if (bulk) {
    for (const f of Object.keys(bulk)) session.variables[f] = bulk[f];
    // avança até save_log/end pulando as próximas questions
    let cursor = nextNode(graph, node.id)?.id || null;
    for (let i = 0; i < 30 && cursor; i++) {
      const n = findNode(graph, cursor);
      if (!n) break;
      if (n.type === "question") {
        cursor = nextNode(graph, n.id)?.id || null;
        continue;
      }
      break;
    }
    const r = await advance(graph, cursor, session, messages, ctx);
    return { messages, session: r.session, saveLogFor: r.saveLogFor, markPenaltyZero: r.markPenaltyZero };
  }

  const validation = node.data.validation || "text";
  const field = node.data.field as string;

  if (validation === "date_past_7") {
    const d = parseUserDate(userMessage);
    if (!d.ok) {
      messages.push(d.reason + " Tenta de novo:");
      return { messages, session };
    }
    session.variables[field] = d.date;
  } else if (validation === "number") {
    const n = parseNumberBR(userMessage);
    if (n === null) {
      messages.push("Preciso de um número. Tenta de novo:");
      return { messages, session };
    }
    session.variables[field] = n;
  } else {
    session.variables[field] = userMessage.trim();
  }

  const nextId = nextNode(graph, node.id)?.id || null;
  const r = await advance(graph, nextId, session, messages, ctx);
  return { messages, session: r.session, saveLogFor: r.saveLogFor, markPenaltyZero: r.markPenaltyZero };
}

export async function startSession(
  flow: BotFlow,
  phone: string,
  userId: string | null,
  ctx: { profileName?: string },
): Promise<StepResult> {
  const messages: string[] = [];
  const session: BotSession = {
    phone,
    user_id: userId,
    flow_id: flow.id,
    current_node_id: null,
    variables: {},
  };
  const start = flow.graph.nodes.find((n) => n.type === "trigger") || flow.graph.nodes[0];
  const r = await advance(flow.graph, start?.id || null, session, messages, ctx);
  return { messages, session: r.session, saveLogFor: r.saveLogFor, markPenaltyZero: r.markPenaltyZero };
}

export function isCancelCommand(text: string): boolean {
  return /^(cancelar|sair|parar|stop|cancel)\b/i.test((text || "").trim());
}
