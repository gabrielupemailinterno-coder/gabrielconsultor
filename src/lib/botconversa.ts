const WEBHOOK_URL =
  import.meta.env.VITE_BOTCONVERSA_WEBHOOK_URL ||
  "https://new-backend.botconversa.com.br/api/v1/webhooks-automation/catch/195152/eTId4HMCWYmw/";

export async function sendBotConversaLead(nome: string, telefone: string): Promise<void> {
  try {
    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, telefone }),
      keepalive: true,
    });
  } catch (e) {
    // Non-blocking: never break the user flow if the webhook fails
    console.warn("[botconversa] webhook failed", e);
  }
}
