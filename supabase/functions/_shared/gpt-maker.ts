// Helpers para conversar com a GPT Maker (envio, resolução de chat, humanTalk).
const TOKEN = Deno.env.get("GPT_MAKER_API_TOKEN");
const BASE = "https://api.gptmaker.ai";

export function normalizePhone(raw: string): string {
  const digits = (raw || "").replace(/\D+/g, "");
  if (!digits) return "";
  if (digits.startsWith("55")) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

export type SendResult = {
  ok: boolean;
  error?: string;
  status?: number;
  endpoint?: string;
  attempts?: number;
  chatId?: string;
};

const RETRIABLE = new Set([408, 425, 429, 500, 502, 503, 504]);

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  { retries = 2, timeoutMs = 15000 }: { retries?: number; timeoutMs?: number } = {},
): Promise<{ res: Response | null; text: string; attempts: number; error?: string }> {
  let lastText = "";
  let lastRes: Response | null = null;
  let lastErr: string | undefined;
  const delays = [0, 500, 1500];
  const total = Math.min(retries + 1, delays.length);
  for (let i = 0; i < total; i++) {
    if (delays[i]) await new Promise((r) => setTimeout(r, delays[i]));
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...init, signal: ctrl.signal });
      const text = await res.text();
      clearTimeout(timer);
      lastRes = res;
      lastText = text;
      if (res.ok) return { res, text, attempts: i + 1 };
      if (!RETRIABLE.has(res.status)) return { res, text, attempts: i + 1 };
    } catch (e) {
      clearTimeout(timer);
      lastErr = e instanceof Error ? e.message : String(e);
    }
  }
  return { res: lastRes, text: lastText, attempts: total, error: lastErr };
}

function authHeaders(extra?: Record<string, string>) {
  return {
    Authorization: `Bearer ${TOKEN}`,
    "Content-Type": "application/json",
    ...(extra || {}),
  };
}

// Tenta abrir/obter o chat para o número no canal e devolver o chatId.
export async function resolveChatId(channelId: string, phone: string): Promise<string | null> {
  if (!TOKEN || !channelId || !phone) return null;
  const attempts = [
    { url: `${BASE}/v2/channel/${channelId}/start-chat`, body: { contactIdentifier: phone } },
    { url: `${BASE}/v2/channel/${channelId}/start-chat`, body: { phone } },
  ];
  for (const a of attempts) {
    const { res, text } = await fetchWithRetry(a.url, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(a.body),
    }, { retries: 1 });
    if (!res || !res.ok) continue;
    try {
      const j = JSON.parse(text);
      const id = j?.chatId || j?.id || j?.chat?.id || j?.data?.chatId || j?.data?.id;
      if (id) return String(id);
    } catch { /* ignore */ }
  }
  return null;
}

export async function sendMessageToChat(chatId: string, message: string): Promise<SendResult> {
  const endpoint = `${BASE}/v2/chat/${chatId}/send-message`;
  const { res, text, attempts, error } = await fetchWithRetry(endpoint, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ message }),
  });
  if (!res) return { ok: false, error: error || "network error", endpoint, attempts, chatId };
  if (!res.ok) return { ok: false, status: res.status, error: text.slice(0, 300), endpoint, attempts, chatId };
  return { ok: true, status: res.status, endpoint, attempts, chatId };
}

// Envio principal: tenta rota chat/send-message; se falhar, cai no legado start-conversation.
export async function sendWhatsApp(
  channelId: string,
  phone: string,
  message: string,
  opts?: { chatId?: string | null },
): Promise<SendResult> {
  if (!TOKEN) return { ok: false, error: "GPT_MAKER_API_TOKEN not configured" };
  if (!channelId) return { ok: false, error: "channel_id missing" };
  if (!phone) return { ok: false, error: "phone missing" };

  let chatId = opts?.chatId || null;
  if (!chatId) chatId = await resolveChatId(channelId, phone);
  if (chatId) {
    const r = await sendMessageToChat(chatId, message);
    if (r.ok) return r;
    // se falhou, tenta fallback abaixo
  }

  const endpoint = `${BASE}/v2/channel/${channelId}/start-conversation`;
  const { res, text, attempts, error } = await fetchWithRetry(endpoint, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ phone, message, contact: { phone } }),
  });
  if (!res) return { ok: false, error: error || "network error", endpoint, attempts, chatId: chatId || undefined };
  if (!res.ok) return { ok: false, status: res.status, error: text.slice(0, 300), endpoint, attempts, chatId: chatId || undefined };
  try {
    const j = JSON.parse(text);
    if (j?.success === false) {
      return { ok: false, status: res.status, error: text.slice(0, 300), endpoint, attempts, chatId: chatId || undefined };
    }
  } catch { /* text response */ }
  return { ok: true, status: res.status, endpoint, attempts, chatId: chatId || undefined };
}

// Silencia o agente em um chat específico (handoff humano) durante o fluxo.
export async function startHuman(chatId: string): Promise<{ ok: boolean; status?: number; error?: string }> {
  if (!TOKEN || !chatId) return { ok: false, error: "missing token or chatId" };
  const paths = [
    `${BASE}/v2/chat/${chatId}/start-human`,
    `${BASE}/v2/chat/${chatId}/human`,
  ];
  for (const url of paths) {
    const { res, text } = await fetchWithRetry(url, {
      method: "POST",
      headers: authHeaders(),
      body: "{}",
    }, { retries: 1 });
    if (res?.ok) return { ok: true, status: res.status };
    if (res && res.status !== 404) return { ok: false, status: res.status, error: text.slice(0, 200) };
  }
  return { ok: false, error: "no human endpoint accepted" };
}

export async function stopHuman(chatId: string): Promise<{ ok: boolean; status?: number; error?: string }> {
  if (!TOKEN || !chatId) return { ok: false, error: "missing token or chatId" };
  const paths = [
    `${BASE}/v2/chat/${chatId}/stop-human`,
    `${BASE}/v2/chat/${chatId}/bot`,
  ];
  for (const url of paths) {
    const { res, text } = await fetchWithRetry(url, {
      method: "POST",
      headers: authHeaders(),
      body: "{}",
    }, { retries: 1 });
    if (res?.ok) return { ok: true, status: res.status };
    if (res && res.status !== 404) return { ok: false, status: res.status, error: text.slice(0, 200) };
  }
  return { ok: false, error: "no human endpoint accepted" };
}

// Retorna a data "hoje" no fuso America/Sao_Paulo em formato YYYY-MM-DD
export function todayBRT(): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date());
}

export function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00Z").getTime();
  const db = new Date(b + "T00:00:00Z").getTime();
  return Math.round((db - da) / 86400000);
}
