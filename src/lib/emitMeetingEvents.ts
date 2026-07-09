import { supabase } from "@/integrations/supabase/client";

/**
 * Emite eventos de ciclo de vida da reunião (agendada / concluída).
 * Não-bloqueante: nunca quebra o fluxo se falhar.
 */
export async function emitMeetingEvent(
  meetingId: string,
  kind: "scheduled" | "completed",
): Promise<void> {
  try {
    await supabase.functions.invoke("emit-meeting-events", {
      body: { meeting_id: meetingId, kind },
    });
  } catch (e) {
    console.warn("[integrations] meeting event failed", kind, e);
  }
}
