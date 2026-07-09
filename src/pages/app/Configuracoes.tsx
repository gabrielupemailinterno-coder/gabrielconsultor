import { useState } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { PageHeader } from "@/components/app/PageHeader";
import { SectionCard } from "@/components/app/SectionCard";
import { StatusBadge } from "@/components/app/StatusBadge";
import { useSessionRoles } from "@/hooks/useSessionRoles";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, ShieldCheck, KeyRound, Copy, Check, Phone } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function Configuracoes() {
  const { session, roles } = useSessionRoles();
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);
  const [accessLink, setAccessLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const authEmail = session?.user?.email || "";
  const phone = (session?.user?.user_metadata?.phone as string) || (session?.user?.phone as string) || "";

  const generateAccessLink = async () => {
    if (!authEmail) return;
    setGenerating(true);
    // Gera link seguro real via admin API (edge fn) e dispara o evento
    // `user.password_reset_link` para a automação externa entregar via WhatsApp.
    const { data, error } = await supabase.functions.invoke("emit-password-link", {
      body: {
        email: authEmail,
        kind: "reset",
        origin: window.location.origin,
        return_link: true,
      },
    });
    setGenerating(false);
    if (error || !data?.link) {
      toast.error("Não foi possível gerar o link agora.");
      return;
    }
    setAccessLink(data.link as string);
    toast.success("Link de acesso gerado. A automação externa entregará ao cliente.");
  };

  const copyLink = async () => {
    if (!accessLink) return;
    await navigator.clipboard.writeText(accessLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
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
                <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  WhatsApp / Telefone
                </dt>
                <dd className="mt-1 flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="truncate">
                    {phone || <span className="text-muted-foreground">não informado</span>}
                  </span>
                </dd>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Canal principal de comunicação. Toda mensagem é enviada por integração externa.
                </p>
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
              {authEmail && (
                <div className="sm:col-span-2">
                  <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Contato de autenticação
                  </dt>
                  <dd className="mt-1 text-xs font-mono text-muted-foreground truncate">
                    {authEmail}
                  </dd>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Dado técnico usado apenas para acesso à plataforma. A comunicação com o cliente
                    é sempre pelo WhatsApp via automação externa.
                  </p>
                </div>
              )}
            </dl>
          </SectionCard>

          <SectionCard
            title="Segurança"
            description="Gere um link de acesso seguro para redefinição ou entrada."
          >
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                O link poderá ser copiado ou disparado pela sua integração externa de WhatsApp.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={generateAccessLink}
                  disabled={generating}
                  className="text-xs inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-md disabled:opacity-60"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  {generating ? "Gerando…" : "Gerar link seguro"}
                </button>
                {accessLink && (
                  <button
                    onClick={copyLink}
                    className="text-xs inline-flex items-center gap-1.5 bg-muted hover:bg-muted/70 px-3 py-2 rounded-md"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copiado" : "Copiar link"}
                  </button>
                )}
              </div>
              {accessLink && (
                <div className="text-[11px] font-mono bg-muted/50 border border-border rounded-md p-2 break-all">
                  {accessLink}
                </div>
              )}
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

