import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "mentee" | "partner" | "scoreapp_user" | "escola_user";

export type Module = "admin" | "mentee" | "partner" | "scoreapp" | "escola";

const roleToModule: Record<AppRole, Module> = {
  admin: "admin",
  mentee: "mentee",
  partner: "partner",
  scoreapp_user: "scoreapp",
  escola_user: "escola",
};

export const moduleRoute: Record<Module, string> = {
  admin: "/app/admin",
  mentee: "/app/mentorados",
  partner: "/app/parceiro",
  scoreapp: "/app/score",
  escola: "/escola/conteudos",
};

export const moduleLabel: Record<Module, string> = {
  admin: "Administração",
  mentee: "Mentoria Comercial",
  partner: "Parceiros",
  scoreapp: "Score Comercial",
  escola: "Escola de Vendedores",
};

export const roleLabel: Record<AppRole, string> = {
  admin: "Administrador",
  mentee: "Mentorado",
  partner: "Parceiro",
  scoreapp_user: "Usuário Score",
  escola_user: "Aluno Escola",
};

export function useSessionRoles() {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadRoles(uid: string | undefined) {
      if (!uid) {
        if (!cancelled) setRoles([]);
        return;
      }
      const { data } = await (supabase as any)
        .from("user_roles")
        .select("role")
        .eq("user_id", uid);
      if (!cancelled) {
        setRoles(((data as { role: AppRole }[]) || []).map((r) => r.role));
      }
    }

    // Register listener FIRST, then hydrate current session (Supabase best practice).
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s);
      // Defer the roles fetch out of the callback to avoid deadlocks.
      setTimeout(() => loadRoles(s?.user?.id), 0);
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      loadRoles(data.session?.user?.id).finally(() => {
        if (!cancelled) setLoading(false);
      });
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const modules: Module[] = Array.from(new Set(roles.map((r) => roleToModule[r]).filter(Boolean)));

  return { session, roles, modules, loading };
}
