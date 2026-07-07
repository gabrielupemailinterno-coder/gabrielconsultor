import { supabase } from "@/integrations/supabase/client";

export async function sendBotConversaLead(nome: string, telefone: string, eventType?: string): Promise<void> {
  try {
    const body: Record<string, string> = { nome, telefone };
    if (eventType) body.event_type = eventType;
    await supabase.functions.invoke("botconversa-lead", { body });
  } catch (e) {
    // Non-blocking: never break the user flow if the webhook fails
    console.warn("[botconversa] webhook failed", e);
  }
}
