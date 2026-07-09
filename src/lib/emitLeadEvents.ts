import { supabase } from "@/integrations/supabase/client";

/**
 * Dispara os eventos padronizados para um lead recém-criado.
 * Sempre emite `lead.created`; adiciona `score.lead.created` quando o lead
 * tem interesse no Score Comercial. Não bloqueia o fluxo do formulário.
 */
export async function emitLeadEvents(leadId: string): Promise<void> {
  try {
    await supabase.functions.invoke("emit-lead-events", { body: { lead_id: leadId } });
  } catch (e) {
    console.warn("[emitLeadEvents] failed", e);
  }
}
