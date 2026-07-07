// BotConversa API client. Docs: https://backend.botconversa.com.br/swagger/
// Endpoints usados (v1/webhook):
//   POST /subscriber/                                    -> cria assinante
//   GET  /subscriber/get_by_phone/{phone}/               -> busca por telefone
//   POST /subscriber/{id}/send_flow/                     -> inicia fluxo { flow: id }
//   POST /subscriber/{id}/send_message/                  -> envia texto { type: 'text', value }
//   POST /subscriber/{id}/tags/{tag_id}/                 -> adiciona tag
//   DELETE /subscriber/{id}/tags/{tag_id}/               -> remove tag
//   POST /subscriber/{id}/custom_fields/                 -> { field: name, value }
// A auth é feita pelo header `API-KEY: <BOTCONVERSA_API_KEY>`.
import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

const BASE_URL = Deno.env.get("BOTCONVERSA_BASE_URL") || "https://backend.botconversa.com.br/api/v1/webhook";
const API_KEY = Deno.env.get("BOTCONVERSA_API_KEY") || "";

export const FLOW_IDS = {
  onboarding: Deno.env.get("BOTCONVERSA_ONBOARDING_FLOW_ID") || "",
  dailyCheckin: Deno.env.get("BOTCONVERSA_DAILY_CHECKIN_FLOW_ID") || "",
  talkToGabriel: Deno.env.get("BOTCONVERSA_TALK_TO_GABRIEL_FLOW_ID") || "",
  assistant: Deno.env.get("BOTCONVERSA_ASSISTANT_FLOW_ID") || "",
  default: Deno.env.get("BOTCONVERSA_DEFAULT_FLOW_ID") || "",
};

function admin(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

/** Normaliza para dígitos-only no formato aceito pelo BotConversa (ex: 5532999998888). */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length >= 12 && digits.startsWith("55")) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  if (digits.length >= 11 && digits.length <= 15) return digits;
  return null;
}

async function bcFetch(path: string, init: RequestInit = {}): Promise<{ ok: boolean; status: number; body: any }> {
  if (!API_KEY) throw new Error("BOTCONVERSA_API_KEY não configurado");
  const url = `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    "API-KEY": API_KEY,
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  const res = await fetch(url, { ...init, headers });
  const text = await res.text();
  let body: any = text;
  try { body = text ? JSON.parse(text) : null; } catch { /* keep text */ }
  return { ok: res.ok, status: res.status, body };
}

export async function logEvent(entry: {
  user_id?: string | null;
  phone?: string | null;
  direction: "inbound" | "outbound";
  event_type: string;
  payload?: unknown;
  response?: unknown;
  status?: string;
  error_message?: string | null;
}): Promise<void> {
  try {
    await admin().from("botconversa_integration_logs").insert({
      user_id: entry.user_id ?? null,
      phone: entry.phone ?? null,
      direction: entry.direction,
      event_type: entry.event_type,
      payload: entry.payload ?? null,
      response: entry.response ?? null,
      status: entry.status ?? null,
      error_message: entry.error_message ?? null,
    });
  } catch (e) {
    console.error("botconversa logEvent failed:", e);
  }
}

export async function getSubscriberByPhone(phone: string): Promise<{ id?: string | number; raw: any } | null> {
  const p = normalizePhone(phone);
  if (!p) return null;
  const r = await bcFetch(`/subscriber/get_by_phone/${p}/`, { method: "GET" });
  if (!r.ok) return null;
  const id = r.body?.id ?? r.body?.subscriber_id ?? r.body?.data?.id;
  return { id, raw: r.body };
}

export interface SubscriberInput {
  phone: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

export async function createOrUpdateSubscriber(input: SubscriberInput): Promise<{ id: string | number | null; created: boolean; raw: any }> {
  const phone = normalizePhone(input.phone);
  if (!phone) throw new Error("telefone inválido");
  const existing = await getSubscriberByPhone(phone);
  if (existing?.id) return { id: existing.id, created: false, raw: existing.raw };
  const r = await bcFetch(`/subscriber/`, {
    method: "POST",
    body: JSON.stringify({
      phone,
      first_name: input.first_name || "",
      last_name: input.last_name || "",
    }),
  });
  const id = r.body?.id ?? r.body?.subscriber_id ?? null;
  return { id, created: r.ok, raw: r.body };
}

export async function sendTextMessage(subscriberId: string | number, message: string) {
  return bcFetch(`/subscriber/${subscriberId}/send_message/`, {
    method: "POST",
    body: JSON.stringify({ type: "text", value: message }),
  });
}

export async function startFlow(subscriberId: string | number, flowId: string) {
  if (!flowId) throw new Error("flow_id vazio — configure o secret correspondente no BotConversa");
  return bcFetch(`/subscriber/${subscriberId}/send_flow/`, {
    method: "POST",
    body: JSON.stringify({ flow: flowId }),
  });
}

export async function setCustomField(subscriberId: string | number, field: string, value: string | number | boolean | null) {
  return bcFetch(`/subscriber/${subscriberId}/custom_fields/`, {
    method: "POST",
    body: JSON.stringify({ field, value: value == null ? "" : String(value) }),
  });
}

export async function addTag(subscriberId: string | number, tagId: string) {
  return bcFetch(`/subscriber/${subscriberId}/tags/${tagId}/`, { method: "POST" });
}

export async function removeTag(subscriberId: string | number, tagId: string) {
  return bcFetch(`/subscriber/${subscriberId}/tags/${tagId}/`, { method: "DELETE" });
}

/** Sincroniza usuário do Score no BotConversa: cria/atualiza subscriber, salva ID no perfil, aplica custom fields. */
export async function syncScoreUser(userId: string): Promise<{ ok: boolean; subscriber_id?: string | number | null; error?: string }> {
  const db = admin();
  const { data: profile, error } = await db
    .from("score_profiles")
    .select("user_id, full_name, email, phone, plan, plan_started_at, plan_expires_at, botconversa_subscriber_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !profile) {
    await logEvent({ user_id: userId, direction: "outbound", event_type: "sync_user", status: "error", error_message: error?.message || "perfil não encontrado" });
    return { ok: false, error: "perfil não encontrado" };
  }
  if (!profile.phone) {
    await logEvent({ user_id: userId, direction: "outbound", event_type: "sync_user", status: "skipped", error_message: "sem telefone" });
    return { ok: false, error: "usuário sem telefone" };
  }

  try {
    const [first, ...rest] = (profile.full_name || "").trim().split(/\s+/);
    const sub = await createOrUpdateSubscriber({
      phone: profile.phone,
      first_name: first || profile.full_name || "Contato",
      last_name: rest.join(" ") || "",
      email: profile.email || "",
    });
    if (sub.id) {
      await db.from("score_profiles").update({ botconversa_subscriber_id: String(sub.id) }).eq("user_id", userId);
      // Custom fields (best-effort)
      const fields: Array<[string, string]> = [
        ["nome", profile.full_name || ""],
        ["email", profile.email || ""],
        ["telefone", normalizePhone(profile.phone) || ""],
        ["plano", profile.plan || "free"],
        ["status_assinatura", profile.plan_expires_at && new Date(profile.plan_expires_at) > new Date() ? "ativa" : "inativa"],
        ["data_inicio_assinatura", profile.plan_started_at ? String(profile.plan_started_at).slice(0, 10) : ""],
        ["data_fim_assinatura", profile.plan_expires_at ? String(profile.plan_expires_at).slice(0, 10) : ""],
      ];
      for (const [f, v] of fields) {
        try { await setCustomField(sub.id, f, v); } catch { /* ignore */ }
      }
    }
    await logEvent({ user_id: userId, phone: profile.phone, direction: "outbound", event_type: "sync_user", status: "ok", response: sub.raw });
    return { ok: true, subscriber_id: sub.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await logEvent({ user_id: userId, phone: profile.phone, direction: "outbound", event_type: "sync_user", status: "error", error_message: msg });
    return { ok: false, error: msg };
  }
}

async function resolveSubscriberId(userId: string): Promise<{ subscriberId: string | number | null; phone: string | null }> {
  const db = admin();
  const { data: p } = await db
    .from("score_profiles")
    .select("phone, botconversa_subscriber_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (p?.botconversa_subscriber_id) return { subscriberId: p.botconversa_subscriber_id, phone: p.phone };
  const sync = await syncScoreUser(userId);
  return { subscriberId: sync.subscriber_id ?? null, phone: p?.phone ?? null };
}

async function triggerFlowForUser(userId: string, flowId: string, eventType: string) {
  if (!flowId) {
    await logEvent({ user_id: userId, direction: "outbound", event_type: eventType, status: "error", error_message: "flow_id não configurado" });
    return { ok: false, error: "flow_id não configurado" };
  }
  const { subscriberId, phone } = await resolveSubscriberId(userId);
  if (!subscriberId) {
    await logEvent({ user_id: userId, phone, direction: "outbound", event_type: eventType, status: "error", error_message: "sem subscriber" });
    return { ok: false, error: "usuário não sincronizado no BotConversa" };
  }
  try {
    const r = await startFlow(subscriberId, flowId);
    await logEvent({ user_id: userId, phone, direction: "outbound", event_type: eventType, status: r.ok ? "ok" : "error", response: r.body, error_message: r.ok ? null : `HTTP ${r.status}` });
    return { ok: r.ok, response: r.body };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await logEvent({ user_id: userId, phone, direction: "outbound", event_type: eventType, status: "error", error_message: msg });
    return { ok: false, error: msg };
  }
}

export const sendDailyCheckin = (userId: string) => triggerFlowForUser(userId, FLOW_IDS.dailyCheckin, "daily_checkin");
export const sendOnboarding = (userId: string) => triggerFlowForUser(userId, FLOW_IDS.onboarding, "onboarding");
export const sendTalkToGabrielFlow = (userId: string) => triggerFlowForUser(userId, FLOW_IDS.talkToGabriel, "talk_to_gabriel");
export const sendAssistantFlow = (userId: string) => triggerFlowForUser(userId, FLOW_IDS.assistant, "assistant");

export async function sendScoreDiagnosis(userId: string, diagnosis: string, score: number) {
  const { subscriberId, phone } = await resolveSubscriberId(userId);
  if (!subscriberId) return { ok: false, error: "sem subscriber" };
  const msg = `Registro salvo. Seu Score de hoje: ${score}/100.\n\n${diagnosis}\n\nAcesse seu painel para ver a análise completa.`;
  const r = await sendTextMessage(subscriberId, msg);
  await logEvent({ user_id: userId, phone, direction: "outbound", event_type: "score_diagnosis", status: r.ok ? "ok" : "error", response: r.body });
  return { ok: r.ok };
}

/** Verifica se JWT do usuário é admin (para endpoints administrativos). */
export async function requireAdminUser(req: Request): Promise<{ userId: string } | Response> {
  const auth = req.headers.get("Authorization") || "";
  const jwt = auth.replace(/^Bearer\s+/i, "");
  if (!jwt) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  const db = admin();
  const { data: u } = await db.auth.getUser(jwt);
  if (!u?.user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  const { data: role } = await db.from("user_roles").select("role").eq("user_id", u.user.id).eq("role", "admin").maybeSingle();
  if (!role) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { "Content-Type": "application/json" } });
  return { userId: u.user.id };
}

/** Verifica JWT válido de qualquer usuário autenticado. */
export async function requireAuthUser(req: Request): Promise<{ userId: string } | Response> {
  const auth = req.headers.get("Authorization") || "";
  const jwt = auth.replace(/^Bearer\s+/i, "");
  if (!jwt) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  const db = admin();
  const { data: u } = await db.auth.getUser(jwt);
  if (!u?.user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  return { userId: u.user.id };
}

export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}
