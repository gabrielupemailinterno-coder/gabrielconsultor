// Parser de datas em português para o bot conversacional.
// Aceita: hoje | ontem | anteontem | dd/mm | dd/mm/aaaa | dd-mm | dd-mm-aaaa
// Restrição: até 7 dias no passado, sem futuro.
import { todayBRT } from "./gpt-maker.ts";

export type ParsedDate =
  | { ok: true; date: string; label: string }
  | { ok: false; reason: string };

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function toBR(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function parseUserDate(text: string): ParsedDate {
  const t = (text || "").trim().toLowerCase();
  if (!t) return { ok: false, reason: "Vazio" };
  const today = todayBRT();

  if (/^hoje\b/.test(t)) return { ok: true, date: today, label: toBR(today) };
  if (/^ontem\b/.test(t)) {
    const d = addDaysISO(today, -1);
    return { ok: true, date: d, label: toBR(d) };
  }
  if (/^anteontem\b/.test(t)) {
    const d = addDaysISO(today, -2);
    return { ok: true, date: d, label: toBR(d) };
  }

  const m = t.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/);
  if (!m) return { ok: false, reason: "Não entendi a data. Tenta 'ontem', 'anteontem' ou 12/03." };

  const dd = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  let yyyy = m[3] ? parseInt(m[3], 10) : parseInt(today.slice(0, 4), 10);
  if (yyyy < 100) yyyy += 2000;

  if (dd < 1 || dd > 31 || mm < 1 || mm > 12) return { ok: false, reason: "Data inválida." };
  let iso = `${yyyy}-${pad(mm)}-${pad(dd)}`;
  // se ficou no futuro e não veio ano explícito, tenta ano anterior
  if (!m[3] && iso > today) iso = `${yyyy - 1}-${pad(mm)}-${pad(dd)}`;

  // valida janela
  const min = addDaysISO(today, -7);
  if (iso > today) return { ok: false, reason: "Não dá pra registrar data futura." };
  if (iso < min) return { ok: false, reason: "Só consigo registrar até 7 dias atrás." };

  return { ok: true, date: iso, label: toBR(iso) };
}

export { toBR };
