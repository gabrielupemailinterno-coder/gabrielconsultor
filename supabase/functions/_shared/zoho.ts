// Shared Zoho Mail sender for all edge functions.
// Refreshes OAuth access token and POSTs to the Zoho Mail REST API.

const REGION = Deno.env.get("ZOHO_REGION") || "com";
const CLIENT_ID = Deno.env.get("ZOHO_CLIENT_ID")!;
const CLIENT_SECRET = Deno.env.get("ZOHO_CLIENT_SECRET")!;
const REFRESH_TOKEN = Deno.env.get("ZOHO_REFRESH_TOKEN")!;
const ACCOUNT_ID = Deno.env.get("ZOHO_ACCOUNT_ID")!;
const DEFAULT_FROM = "gabriel@gabrielconsultor.com";

const ACCOUNTS_BASE = `https://accounts.zoho.${REGION}`;
const MAIL_BASE = `https://mail.zoho.${REGION}/api`;

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    refresh_token: REFRESH_TOKEN,
  });
  const res = await fetch(`${ACCOUNTS_BASE}/oauth/v2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(`Zoho token refresh failed: ${JSON.stringify(data)}`);
  }
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
  return cachedToken.token;
}

export interface SendZohoEmailParams {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  fromName?: string;
  cc?: string;
  bcc?: string;
  replyTo?: string;
}

export async function sendZohoEmail(
  p: SendZohoEmailParams,
): Promise<{ ok: true; messageId: string } | { ok: false; error: unknown }> {
  try {
    const token = await getAccessToken();
    const fromAddr = p.from ?? DEFAULT_FROM;
    const formattedFrom = p.fromName
      ? `${p.fromName} <${fromAddr}>`
      : fromAddr;

    const body: Record<string, unknown> = {
      fromAddress: formattedFrom,
      toAddress: p.to,
      subject: p.subject,
      content: p.html || p.text || "",
      mailFormat: p.html ? "html" : "plaintext",
    };
    if (p.cc) body.ccAddress = p.cc;
    if (p.bcc) body.bccAddress = p.bcc;
    if (p.replyTo) body.replyTo = p.replyTo;

    const res = await fetch(`${MAIL_BASE}/accounts/${ACCOUNT_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok || data?.status?.code !== 200) {
      return { ok: false, error: data };
    }
    return { ok: true, messageId: data?.data?.messageId ?? "" };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
