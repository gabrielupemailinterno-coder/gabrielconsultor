import type { DailyLog, ScoreGoals } from "./types";

export const sum = (logs: DailyLog[], k: keyof DailyLog) =>
  logs.reduce((a, l) => a + (Number(l[k]) || 0), 0);

export function monthLogs(logs: DailyLog[], ref = new Date()): DailyLog[] {
  const y = ref.getFullYear(), m = ref.getMonth();
  return logs.filter((l) => {
    const d = new Date(l.date + "T00:00:00");
    return d.getFullYear() === y && d.getMonth() === m;
  });
}

export function computeConversions(logs: DailyLog[]) {
  const prospeccoes = sum(logs, "prospeccoes");
  const contatos = sum(logs, "contatos_efetivos");
  const reunioes = sum(logs, "reunioes_agendadas");
  const apresentacoes = sum(logs, "apresentacoes");
  const propostas = sum(logs, "propostas");
  const vendas = sum(logs, "vendas");
  const valor = sum(logs, "valor_vendido");
  const atividades = sum(logs, "ligacoes") + sum(logs, "whatsapps");
  const abordagemBase = prospeccoes >= contatos ? prospeccoes : atividades > 0 ? atividades : Math.max(prospeccoes, contatos);
  const r = (a: number, b: number) => (b > 0 ? Math.min(100, (a / b) * 100) : 0);
  return {
    prospeccoes, contatos, reunioes, apresentacoes, propostas, vendas, valor, atividades, abordagemBase,
    prospToContato: r(contatos, abordagemBase),
    contatoToReuniao: r(reunioes, contatos),
    reuniaoToApresentacao: r(apresentacoes, reunioes),
    apresToProposta: r(propostas, apresentacoes),
    propToVenda: r(vendas, propostas),
    vendaTotal: r(vendas, abordagemBase),
    ticketMedio: vendas > 0 ? valor / vendas : 0,
    valorPorAtividade: atividades > 0 ? valor / atividades : 0,
  };
}

export function computeDiagnostics(logs: DailyLog[], _goals: ScoreGoals | null): string[] {
  if (logs.length < 3) return ["Você tem poucos registros. Antes de ajustar técnica, aumente volume e constância."];
  const c = computeConversions(logs);
  const out: string[] = [];
  if (c.abordagemBase > 20 && c.prospToContato < 20) out.push("Seu gargalo está na abordagem inicial — muitas abordagens e poucos contatos efetivos.");
  if (c.contatos > 10 && c.contatoToReuniao < 25) out.push("Seu gargalo está na conversão de contato para reunião.");
  if (c.apresentacoes > 4 && c.apresToProposta < 40) out.push("Seu gargalo pode estar na qualificação ou condução da apresentação.");
  if (c.propostas > 3 && c.propToVenda < 25) out.push("Seu gargalo está na negociação e fechamento.");
  if (c.atividades < 20) out.push("Volume baixo de atividades. Aumente ligações e whatsapps antes de otimizar técnica.");
  if (out.length === 0) out.push("Indicadores saudáveis. Continue medindo e ajustando semanalmente.");
  return out;
}

export function computeConsistency(logs: DailyLog[]): { streak: number; last30: number } {
  const set = new Set(logs.map((l) => l.date));
  let streak = 0;
  for (let i = 0; i < 60; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (set.has(key)) streak++;
    else if (i > 0) break;
  }
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
  const last30 = logs.filter((l) => new Date(l.date) >= cutoff).length;
  return { streak, last30 };
}

export function computeScore(logs: DailyLog[], goals: ScoreGoals | null, penaltyDays = 0): { score: number; faixa: string } {
  const mLogs = monthLogs(logs);
  const c = computeConversions(mLogs);
  const cons = computeConsistency(logs);
  const daysElapsed = new Date().getDate();
  const consistencia = Math.min(1, cons.last30 / Math.max(1, Math.min(30, daysElapsed))) * 25;
  const metaBatida = goals && goals.meta_mensal_valor > 0
    ? Math.min(1, c.valor / goals.meta_mensal_valor) * 25
    : (c.vendas > 0 ? 12 : 0);
  const conv = Math.min(1, (c.propToVenda / 30)) * 20;
  const volume = Math.min(1, c.atividades / (goals ? (goals.ligacoes_dia + goals.whatsapps_dia) * daysElapsed : 200)) * 15;
  const resultado = Math.min(1, c.vendas / (goals?.meta_vendas || 10)) * 15;
  const penalty = Math.min(20, Math.max(0, penaltyDays) * 2);
  const score = Math.max(0, Math.round(consistencia + metaBatida + conv + volume + resultado - penalty));
  const faixa = score < 40 ? "Iniciante sem consistência"
    : score < 60 ? "Em construção"
    : score < 75 ? "Comercial em evolução"
    : score < 90 ? "Alta performance"
    : "Vendedor de elite";
  return { score, faixa };
}


export function computeDayScore(log: DailyLog, goals: ScoreGoals | null): { score: number; label: string } {
  const alvoAtiv = Math.max(1, (goals?.ligacoes_dia || 20) + (goals?.whatsapps_dia || 20));
  const atividades = (log.ligacoes || 0) + (log.whatsapps || 0);
  const vol = Math.min(1, atividades / alvoAtiv) * 30;
  const prosp = Math.min(1, (log.prospeccoes || 0) / 5) * 15;
  const reun = Math.min(1, (log.reunioes_agendadas || 0) / 2) * 20;
  const fech =
    (log.vendas || 0) > 0
      ? 35
      : (log.propostas || 0) > 0
      ? 15
      : (log.apresentacoes || 0) > 0
      ? 8
      : 0;
  const score = Math.round(vol + prosp + reun + fech);
  const label =
    score < 30 ? "Fraco" : score < 55 ? "Regular" : score < 75 ? "Bom" : score < 90 ? "Ótimo" : "Excelente";
  return { score, label };
}

export const BADGES: Record<string, string> = {
  primeiro_registro: "Primeiro registro",
  streak_7: "7 dias de consistência",
  streak_30: "30 dias de consistência",
  primeira_venda: "Primeira venda registrada",
  ligacoes_100: "100 ligações",
  ligacoes_500: "500 ligações",
  ligacoes_1000: "1000 ligações",
  meta_semanal: "Meta semanal batida",
  meta_mensal: "Meta mensal batida",
};

export function evaluateBadges(logs: DailyLog[], goals: ScoreGoals | null): string[] {
  const earned: string[] = [];
  if (logs.length >= 1) earned.push("primeiro_registro");
  const cons = computeConsistency(logs);
  if (cons.streak >= 7) earned.push("streak_7");
  if (cons.streak >= 30) earned.push("streak_30");
  if (sum(logs, "vendas") >= 1) earned.push("primeira_venda");
  const lig = sum(logs, "ligacoes");
  if (lig >= 100) earned.push("ligacoes_100");
  if (lig >= 500) earned.push("ligacoes_500");
  if (lig >= 1000) earned.push("ligacoes_1000");
  if (goals?.meta_mensal_valor && sum(monthLogs(logs), "valor_vendido") >= goals.meta_mensal_valor) earned.push("meta_mensal");
  return earned;
}

export function computeTemperature(logs: DailyLog[], goals: ScoreGoals | null, hasContacts: boolean): "frio" | "ativacao" | "engajado" | "quente" {
  const cons = computeConsistency(logs);
  if (cons.last30 === 0) return "frio";
  if (cons.last30 < 5) return "ativacao";
  const diag = computeDiagnostics(logs, goals);
  const hasGargalo = diag.some((d) => d.toLowerCase().includes("gargalo"));
  if (cons.last30 >= 7 && goals && hasGargalo && hasContacts) return "quente";
  return "engajado";
}

export const fmtBRL = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const fmtPct = (n: number) => `${n.toFixed(1)}%`;
