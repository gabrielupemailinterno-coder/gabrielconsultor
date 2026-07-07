import { supabase } from "@/integrations/supabase/client";

/**
 * Emite um evento para o dispatcher de integrações.
 * Não-bloqueante: nunca quebra o fluxo do usuário se falhar.
 */
export async function emitEvent(event: string, data: Record<string, any>): Promise<void> {
  try {
    await supabase.functions.invoke("integrations-dispatch", {
      body: { event, data },
    });
  } catch (e) {
    console.warn("[integrations] emit failed", event, e);
  }
}
