// Parser de resposta livre no WhatsApp para score_daily_logs.
// Aceita 3 formatos:
//   1) Linhas rotuladas: "Ligações: 20\nWhatsApps: 30\nReuniões: 3..."
//   2) Sequência numérica na ordem canônica: 20 30 5 3 2 1 12500
//   3) "0" / "zero" / "não vendi" → dia zerado

export type ParsedLog = {
  ligacoes: number;
  whatsapps: number;
  prospeccoes: number;
  contatos_efetivos: number;
  reunioes_agendadas: number;
  apresentacoes: number;
  propostas: number;
  vendas: number;
  valor_vendido: number;
};

const ALIASES: Record<keyof ParsedLog, RegExp[]> = {
  ligacoes: [/liga[cç][oõ]es?/i, /\bcalls?\b/i, /\bligou\b/i],
  whatsapps: [/whats?a?p?p?s?/i, /\bzaps?\b/i, /mensagens?/i],
  prospeccoes: [/prospec[cç][oõ]es?/i, /\bprospec/i, /\babordagens?/i, /leads?/i],
  contatos_efetivos: [/contatos?\s*(efetivos?)?/i, /conversas?/i, /respondeu/i],
  reunioes_agendadas: [/reuni[oõ]es?/i, /meetings?/i, /\bmeets?\b/i, /agendadas?/i],
  apresentacoes: [/apresenta[cç][oõ]es?/i, /demos?/i, /pitch/i],
  propostas: [/propostas?/i, /or[cç]amentos?/i, /pdf/i],
  vendas: [/vendas?/i, /fech(ei|ou|amentos?)/i, /clientes?\s*novos?/i],
  valor_vendido: [/valor/i, /faturamento/i, /vendido/i, /r\$/i, /receita/i],
};

const ORDER: (keyof ParsedLog)[] = [
  "ligacoes", "whatsapps", "prospeccoes", "contatos_efetivos",
  "reunioes_agendadas", "apresentacoes", "propostas", "vendas", "valor_vendido",
];

function parseNumber(raw: string): number {
  if (!raw) return 0;
  let s = raw.trim().toLowerCase().replace(/r\$\s*/g, "");
  // "12k" → 12000
  const kMatch = s.match(/^([\d.,]+)\s*k$/);
  if (kMatch) return Math.round(parseFloat(kMatch[1].replace(/\./g, "").replace(",", ".")) * 1000);
  // BRL: "12.500,00" ou "12,500.00"
  if (/,\d{1,2}$/.test(s)) s = s.replace(/\./g, "").replace(",", ".");
  else s = s.replace(/,/g, "");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

export function parseWhatsAppLog(text: string): { ok: boolean; log?: ParsedLog; matched: number } {
  const clean = (text || "").trim();
  if (!clean) return { ok: false, matched: 0 };

  // Caso "não vendi / zero / 0"
  if (/^(0|zero|nada|n[aã]o\s*vendi|dia\s*zerado)$/i.test(clean)) {
    return {
      ok: true,
      matched: 1,
      log: {
        ligacoes: 0, whatsapps: 0, prospeccoes: 0, contatos_efetivos: 0,
        reunioes_agendadas: 0, apresentacoes: 0, propostas: 0, vendas: 0, valor_vendido: 0,
      },
    };
  }

  const empty: ParsedLog = {
    ligacoes: 0, whatsapps: 0, prospeccoes: 0, contatos_efetivos: 0,
    reunioes_agendadas: 0, apresentacoes: 0, propostas: 0, vendas: 0, valor_vendido: 0,
  };

  const found: Partial<Record<keyof ParsedLog, number>> = {};
  const lines = clean.split(/[\n;]+/).map((l) => l.trim()).filter(Boolean);

  // 1) Linhas rotuladas
  for (const line of lines) {
    const m = line.match(/^([^:=\-]+)\s*[:=\-]\s*(.+)$/);
    if (!m) continue;
    const label = m[1].trim();
    const value = m[2].trim();
    for (const key of ORDER) {
      if (found[key] !== undefined) continue;
      if (ALIASES[key].some((rx) => rx.test(label))) {
        found[key] = parseNumber(value);
        break;
      }
    }
  }

  const labeledCount = Object.keys(found).length;

  // 2) Fallback: sequência de números soltos na ordem canônica
  if (labeledCount === 0) {
    const nums = (clean.match(/[\d.,]+k?/gi) || []).map(parseNumber);
    if (nums.length >= 4) {
      for (let i = 0; i < Math.min(nums.length, ORDER.length); i++) {
        found[ORDER[i]] = nums[i];
      }
    }
  }

  const matched = Object.keys(found).length;
  if (matched === 0) return { ok: false, matched: 0 };

  return { ok: true, matched, log: { ...empty, ...found } };
}
