// Webhook público chamado pelo GPT Maker quando o usuário responde no WhatsApp.
// Requer header X-Webhook-Token = GPT_MAKER_WEBHOOK_TOKEN.
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  sendWhatsApp,
  normalizePhone,
  todayBRT,
  resolveChatId,
  startHuman,
  stopHuman,
} from "../_shared/gpt-maker.ts";
import { parseWhatsAppLog } from "../_shared/whatsapp-parser.ts";
import {
  BotFlow,
  BotSession,
  continueSession,
  isCancelCommand,
  matchFlowDebug,
  startSession,
  StepResult,
} from "../_shared/bot-engine.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_TOKEN = Deno.env.get("GPT_MAKER_WEBHOOK_TOKEN");
const GPT_TOKEN = Deno.env.get("GPT_MAKER_API_TOKEN");

// NOTA: NÃO forçamos mais o agente da GPT Maker para inativo aqui.
// Descoberta em produção: quando o agente está inativo, a GPT Maker
// deixa de disparar `onNewMessage` para as mensagens seguintes da mesma
// interação — só a primeira mensagem chega ao webhook, e o fluxo trava
// depois da primeira pergunta. Mantemos o agente ativo; o "modo somente
// webhook" agora é garantido pelo prompt/treinamento do agente na GPT
// Maker (ex.: "não responda nada"), e nós já respondemos primeiro.

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function computeDayScore(log: any): { score: number; label: string } {
  const alvoAtiv = 40;
  const atividades = (log.ligacoes || 0) + (log.whatsapps || 0);
  const vol = Math.min(1, atividades / alvoAtiv) * 30;
  const prosp = Math.min(1, (log.prospeccoes || 0) / 5) * 15;
  const reun = Math.min(1, (log.reunioes_agendadas || 0) / 2) * 20;
  const fech = (log.vendas || 0) > 0 ? 35 : (log.propostas || 0) > 0 ? 15 : (log.apresentacoes || 0) > 0 ? 8 : 0;
  const score = Math.round(vol + prosp + reun + fech);
  const label = score < 30 ? "Fraco" : score < 55 ? "Regular" : score < 75 ? "Bom" : score < 90 ? "Ótimo" : "Excelente";
  return { score, label };
}

const SCORE_FIELDS = [
  "ligacoes", "whatsapps", "prospeccoes", "contatos_efetivos",
  "reunioes_agendadas", "apresentacoes", "propostas", "vendas", "valor_vendido",
];

function pickEmail(body: any): string {
  return String(
    body.email ||
    body.user?.email ||
    body.contact?.email ||
    body.chat?.email ||
    body.customer?.email ||
    body.message?.contact?.email ||
    body.data?.email ||
    body.data?.contact?.email ||
    ""
  ).trim().toLowerCase();
}

function pickPhone(body: any): string {
  return String(
    body.phone ||
    body.from ||
    body.contact?.phone ||
    body.chat?.phone ||
    body.customer?.phone ||
    body.message?.from ||
    body.message?.contact?.phone ||
    body.message?.chat?.phone ||
    body.data?.phone ||
    body.data?.from ||
    body.data?.contact?.phone ||
    ""
  );
}

function pickMessage(body: any): string {
  return String(
    body.message ||
    body.text ||
    body.body ||
    body.content ||
    body.message?.text ||
    body.message?.body ||
    body.message?.content ||
    body.data?.message ||
    body.data?.text ||
    body.data?.body ||
    ""
  );
}

function pickChatId(body: any): string | null {
  const id =
    body?.chatId ||
    body?.chat?.id ||
    body?.chat_id ||
    body?.message?.chatId ||
    body?.message?.chat?.id ||
    body?.data?.chatId ||
    body?.data?.chat?.id ||
    null;
  return id ? String(id) : null;
}

function pickMessageId(body: any): string | null {
  const id =
    body?.messageId ||
    body?.message_id ||
    body?.id ||
    body?.message?.id ||
    body?.data?.messageId ||
    body?.data?.id ||
    null;
  return id ? String(id) : null;
}


function phoneCandidates(raw: string): Set<string> {
  const normalized = normalizePhone(raw);
  const digits = normalized.replace(/\D/g, "");
  const candidates = new Set<string>();
  if (!digits) return candidates;

  const addLocal = (local: string) => {
    if (!local) return;
    candidates.add(local);
    candidates.add(`55${local}`);
    // WhatsApp Brasil: muitos payloads chegam sem o 9º dígito móvel,
    // enquanto o perfil pode estar cadastrado com ele (ou o inverso).
    if (local.length === 11 && local[2] === "9") {
      const withoutNinth = `${local.slice(0, 2)}${local.slice(3)}`;
      candidates.add(withoutNinth);
      candidates.add(`55${withoutNinth}`);
    }
    if (local.length === 10) {
      const withNinth = `${local.slice(0, 2)}9${local.slice(2)}`;
      candidates.add(withNinth);
      candidates.add(`55${withNinth}`);
    }
  };

  candidates.add(digits);
  if (digits.startsWith("55")) addLocal(digits.slice(2));
  else addLocal(digits);
  return candidates;
}

function phonesMatch(a: string, b: string): boolean {
  const aa = phoneCandidates(a);
  const bb = phoneCandidates(b);
  for (const item of aa) if (bb.has(item)) return true;
  return false;
}

async function getAdminSettings(admin: any) {
  const { data: settingsRows } = await admin
    .from("settings")
    .select("*")
    .not("channel_id", "is", null)
    .neq("channel_id", "")
    .order("updated_at", { ascending: false })
    .limit(1);
  if (settingsRows?.[0]) return settingsRows[0];

  const { data: fallbackRows } = await admin
    .from("settings")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1);
  return fallbackRows?.[0] || null;
}

async function computeStreak(admin: any, userId: string): Promise<number> {
  const { data } = await admin
    .from("score_daily_logs").select("date").eq("user_id", userId)
    .order("date", { ascending: false }).limit(365);
  if (!data || data.length === 0) return 0;
  const set = new Set((data as any[]).map((d) => d.date));
  const today = todayBRT();
  let streak = 0;
  const start = new Date(today + "T00:00:00Z");
  for (let i = 0; i < 365; i++) {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (set.has(key)) streak++;
    else if (i > 0) break;
    else continue;
  }
  return streak;
}

async function persistAndReply(
  admin: any,
  channelId: string | null,
  phone: string,
  profile: any,
  step: StepResult,
) {
  // 1) Se há log a salvar, salva com merge
  let scoreInfo: { score: number; label: string; streak: number } | null = null;
  if (step.saveLogFor) {
    const { date, log } = step.saveLogFor;
    const { data: existing } = await admin
      .from("score_daily_logs").select("*")
      .eq("user_id", profile.user_id).eq("date", date).maybeSingle();
    const merged: any = { user_id: profile.user_id, date };
    for (const f of SCORE_FIELDS) merged[f] = Number(log[f] ?? existing?.[f]) || 0;
    const { error: upErr } = await admin.from("score_daily_logs")
      .upsert(merged, { onConflict: "user_id,date" });
    if (upErr) console.error("upsert log error", upErr);
    if (step.markPenaltyZero) {
      await admin.from("score_profiles").update({ inactivity_penalty_days: 0 }).eq("user_id", profile.user_id);
    }
    const { score, label } = computeDayScore(merged);
    const streak = await computeStreak(admin, profile.user_id);
    scoreInfo = { score, label, streak };
  }

  // 2) Persistir sessão (upsert ou delete se encerrou)
  if (step.session) {
    await admin.from("bot_sessions").upsert(
      {
        phone,
        user_id: profile.user_id,
        flow_id: step.session.flow_id,
        current_node_id: step.session.current_node_id,
        variables: step.session.variables,
      },
      { onConflict: "phone" },
    );
  } else {
    await admin.from("bot_sessions").delete().eq("phone", phone);
  }

  // 3) Enviar mensagens (última pode ter placeholders de score)
  const streakLine = scoreInfo && scoreInfo.streak >= 2 ? `\n🔥 Streak: ${scoreInfo.streak} dias consecutivos!` : "";
  const finalMessages = step.messages.map((m) =>
    m
      .replace(/\{\{\s*score\s*\}\}/g, String(scoreInfo?.score ?? ""))
      .replace(/\{\{\s*score_label\s*\}\}/g, scoreInfo?.label ?? "")
      .replace(/\{\{\s*streak_line\s*\}\}/g, streakLine),
  );

  for (const msg of finalMessages) {
    if (!channelId) break;
    const r = await sendWhatsApp(channelId, phone, msg);
    await admin.from("score_whatsapp_messages").insert({
      user_id: profile.user_id,
      phone,
      direction: "out",
      kind: "bot_step",
      payload: { message: msg, ...(scoreInfo || {}) },
      error: r.ok ? null : r.error,
    });
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
  if (!WEBHOOK_TOKEN) return json({ error: "webhook token not configured" }, 500);
  const url = new URL(req.url);
  const token =
    req.headers.get("x-webhook-token") ??
    req.headers.get("X-Webhook-Token") ??
    url.searchParams.get("token");
  if (token !== WEBHOOK_TOKEN) return json({ error: "unauthorized" }, 401);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "invalid json" }, 400); }

  const rawPhone: string = pickPhone(body);
  const email = pickEmail(body);
  const message: string = pickMessage(body);
  if ((!rawPhone && !email) || !message) {
    // Registra payload não reconhecido para diagnóstico
    try {
      await createClient(SUPABASE_URL, SERVICE_KEY).from("score_whatsapp_messages").insert({
        phone: rawPhone || "unknown",
        direction: "in",
        kind: "invalid_payload",
        payload: { raw: body, reason: "phone/email or message missing" },
      });
    } catch {}
    return json({ error: "phone/email and message required", got: { hasPhone: !!rawPhone, hasEmail: !!email, hasMessage: !!message } }, 400);
  }

  const phone = normalizePhone(rawPhone);
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  console.log("[inbound] phone=", phone, "email=", email, "message=", JSON.stringify(message));

  await admin.from("score_whatsapp_messages").insert({
    phone: phone || "unknown", direction: "in", kind: "inbound",
    payload: { message, email, raw: body },
  });

  const { data: profiles } = await admin.from("score_profiles").select("user_id, full_name, email, phone").limit(500);
  const profile = (profiles || []).find((p: any) => {
    const pe = String(p.email || "").trim().toLowerCase();
    return (phone && phonesMatch(phone, p.phone || "")) || (email && pe === email);
  });

  const settings = await getAdminSettings(admin);
  const channelId = settings?.channel_id || null;

  // (removido) enforce agent inactive — quebrava o recebimento das mensagens
  // seguintes da mesma interação na GPT Maker.


  if (!profile) {
    if (channelId) await sendWhatsApp(channelId, phone,
      "Olá! Não encontrei seu cadastro no Score Comercial. Acesse a plataforma e complete seu perfil com esse número de WhatsApp.");
    return json({ ok: false, error: "profile not found" });
  }

  // Comando global: cancelar
  if (isCancelCommand(message)) {
    await admin.from("bot_sessions").delete().eq("phone", phone);
    if (channelId) await sendWhatsApp(channelId, phone, "Beleza, encerrei o registro. Quando quiser recomeçar, é só me chamar.");
    return json({ ok: true, cancelled: true });
  }

  // Busca sessão ativa
  const { data: sessionRow } = await admin.from("bot_sessions").select("*").eq("phone", phone).maybeSingle();

  // Se há sessão, continua o fluxo
  if (sessionRow && sessionRow.flow_id) {
    const { data: flowRow } = await admin.from("bot_flows").select("*").eq("id", sessionRow.flow_id).maybeSingle();
    if (flowRow && flowRow.is_active !== false) {
      const session: BotSession = {
        id: sessionRow.id,
        phone,
        user_id: profile.user_id,
        flow_id: flowRow.id,
        current_node_id: sessionRow.current_node_id,
        variables: sessionRow.variables || {},
      };
      const step = await continueSession(flowRow.graph, session, message, { profileName: profile.full_name });
      await persistAndReply(admin, channelId, phone, profile, step);
      return json({
        ok: true,
        mode: "continue",
        debug: {
          flow_id: flowRow.id,
          flow_name: flowRow.name,
          flow_priority: flowRow.priority ?? 0,
          current_node_id: sessionRow.current_node_id,
          matched_trigger: null,
        },
      });
    } else {
      // Sessão órfã (fluxo apagado ou desativado) — limpa e cai no match de gatilho.
      await admin.from("bot_sessions").delete().eq("phone", phone);
      console.log("[inbound] sessão órfã removida phone=", phone, "flow_id=", sessionRow.flow_id);
    }
  }

  // Sem sessão: tenta match de trigger contra fluxos ativos
  const { data: flowsRows } = await admin.from("bot_flows")
    .select("id, name, triggers, graph, priority").eq("is_active", true);
  const flows: BotFlow[] = (flowsRows || []).map((r: any) => ({
    id: r.id, name: r.name, triggers: r.triggers || [], graph: r.graph, priority: r.priority || 0,
  }));
  const matchedDebug = matchFlowDebug(flows, message);
  const matched = matchedDebug?.flow ?? null;
  console.log("[inbound] flows_ativos=", flows.length,
    "flows=", JSON.stringify(flows.map((f) => ({ name: f.name, priority: f.priority, triggers: f.triggers }))),
    "matched=", matched ? `${matched.name} (trigger=${matchedDebug?.trigger})` : "NONE");

  if (matched && matchedDebug) {
    const step = await startSession(matched, phone, profile.user_id, { profileName: profile.full_name });
    await persistAndReply(admin, channelId, phone, profile, step);
    return json({
      ok: true,
      mode: "start",
      flow: matched.name,
      debug: {
        flow_id: matched.id,
        flow_name: matched.name,
        flow_priority: matched.priority ?? 0,
        matched_trigger: matchedDebug.trigger,
        checked_flows: flows.map((f) => ({ id: f.id, name: f.name, priority: f.priority, triggers: f.triggers })),
      },
    });
  }

  // Fallback: parser one-shot rotulado (comportamento antigo)
  const parsed = parseWhatsAppLog(message);
  if (parsed.ok && parsed.log && parsed.matched >= 4) {
    const date = todayBRT();
    const { data: existing } = await admin.from("score_daily_logs")
      .select("*").eq("user_id", profile.user_id).eq("date", date).maybeSingle();
    const merged: any = { user_id: profile.user_id, date };
    for (const f of SCORE_FIELDS) merged[f] = Number((parsed.log as any)[f] ?? existing?.[f]) || 0;
    await admin.from("score_daily_logs").upsert(merged, { onConflict: "user_id,date" });
    await admin.from("score_profiles").update({ inactivity_penalty_days: 0 }).eq("user_id", profile.user_id);
    const { score, label } = computeDayScore(merged);
    const streak = await computeStreak(admin, profile.user_id);
    const firstName = (profile.full_name || "").split(" ")[0] || "";
    const streakLine = streak >= 2 ? `\n🔥 Streak: ${streak} dias consecutivos!` : "";
    const reply = `Registrado ✅\n\nScore de hoje: ${score}/100 (${label})${streakLine}\n\nContinua firme${firstName ? `, ${firstName}` : ""}!`;
    if (channelId) {
      await sendWhatsApp(channelId, phone, reply);
      await admin.from("score_whatsapp_messages").insert({
        user_id: profile.user_id, phone, direction: "out", kind: "reply_ok",
        payload: { message: reply, score, label, streak },
      });
    }
    return json({ ok: true, mode: "bulk", score, label, streak });
  }

  // Nada casou: ajuda
  if (channelId) {
    const help = `Não entendi 🤔\n\nDiga *registrar* para começar o registro de hoje, ou *registrar do dia 12/03* para uma data específica (até 7 dias atrás).\n\nDigite *cancelar* a qualquer momento para sair.`;
    await sendWhatsApp(channelId, phone, help);
    await admin.from("score_whatsapp_messages").insert({
      user_id: profile.user_id, phone, direction: "out", kind: "reply_help", payload: { message: help },
    });
  }
  return json({
    ok: false,
    error: "no match",
    debug: {
      matched_trigger: null,
      flow_id: null,
      flow_name: null,
      flow_priority: null,
      checked_flows: flows.map((f) => ({ id: f.id, name: f.name, priority: f.priority, triggers: f.triggers })),
    },
  });
});
