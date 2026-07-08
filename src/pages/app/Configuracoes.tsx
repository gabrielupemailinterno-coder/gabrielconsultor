import { useEffect, useState } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { PageHeader } from "@/components/app/PageHeader";
import { SectionCard } from "@/components/app/SectionCard";
import { StatusBadge } from "@/components/app/StatusBadge";
import { useSessionRoles } from "@/hooks/useSessionRoles";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function Configuracoes() {
  const { session, roles } = useSessionRoles();
  const navigate = useNavigate();
  const [sending, setSending] = useState(false);

  const email = session?.user?.email || "";

  const sendReset = async () => {
    if (!email) return;
    setSending(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/app/redefinir-senha`,
    });
    setSending(false);
    if (error) return toast.error("Não foi possível enviar o link.");
    toast.success("Link de redefinição enviado para " + email);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/app/login", { replace: true });
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto p-6">
        <PageHeader
          eyebrow="Sua conta"
          title="Configurações"
          description="Informações da conta, segurança e sessão."
        />

        <div className="space-y-4">
          <SectionCard title="Identificação">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">E-mail</dt>
                <dd className="mt-1 flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="truncate">{email}</span>
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">Papéis</dt>
                <dd className="mt-1 flex flex-wrap gap-1">
                  {roles.length === 0 ? (
                    <StatusBadge tone="neutral">sem módulos</StatusBadge>
                  ) : (
                    roles.map((r) => (
                      <StatusBadge key={r} tone="info">
                        <ShieldCheck className="h-2.5 w-2.5" /> {r}
                      </StatusBadge>
                    ))
                  )}
                </dd>
              </div>
            </dl>
          </SectionCard>

          <SectionCard title="Segurança" description="Redefinir sua senha por e-mail.">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Enviaremos um link único para <span className="text-foreground">{email}</span>.
              </p>
              <button
                onClick={sendReset}
                disabled={sending}
                className="text-xs bg-primary text-primary-foreground px-3 py-2 rounded-md disabled:opacity-60"
              >
                {sending ? "Enviando…" : "Enviar link"}
              </button>
            </div>
          </SectionCard>

          <SectionCard title="Sessão">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">Encerrar sessão neste dispositivo.</p>
              <button
                onClick={logout}
                className="text-xs inline-flex items-center gap-1 bg-muted hover:bg-muted/70 px-3 py-2 rounded-md"
              >
                <LogOut className="h-3.5 w-3.5" /> Sair
              </button>
            </div>
          </SectionCard>
        </div>
      </div>
    </AppLayout>
  );
}
