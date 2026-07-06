// Simula a execução de um fluxo enviando as mensagens dele passo-a-passo para
// um número de teste (sem consumir input do usuário).
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendWhatsApp, normalizePhone } from "../_shared/gpt-maker.ts";
import { BotFlow, startSession } from "../_shared/bot-engine.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getAdminSettings(admin: ReturnType<typeof createClient>) {
  const { data: settingsRows, error: settingsErr } = await admin
    .from("settings")
    .select("channel_id, delay_seconds, updated_at")
    .not("channel_id", "is", null)
    .neq("channel_id", "")
    .order("updated_at", { ascending: false })
    .limit(1);
  if (settingsErr) return { settings: null, error: settingsErr.message };
  if (settingsRows?.[0]) return { settings: settingsRows[0], error: null };

  const { data: fallbackRows, error: fallbackErr } = await admin
    .from("settings")
    .select("channel_id, delay_seconds, updated_at")
    .order("updated_at", { ascending: false })
    .limit(1);
  if (fallbackErr) return { settings: null, error: fallbackErr.message };
  return { settings: fallbackRows?.[0] || null, error: null };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const { flowId, phone, name } = await req.json();
  if (!flowId || !phone) {
    return json({ ok: false, error: "flowId and phone required" }, 400);
  }

  const { data: flowRow, error: flowErr } = await admin.from("bot_flows").select("*").eq("id", flowId).maybeSingle();
  if (flowErr) return json({ ok: false, error: `Erro ao buscar fluxo: ${flowErr.message}` }, 200);
  if (!flowRow) return json({ ok: false, error: "flow not found" }, 200);

  const { settings, error: settingsError } = await getAdminSettings(admin);
  if (settingsError) return json({ ok: false, error: `Erro ao buscar configurações: ${settingsError}` }, 200);
  const channelId = settings?.channel_id;
  if (!channelId) return json({ ok: false, error: "Channel ID não configurado nas configurações do WhatsApp" }, 200);

  const normalized = normalizePhone(phone);
  const flow: BotFlow = { id: flowRow.id, name: flowRow.name, triggers: flowRow.triggers, graph: flowRow.graph, priority: 0 };

  // Executa só até a primeira pergunta (ou fim) — mesmo comportamento real do bot.
  const step = await startSession(flow, normalized, null, { profileName: name || "Teste" });
  if (step.messages.length === 0) {
    return json({
      ok: false,
      error: "O fluxo não gerou nenhuma mensagem. Verifique se existe caminho do início até uma mensagem/pergunta/fim.",
      sent: [],
    });
  }

  const sent: { message: string; ok: boolean; error?: string; status?: number; endpoint?: string; chatId?: string }[] = [];
  let chatId: string | null = null;
  for (const msg of step.messages) {
    const preview = `[TESTE ${flow.name}]\n\n${msg}`;
    const result = await sendWhatsApp(channelId, normalized, preview, { chatId });
    if (!chatId && result.chatId) chatId = result.chatId;
    sent.push({ message: preview, ok: result.ok, error: result.error, status: result.status, endpoint: result.endpoint, chatId: result.chatId });
    if (step.messages.length > 1) {
      await new Promise((r) => setTimeout(r, (settings?.delay_seconds ?? 2) * 1000));
    }
  }
  const failed = sent.find((item) => !item.ok);
  return json({
    ok: !failed,
    error: failed?.error || null,
    phone: normalized,
    channelId,
    chatId,
    sent,
  });
});
