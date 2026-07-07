// Webhook público chamado pelo BotConversa ao final de fluxos.
// Autenticação: header `x-webhook-secret` ou query `?secret=` == BOTCONVERSA_WEBHOOK_SECRET.
// Roteamento por `?event=` ou `payload.event`:
//   daily-score | talk-to-gabriel | assistant-intent |
//   onboarding-score | weekly-diagnostic | inactive-recovery
//
// Regra: TODO evento sempre gera uma tarefa/pendência explícita:
//   - Usuário encontrado -> insere registro na tabela do fluxo correspondente (task_created=true)
//   - Usuário não encontrado -> insere em botconversa_pending_webhooks (pending_created=true)
// A resposta é sempre JSON claro com: success, event, user_id, nome, telefone,
// task_created, pending_created e detalhes do que foi criado.
import { CORS, json, logEvent, normalizePhone, sendScoreDiagnosis } from "../_shared/botconversa.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SECRET = Deno.env.get("BOTCONVERSA_WEBHOOK_SECRET") || "";

function db() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

type Ctx = {
  event: string;
  userId: string | null;
  nome: string | null;
  telefone: string | null;
  email: string | null;
  payload: any;
};

function extractIdentity(payload: any) {
  const nome = payload?.nome ?? payload?.name ?? payload?.full_name ?? null;
  const telefone = normalizePhone(payload?.telefone ?? payload?.phone ?? payload?.whatsapp ?? null);
  const email = (payload?.email ? String(payload.email).toLowerCase().trim() : null) || null;
  return { nome, telefone, email };
}

async function findUserId(telefone: string | null, email: string | null): Promise<string | null> {
  const admin = db();
  if (telefone) {
    const like = `%${telefone.slice(-11)}`;
    const { data } = await admin
      .from("score_profiles")
      .select("user_id")
      .ilike("phone", like)
      .limit(1)
      .maybeSingle();
    if (data?.user_id) return data.user_id;
  }
  if (email) {
    const { data } = await admin.from("score_profiles").select("user_id").eq("email", email).maybeSingle();
    if (data?.user_id) return data.user_id;
  }
  return null;
}

async function savePending(ctx: Ctx, reason: string) {
  const { data, error } = await db()
    .from("botconversa_pending_webhooks")
    .insert({
      phone: ctx.telefone,
      email: ctx.email,
      payload: { ...ctx.payload, event: ctx.event },
      reason,
    })
    .select("id")
    .maybeSingle();
  return { id: data?.id ?? null, error: error?.message ?? null };
}

function toInt(v: any): number { const n = parseInt(String(v ?? "").replace(/\D/g, ""), 10); return isNaN(n) ? 0 : n; }
function toNum(v: any): number { const n = parseFloat(String(v ?? "").replace(/[^\d.,-]/g, "").replace(",", ".")); return isNaN(n) ? 0 : n; }

function baseResponse(ctx: Ctx, extra: Record<string, unknown> = {}) {
  return {
    success: true,
    event: ctx.event,
    user_id: ctx.userId,
    nome: ctx.nome,
    telefone: ctx.telefone,
    task_created: false,
    pending_created: false,
    ...extra,
  };
}

async function handlePendingOnly(ctx: Ctx, reason: string, message: string) {
  const p = await savePending(ctx, reason);
  await logEvent({
    user_id: null, phone: ctx.telefone, direction: "inbound",
    event_type: ctx.event, status: "pending", payload: ctx.payload,
    error_message: reason,
  });
  return json(baseResponse(ctx, {
    pending_created: !!p.id,
    pending_id: p.id,
    reason,
    message,
  }));
}

// --------- Handlers ---------

async function handleDailyScore(ctx: Ctx) {
  if (!ctx.userId) return handlePendingOnly(ctx, "usuário não encontrado por telefone/email", "Registro pendente. Faça login no Score para vincular.");
  const admin = db();
  const date = ctx.payload?.date || new Date().toISOString().slice(0, 10);
  const row = {
    user_id: ctx.userId,
    date,
    prospeccoes: toInt(ctx.payload?.prospections),
    ligacoes: toInt(ctx.payload?.calls),
    whatsapps: toInt(ctx.payload?.whatsapps),
    contatos_efetivos: toInt(ctx.payload?.effective_contacts),
    reunioes_agendadas: toInt(ctx.payload?.meetings),
    apresentacoes: toInt(ctx.payload?.presentations),
    propostas: toInt(ctx.payload?.proposals),
    vendas: toInt(ctx.payload?.sales),
    valor_vendido: toNum(ctx.payload?.revenue),
    observacoes: ctx.payload?.notes || null,
  };
  const { error } = await admin.from("score_daily_logs").upsert(row, { onConflict: "user_id,date" });
  if (error) {
    await logEvent({ user_id: ctx.userId, phone: ctx.telefone, direction: "inbound", event_type: ctx.event, status: "error", payload: ctx.payload, error_message: error.message });
    return json({ ...baseResponse(ctx), success: false, error: error.message }, 500);
  }

  const { data: recent } = await admin
    .from("score_daily_logs").select("*").eq("user_id", ctx.userId)
    .order("date", { ascending: false }).limit(14);
  const logs = recent || [];
  const sum = (k: string) => logs.reduce((a: number, l: any) => a + (Number(l[k]) || 0), 0);
  const prosp = sum("prospeccoes");
  const contatos = sum("contatos_efetivos");
  const reunioes = sum("reunioes_agendadas");
  const vendas = sum("vendas");
  const base = Math.max(prosp, sum("ligacoes") + sum("whatsapps"));
  const conv = base > 0 ? Math.min(100, (contatos / base) * 100) : 0;
  const cr = contatos > 0 ? Math.min(100, (reunioes / contatos) * 100) : 0;
  const vr = base > 0 ? Math.min(100, (vendas / base) * 100 * 10) : 0;
  const score = Math.round((conv + cr + vr) / 3);

  let diagnosis = "Continue registrando para termos dados suficientes.";
  if (logs.length >= 3) {
    if (base > 20 && conv < 20) diagnosis = "Seu gargalo está na abordagem inicial — muitas abordagens e poucos contatos efetivos.";
    else if (contatos > 10 && cr < 25) diagnosis = "Seu gargalo está na conversão de contato para reunião.";
    else if (sum("propostas") > 3 && vendas / Math.max(1, sum("propostas")) < 0.25) diagnosis = "Seu gargalo está na negociação e fechamento.";
    else diagnosis = "Indicadores saudáveis. Continue medindo e ajustando semanalmente.";
  }

  await logEvent({ user_id: ctx.userId, phone: ctx.telefone, direction: "inbound", event_type: ctx.event, status: "ok", payload: ctx.payload, response: { score, diagnosis } });
  sendScoreDiagnosis(ctx.userId, diagnosis, score).catch(() => {});
  return json(baseResponse(ctx, {
    task_created: true,
    task_table: "score_daily_logs",
    task: { date, score, diagnosis },
    message: "Registro diário salvo com sucesso",
  }));
}

async function createUpsellTask(ctx: Ctx, source: string, notes: string) {
  const { data, error } = await db()
    .from("score_upsell_requests")
    .insert({
      user_id: ctx.userId!,
      source,
      status: "pending",
      notes,
    })
    .select("id")
    .maybeSingle();
  return { id: data?.id ?? null, error: error?.message ?? null };
}

async function handleTalkToGabriel(ctx: Ctx) {
  if (!ctx.userId) return handlePendingOnly(ctx, "talk-to-gabriel: usuário não encontrado", "Recebemos sua solicitação. Vamos entrar em contato.");
  const t = await createUpsellTask(ctx, "botconversa_whatsapp", ctx.payload?.message || "Solicitação via WhatsApp");
  await logEvent({ user_id: ctx.userId, phone: ctx.telefone, direction: "inbound", event_type: ctx.event, status: t.error ? "error" : "ok", payload: ctx.payload, error_message: t.error });
  return json(baseResponse(ctx, {
    task_created: !!t.id,
    task_id: t.id,
    task_table: "score_upsell_requests",
    message: "Perfeito. Gabriel vai chamar você em breve.",
  }));
}

const ASSISTANT_REPLIES: Record<string, string> = {
  prospeccao: "Foque em fazer mais abordagens hoje: 10 ligações + 20 whatsapps novos. Registre cada uma no Score.",
  followup: "Todo follow-up precisa de próximo passo claro. Pergunte: 'Podemos marcar 15 minutos amanhã às 10h?'",
  objecao: "Antes de responder a objeção, entenda: é preço, valor, timing ou confiança? Isole a real e resolva uma de cada vez.",
  score: "Abra seu painel e veja a recomendação da semana. Trabalhe no gargalo apontado, não em tudo ao mesmo tempo.",
  outro: "Vou te direcionar para o conteúdo mais adequado. Se preferir, peça para falar com Gabriel.",
};

async function handleAssistantIntent(ctx: Ctx) {
  const intent = (ctx.payload?.intent || "outro").toLowerCase();
  const reply = ASSISTANT_REPLIES[intent] || ASSISTANT_REPLIES.outro;
  if (!ctx.userId) {
    const p = await savePending(ctx, `assistant-intent(${intent}): usuário não encontrado`);
    await logEvent({ phone: ctx.telefone, direction: "inbound", event_type: ctx.event, status: "pending", payload: ctx.payload, response: { intent, reply } });
    return json(baseResponse(ctx, { pending_created: !!p.id, pending_id: p.id, intent, reply }));
  }
  const t = await createUpsellTask(ctx, `botconversa_assistant:${intent}`, `Intent: ${intent} — ${ctx.payload?.message || ""}`.trim());
  await logEvent({ user_id: ctx.userId, phone: ctx.telefone, direction: "inbound", event_type: ctx.event, status: "ok", payload: ctx.payload, response: { intent, reply } });
  return json(baseResponse(ctx, {
    task_created: !!t.id,
    task_id: t.id,
    task_table: "score_upsell_requests",
    intent,
    reply,
  }));
}

async function handleOnboardingScore(ctx: Ctx) {
  if (!ctx.userId) return handlePendingOnly(ctx, "onboarding-score: usuário não encontrado", "Onboarding pendente. Faça login para vincular.");
  const t = await createUpsellTask(ctx, "botconversa_onboarding", `Onboarding via WhatsApp — ${ctx.nome || ""}`.trim());
  await logEvent({ user_id: ctx.userId, phone: ctx.telefone, direction: "inbound", event_type: ctx.event, status: t.error ? "error" : "ok", payload: ctx.payload, error_message: t.error });
  return json(baseResponse(ctx, {
    task_created: !!t.id,
    task_id: t.id,
    task_table: "score_upsell_requests",
    message: "Onboarding registrado.",
  }));
}

async function handleWeeklyDiagnostic(ctx: Ctx) {
  if (!ctx.userId) return handlePendingOnly(ctx, "weekly-diagnostic: usuário não encontrado", "Diagnóstico semanal pendente.");
  const notes = ctx.payload?.notes || ctx.payload?.message || "Diagnóstico semanal solicitado via WhatsApp";
  const t = await createUpsellTask(ctx, "botconversa_weekly_diagnostic", String(notes));
  await logEvent({ user_id: ctx.userId, phone: ctx.telefone, direction: "inbound", event_type: ctx.event, status: t.error ? "error" : "ok", payload: ctx.payload, error_message: t.error });
  return json(baseResponse(ctx, {
    task_created: !!t.id,
    task_id: t.id,
    task_table: "score_upsell_requests",
    message: "Diagnóstico semanal registrado.",
  }));
}

async function handleInactiveRecovery(ctx: Ctx) {
  if (!ctx.userId) return handlePendingOnly(ctx, "inactive-recovery: usuário não encontrado", "Recuperação pendente.");
  const notes = ctx.payload?.reason || ctx.payload?.message || "Recuperação de inativo via WhatsApp";
  const t = await createUpsellTask(ctx, "botconversa_inactive_recovery", String(notes));
  await logEvent({ user_id: ctx.userId, phone: ctx.telefone, direction: "inbound", event_type: ctx.event, status: t.error ? "error" : "ok", payload: ctx.payload, error_message: t.error });
  return json(baseResponse(ctx, {
    task_created: !!t.id,
    task_id: t.id,
    task_table: "score_upsell_requests",
    message: "Recuperação registrada.",
  }));
}

const HANDLERS: Record<string, (ctx: Ctx) => Promise<Response>> = {
  "daily-score": handleDailyScore,
  "talk-to-gabriel": handleTalkToGabriel,
  "assistant-intent": handleAssistantIntent,
  "onboarding-score": handleOnboardingScore,
  "weekly-diagnostic": handleWeeklyDiagnostic,
  "inactive-recovery": handleInactiveRecovery,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const url = new URL(req.url);
  const provided = req.headers.get("x-webhook-secret") || url.searchParams.get("secret") || "";
  if (!SECRET || provided !== SECRET) return json({ error: "unauthorized" }, 401);
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  let payload: any = {};
  try { payload = await req.json(); } catch { return json({ error: "invalid json" }, 400); }

  const event = String(url.searchParams.get("event") || payload?.event || "daily-score");
  const { nome, telefone, email } = extractIdentity(payload);
  const userId = await findUserId(telefone, email);
  const ctx: Ctx = { event, userId, nome, telefone, email, payload };

  const handler = HANDLERS[event];
  if (!handler) {
    const p = await savePending(ctx, `evento desconhecido: ${event}`);
    return json({ ...baseResponse(ctx), success: false, error: `evento desconhecido: ${event}`, pending_created: !!p.id, pending_id: p.id }, 400);
  }

  try {
    return await handler(ctx);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await logEvent({ user_id: userId, phone: telefone, direction: "inbound", event_type: event, status: "error", payload, error_message: msg });
    const p = await savePending(ctx, `exceção: ${msg}`);
    return json({ ...baseResponse(ctx), success: false, error: msg, pending_created: !!p.id, pending_id: p.id }, 500);
  }
});
