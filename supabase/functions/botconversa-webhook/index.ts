// Webhook público chamado pelo BotConversa ao final de fluxos.
// Autenticação: header `x-webhook-secret` ou query `?secret=` == BOTCONVERSA_WEBHOOK_SECRET.
// Roteamento por `?event=daily-score | talk-to-gabriel | assistant-intent`.
import { CORS, json, logEvent, normalizePhone, sendScoreDiagnosis } from "../_shared/botconversa.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SECRET = Deno.env.get("BOTCONVERSA_WEBHOOK_SECRET") || "";

function db() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

async function findUserId(payload: any): Promise<string | null> {
  const phone = normalizePhone(payload?.phone);
  const email = (payload?.email || "").toLowerCase().trim();
  const admin = db();
  if (phone) {
    // tenta matches por sufixo (o telefone pode estar salvo com/sem +55)
    const like = `%${phone.slice(-11)}`;
    const { data } = await admin
      .from("score_profiles")
      .select("user_id, phone")
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

async function savePending(payload: any, reason: string) {
  await db().from("botconversa_pending_webhooks").insert({
    phone: normalizePhone(payload?.phone),
    email: payload?.email || null,
    payload,
    reason,
  });
}

function toInt(v: any): number { const n = parseInt(String(v ?? "").replace(/\D/g, ""), 10); return isNaN(n) ? 0 : n; }
function toNum(v: any): number { const n = parseFloat(String(v ?? "").replace(/[^\d.,-]/g, "").replace(",", ".")); return isNaN(n) ? 0 : n; }

async function handleDailyScore(payload: any) {
  const userId = await findUserId(payload);
  if (!userId) {
    await savePending(payload, "usuário não encontrado por telefone/email");
    return json({ success: false, error: "usuário não encontrado" }, 200);
  }
  const date = payload?.date || new Date().toISOString().slice(0, 10);
  const row = {
    user_id: userId,
    date,
    prospeccoes: toInt(payload?.prospections),
    ligacoes: toInt(payload?.calls),
    whatsapps: toInt(payload?.whatsapps),
    contatos_efetivos: toInt(payload?.effective_contacts),
    reunioes_agendadas: toInt(payload?.meetings),
    apresentacoes: toInt(payload?.presentations),
    propostas: toInt(payload?.proposals),
    vendas: toInt(payload?.sales),
    valor_vendido: toNum(payload?.revenue),
    observacoes: payload?.notes || null,
  };
  const admin = db();
  const { error } = await admin.from("score_daily_logs").upsert(row, { onConflict: "user_id,date" });
  if (error) {
    await logEvent({ user_id: userId, phone: normalizePhone(payload?.phone), direction: "inbound", event_type: "daily-score", status: "error", payload, error_message: error.message });
    return json({ success: false, error: error.message }, 500);
  }

  // Score simples: soma das taxas de conversão médias ou volume
  const { data: recent } = await admin
    .from("score_daily_logs")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(14);
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

  await logEvent({ user_id: userId, phone: normalizePhone(payload?.phone), direction: "inbound", event_type: "daily-score", status: "ok", payload, response: { score, diagnosis } });
  // Envia diagnóstico de volta pelo WhatsApp (best-effort, não bloqueia resposta)
  sendScoreDiagnosis(userId, diagnosis, score).catch(() => {});
  return json({ success: true, message: "Registro diário salvo com sucesso", diagnosis, score });
}

async function handleTalkToGabriel(payload: any) {
  const userId = await findUserId(payload);
  if (!userId) {
    await savePending(payload, "talk-to-gabriel: usuário não encontrado");
    return json({ success: false, message: "Recebemos sua solicitação. Vamos entrar em contato." }, 200);
  }
  const admin = db();
  await admin.from("score_upsell_requests").insert({
    user_id: userId,
    source: "botconversa_whatsapp",
    status: "pending",
    notes: payload?.message || null,
  });
  await logEvent({ user_id: userId, phone: normalizePhone(payload?.phone), direction: "inbound", event_type: "talk-to-gabriel", status: "ok", payload });
  return json({ success: true, message: "Perfeito. Gabriel vai chamar você em breve." });
}

const ASSISTANT_REPLIES: Record<string, string> = {
  prospeccao: "Foque em fazer mais abordagens hoje: 10 ligações + 20 whatsapps novos. Registre cada uma no Score.",
  followup: "Todo follow-up precisa de próximo passo claro. Pergunte: 'Podemos marcar 15 minutos amanhã às 10h?'",
  objecao: "Antes de responder a objeção, entenda: é preço, valor, timing ou confiança? Isole a real e resolva uma de cada vez.",
  score: "Abra seu painel e veja a recomendação da semana. Trabalhe no gargalo apontado, não em tudo ao mesmo tempo.",
  outro: "Vou te direcionar para o conteúdo mais adequado. Se preferir, peça para falar com Gabriel.",
};

async function handleAssistantIntent(payload: any) {
  const userId = await findUserId(payload);
  const intent = (payload?.intent || "outro").toLowerCase();
  const reply = ASSISTANT_REPLIES[intent] || ASSISTANT_REPLIES.outro;
  await logEvent({ user_id: userId, phone: normalizePhone(payload?.phone), direction: "inbound", event_type: "assistant-intent", status: "ok", payload, response: { intent, reply } });
  return json({ success: true, intent, reply });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const url = new URL(req.url);
  const provided = req.headers.get("x-webhook-secret") || url.searchParams.get("secret") || "";
  if (!SECRET || provided !== SECRET) {
    return json({ error: "unauthorized" }, 401);
  }
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
  let payload: any = {};
  try { payload = await req.json(); } catch { return json({ error: "invalid json" }, 400); }

  const event = url.searchParams.get("event") || payload?.event || "daily-score";
  try {
    if (event === "daily-score") return await handleDailyScore(payload);
    if (event === "talk-to-gabriel") return await handleTalkToGabriel(payload);
    if (event === "assistant-intent") return await handleAssistantIntent(payload);
    return json({ error: `evento desconhecido: ${event}` }, 400);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await logEvent({ direction: "inbound", event_type: event, status: "error", payload, error_message: msg });
    return json({ success: false, error: msg }, 500);
  }
});
