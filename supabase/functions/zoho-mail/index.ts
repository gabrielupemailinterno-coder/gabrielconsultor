// Zoho Mail integration — send, list, search, get emails via Zoho REST API
// Uses refresh token flow; access tokens are cached in memory for ~55min.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const REGION = Deno.env.get("ZOHO_REGION") || "com";
const CLIENT_ID = Deno.env.get("ZOHO_CLIENT_ID")!;
const CLIENT_SECRET = Deno.env.get("ZOHO_CLIENT_SECRET")!;
const REFRESH_TOKEN = Deno.env.get("ZOHO_REFRESH_TOKEN")!;
const ACCOUNT_ID = Deno.env.get("ZOHO_ACCOUNT_ID")!;

const ACCOUNTS_BASE = `https://accounts.zoho.${REGION}`;
const MAIL_BASE = `https://mail.zoho.${REGION}/api`;

// In-memory access token cache (per cold start)
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

async function zohoFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = await getAccessToken();
  return fetch(`${MAIL_BASE}${path}`, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Zoho-oauthtoken ${token}`,
      "Content-Type": "application/json",
    },
  });
}

type Action =
  | { action: "send"; from?: string; to: string; cc?: string; bcc?: string; subject: string; html?: string; text?: string; replyTo?: string }
  | { action: "list"; folder?: string; limit?: number; start?: number; status?: "unread" | "read" | "all" }
  | { action: "get"; messageId: string; folderId?: string }
  | { action: "search"; query: string; limit?: number }
  | { action: "folders" }
  | { action: "markRead"; messageId: string; folderId: string }
  | { action: "delete"; messageId: string; folderId: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const payload = (await req.json()) as Action;

    let result: unknown;

    switch (payload.action) {
      case "send": {
        const fromAddress = payload.from || "gabriel@gabrielconsultor.com";
        const body = {
          fromAddress,
          toAddress: payload.to,
          ccAddress: payload.cc,
          bccAddress: payload.bcc,
          subject: payload.subject,
          content: payload.html || payload.text || "",
          mailFormat: payload.html ? "html" : "plaintext",
          ...(payload.replyTo ? { replyTo: payload.replyTo } : {}),
        };
        const res = await zohoFetch(`/accounts/${ACCOUNT_ID}/messages`, {
          method: "POST",
          body: JSON.stringify(body),
        });
        result = await res.json();
        if (!res.ok) {
          return new Response(JSON.stringify({ error: result }), {
            status: res.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        break;
      }

      case "list": {
        const params = new URLSearchParams({
          limit: String(payload.limit ?? 20),
          start: String(payload.start ?? 1),
          status: payload.status ?? "all",
        });
        if (payload.folder) params.set("folderId", payload.folder);
        const res = await zohoFetch(
          `/accounts/${ACCOUNT_ID}/messages/view?${params}`,
        );
        result = await res.json();
        break;
      }

      case "get": {
        const folder = payload.folderId ?? "";
        const res = await zohoFetch(
          `/accounts/${ACCOUNT_ID}/folders/${folder}/messages/${payload.messageId}/content`,
        );
        result = await res.json();
        break;
      }

      case "search": {
        const params = new URLSearchParams({
          searchKey: payload.query,
          limit: String(payload.limit ?? 20),
        });
        const res = await zohoFetch(
          `/accounts/${ACCOUNT_ID}/messages/search?${params}`,
        );
        result = await res.json();
        break;
      }

      case "folders": {
        const res = await zohoFetch(`/accounts/${ACCOUNT_ID}/folders`);
        result = await res.json();
        break;
      }

      case "markRead": {
        const res = await zohoFetch(
          `/accounts/${ACCOUNT_ID}/updatemessage`,
          {
            method: "PUT",
            body: JSON.stringify({
              mode: "markAsRead",
              messageId: [payload.messageId],
            }),
          },
        );
        result = await res.json();
        break;
      }

      case "delete": {
        const res = await zohoFetch(
          `/accounts/${ACCOUNT_ID}/folders/${payload.folderId}/messages/${payload.messageId}`,
          { method: "DELETE" },
        );
        result = res.ok ? { success: true } : await res.json();
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: "Unknown action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("zoho-mail error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
