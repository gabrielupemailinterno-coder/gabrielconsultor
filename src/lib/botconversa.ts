import { supabase } from "@/integrations/supabase/client";

export async function sendBotConversaLead(nome: string, telefone: string): Promise<void> {
  try {
    await supabase.functions.invoke("botconversa-lead", {
      body: { nome, telefone },
    });
  } catch (e) {
    // Non-blocking: never break the user flow if the webhook fails
    console.warn("[botconversa] webhook failed", e);
  }
}
