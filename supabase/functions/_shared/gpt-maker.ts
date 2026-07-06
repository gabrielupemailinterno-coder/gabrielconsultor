// Shared helper to send WhatsApp messages via GPT Maker.
const TOKEN = Deno.env.get("GPT_MAKER_API_TOKEN");

export function normalizePhone(raw: string): string {
  const digits = (raw || "").replace(/\D+/g, "");
  if (!digits) return "";
  if (digits.startsWith("55")) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

export async function sendWhatsApp(
  channelId: string,
  phone: string,
  message: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!TOKEN) return { ok: false, error: "GPT_MAKER_API_TOKEN not configured" };
  if (!channelId) return { ok: false, error: "channel_id missing" };
  try {
    const r = await fetch(
      `https://api.gptmaker.ai/v2/channel/${channelId}/start-conversation`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({ phone, message }),
      },
    );
    const t = await r.text();
    if (!r.ok) return { ok: false, error: `HTTP ${r.status}: ${t.slice(0, 300)}` };
    try {
      const j = JSON.parse(t);
      if (j?.success === false) return { ok: false, error: t.slice(0, 300) };
    } catch { /* text response */ }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
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
