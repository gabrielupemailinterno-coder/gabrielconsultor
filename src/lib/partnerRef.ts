// Utility for reading/writing the persisted partner attribution reference.
// Captured from ?ref= or ?partner= querystring and kept 30 days.

const KEY = "partner_ref";
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type PartnerRef = { code: string; ts: number };

export function savePartnerRef(code: string) {
  if (typeof window === "undefined") return;
  const c = code.trim();
  if (!c) return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ code: c, ts: Date.now() } as PartnerRef));
    // Also expose as cookie for edge functions / SSR consumers
    const maxAge = Math.floor(TTL_MS / 1000);
    document.cookie = `${KEY}=${encodeURIComponent(c)}; path=/; max-age=${maxAge}; samesite=lax`;
  } catch {
    // ignore storage errors
  }
}

export function getPartnerRef(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PartnerRef;
    if (!parsed?.code) return null;
    if (Date.now() - parsed.ts > TTL_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    return parsed.code;
  } catch {
    return null;
  }
}

export function clearPartnerRef() {
  try {
    localStorage.removeItem(KEY);
    document.cookie = `${KEY}=; path=/; max-age=0`;
  } catch {
    // ignore
  }
}

export function buildPartnerUrl(slug: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/r/${slug}`;
}

export function generateSlug(label: string, partnerCode?: string): string {
  const base = [partnerCode, label]
    .filter(Boolean)
    .join("-")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42);
  const suffix =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 6)
      : Math.random().toString(36).slice(2, 8);
  return `${base || "link"}-${suffix}`;
}
