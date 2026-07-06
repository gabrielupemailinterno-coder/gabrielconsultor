import type { DailyLog, ScoreGoals } from "./types";
import { sum, monthLogs, computeConversions, computeConsistency } from "./calc";

export type TriggerKey =
  | "consistencia_baixa"
  | "volume_prospeccao"
  | "abordagem_baixa"
  | "reunioes_baixas"
  | "propostas_baixas"
  | "fechamento_baixo"
  | "follow_up"
  | "evolucao"
  | "convite_diagnostico";

function daysSinceLastLog(logs: DailyLog[]): number {
  if (logs.length === 0) return 999;
  const last = logs
    .map((l) => new Date(l.date + "T00:00:00").getTime())
    .sort((a, b) => b - a)[0];
  return Math.floor((Date.now() - last) / 864e5);
}

function weekLogs(logs: DailyLog[], weeksAgo = 0): DailyLog[] {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - now.getDay() - 7 * weeksAgo);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return logs.filter((l) => {
    const d = new Date(l.date + "T00:00:00");
    return d >= start && d < end;
  });
}

export function recommendTrigger(logs: DailyLog[], goals: ScoreGoals | null): TriggerKey {
  // 1. Consistência: 2+ dias sem registrar
  if (daysSinceLastLog(logs) >= 2) return "consistencia_baixa";

  const mLogs = monthLogs(logs);
  const c = computeConversions(mLogs);
  const cons = computeConsistency(logs);
  const daysElapsed = new Date().getDate();

  // 8. Evolução semanal (comparar semana atual vs anterior)
  const wThis = computeConversions(weekLogs(logs, 0));
  const wPrev = computeConversions(weekLogs(logs, 1));
  const improved = wPrev.atividades > 0 && (
    wThis.propToVenda > wPrev.propToVenda + 5 ||
    wThis.vendaTotal > wPrev.vendaTotal + 3 ||
    wThis.valor > wPrev.valor * 1.15
  );

  // 2. Volume prospecção abaixo da meta
  if (goals) {
    const metaProspDia = Math.max(goals.ligacoes_dia, 0) + Math.max(goals.whatsapps_dia, 0);
    const esperado = metaProspDia * daysElapsed * 0.6; // 60% da meta acumulada
    if (metaProspDia > 0 && c.prospeccoes < esperado) return "volume_prospeccao";
  } else if (c.prospeccoes < 20) {
    return "volume_prospeccao";
  }

  // 3. Abordagem: muita prospecção, poucos contatos
  if (c.prospeccoes >= 20 && c.prospToContato < 20) return "abordagem_baixa";

  // 4. Reuniões: contatos ok, reuniões baixas
  if (c.contatos >= 10 && c.contatoToReuniao < 25) return "reunioes_baixas";

  // 5. Propostas: apresentações ok, propostas baixas
  if (c.apresentacoes >= 4 && c.apresToProposta < 40) return "propostas_baixas";

  // 6. Fechamento: propostas ok, vendas baixas
  if (c.propostas >= 3 && c.propToVenda < 25) return "fechamento_baixo";

  // 7. Follow-up: propostas sem venda proporcional
  if (c.propostas >= 3 && c.vendas === 0) return "follow_up";

  // 8. Evolução
  if (improved) return "evolucao";

  // 9. Convite diagnóstico para engajados
  if (cons.last30 >= 7) return "convite_diagnostico";

  return "volume_prospeccao";
}
