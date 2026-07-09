import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

export type ImpersonationKind = "mentee" | "score" | "partner";

export type ImpersonationState = {
  kind: ImpersonationKind;
  userId: string;
  name: string;
  email?: string | null;
} | null;

type Ctx = {
  impersonation: ImpersonationState;
  setImpersonation: (v: ImpersonationState) => void;
  clear: () => void;
};

const STORAGE_KEY = "gc-impersonation-v1";

const ImpersonationContext = createContext<Ctx | undefined>(undefined);

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const [impersonation, setState] = useState<ImpersonationState>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const setImpersonation = useCallback((v: ImpersonationState) => {
    setState(v);
    try {
      if (v) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(v));
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch {}
    // Notify listeners in same tab
    window.dispatchEvent(new CustomEvent("gc:impersonation-changed"));
  }, []);

  const clear = useCallback(() => setImpersonation(null), [setImpersonation]);

  useEffect(() => {
    const onChange = () => {
      try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        setState(raw ? JSON.parse(raw) : null);
      } catch {
        setState(null);
      }
    };
    window.addEventListener("gc:impersonation-changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("gc:impersonation-changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  return (
    <ImpersonationContext.Provider value={{ impersonation, setImpersonation, clear }}>
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonation() {
  const ctx = useContext(ImpersonationContext);
  if (!ctx) throw new Error("useImpersonation must be used inside ImpersonationProvider");
  return ctx;
}

/** Returns the effective user_id for a specific view, honoring impersonation. */
export function useEffectiveUserId(kind: ImpersonationKind, sessionUserId: string | null | undefined) {
  const { impersonation } = useImpersonation();
  if (impersonation && impersonation.kind === kind) return impersonation.userId;
  return sessionUserId ?? null;
}
