import type { DailyLog, ScoreGoals } from "./types";
import { monthLogs, computeConversions, computeConsistency } from "./calc";

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

export type TriggerHit = {
  key: TriggerKey;
  reason: string;
  severity: number; // 0-100, quanto maior mais crítico
};

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
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return logs.filter((l) => {
    const d = new Date(l.date + "T00:00:00");
    return d >= start && d < end;
  });
}

/**
 * Retorna todos os feedbacks aplicáveis ao usuário, ordenados por severidade.
 * Um feedback só é retornado quando os dados indicam claramente que faz sentido.
 */
export function evaluateTriggers(logs: DailyLog[], goals: ScoreGoals | null): TriggerHit[] {
  const hits: TriggerHit[] = [];

  // Usuário novo demais: só volume conta
  if (logs.length === 0) {
    hits.push({ key: "volume_prospeccao", severity: 95, reason: "Você ainda não registrou nenhuma atividade." });
    return hits;
  }

  const daysSince = daysSinceLastLog(logs);
  const mLogs = monthLogs(logs);
  const c = computeConversions(mLogs);
  const cons = computeConsistency(logs);
  const daysElapsed = new Date().getDate();

  // 1. Consistência — 2+ dias sem registrar
  if (daysSince >= 2) {
    hits.push({
      key: "consistencia_baixa",
      severity: 100,
      reason: `Você está há ${daysSince} dias sem registrar atividades.`,
    });
  }

  // 2. Volume de prospecção abaixo da meta acumulada
  if (goals) {
    const metaProspDia = Math.max(goals.ligacoes_dia, 0) + Math.max(goals.whatsapps_dia, 0);
    if (metaProspDia > 0) {
      const esperado = metaProspDia * daysElapsed * 0.6;
      if (c.prospeccoes < esperado) {
        hits.push({
          key: "volume_prospeccao",
          severity: 90,
          reason: `Você fez ${c.prospeccoes} prospecções no mês (esperado ~${Math.round(esperado)}).`,
        });
      }
    }
  } else if (c.prospeccoes < 20 && logs.length >= 3) {
    hits.push({
      key: "volume_prospeccao",
      severity: 85,
      reason: `Apenas ${c.prospeccoes} prospecções registradas no mês.`,
    });
  }

  // 3. Abordagem fraca — muita prospecção, poucos contatos efetivos
  if (c.prospeccoes >= 20 && c.prospToContato < 20) {
    hits.push({
      key: "abordagem_baixa",
      severity: 80,
      reason: `Apenas ${c.prospToContato.toFixed(0)}% das suas prospecções viram contato efetivo.`,
    });
  }

  // 4. Reuniões — contatos ok, reuniões baixas
  if (c.contatos >= 10 && c.contatoToReuniao < 25) {
    hits.push({
      key: "reunioes_baixas",
      severity: 78,
      reason: `Só ${c.contatoToReuniao.toFixed(0)}% dos seus contatos viraram reunião.`,
    });
  }

  // 5. Propostas — apresentações ok, poucas propostas
  if (c.apresentacoes >= 4 && c.apresToProposta < 40) {
    hits.push({
      key: "propostas_baixas",
      severity: 75,
      reason: `Apenas ${c.apresToProposta.toFixed(0)}% das suas apresentações viram proposta.`,
    });
  }

  // 6. Fechamento — propostas ok mas conversão baixa
  if (c.propostas >= 3 && c.propToVenda < 25 && c.vendas > 0) {
    hits.push({
      key: "fechamento_baixo",
      severity: 82,
      reason: `Sua taxa de fechamento está em ${c.propToVenda.toFixed(0)}%.`,
    });
  }

  // 7. Follow-up — propostas sem venda nenhuma
  if (c.propostas >= 3 && c.vendas === 0) {
    hits.push({
      key: "follow_up",
      severity: 88,
      reason: `Você enviou ${c.propostas} propostas e ainda não fechou nenhuma venda.`,
    });
  }

  // 8. Evolução semanal
  const wThis = computeConversions(weekLogs(logs, 0));
  const wPrev = computeConversions(weekLogs(logs, 1));
  const improved =
    wPrev.atividades > 0 &&
    (wThis.propToVenda > wPrev.propToVenda + 5 ||
      wThis.vendaTotal > wPrev.vendaTotal + 3 ||
      wThis.valor > wPrev.valor * 1.15);
  if (improved) {
    hits.push({
      key: "evolucao",
      severity: 60,
      reason: "Seus indicadores melhoraram em relação à semana passada.",
    });
  }

  // 9. Convite para diagnóstico — só para engajados com dados suficientes
  if (cons.last30 >= 7 && logs.length >= 7) {
    hits.push({
      key: "convite_diagnostico",
      severity: 40,
      reason: "Você já tem dados suficientes para uma análise individual do seu funil.",
    });
  }

  return hits.sort((a, b) => b.severity - a.severity);
}

/** Trigger principal (mais crítico) — usado no dashboard. */
export function recommendTrigger(logs: DailyLog[], goals: ScoreGoals | null): TriggerKey | null {
  const hits = evaluateTriggers(logs, goals);
  return hits[0]?.key ?? null;
}
