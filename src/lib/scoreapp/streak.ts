import type { DailyLog } from "./types";
import { todayBRT } from "./tz";

/** Conta dias consecutivos com registro até hoje (BRT). */
export function computeStreakBRT(logs: DailyLog[]): number {
  const set = new Set(logs.map((l) => l.date));
  const today = todayBRT();
  let streak = 0;
  const start = new Date(today + "T00:00:00Z");
  for (let i = 0; i < 365; i++) {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (set.has(key)) streak++;
    else if (i > 0) break;
    else continue;
  }
  return streak;
}

/** Dias desde o último registro (0 se registrou hoje). */
export function daysSinceLastLogBRT(logs: DailyLog[]): number {
  if (logs.length === 0) return 999;
  const dates = logs.map((l) => l.date).sort();
  const last = dates[dates.length - 1];
  const today = todayBRT();
  const a = new Date(last + "T00:00:00Z").getTime();
  const b = new Date(today + "T00:00:00Z").getTime();
  return Math.max(0, Math.round((b - a) / 86400000));
}
