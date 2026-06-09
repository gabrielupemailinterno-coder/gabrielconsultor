import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, User, MapPin, CreditCard, FileCheck2, Pencil, Download, ShieldCheck } from "lucide-react";
import { downloadTermoPdf } from "@/components/TermoAdesao";
import { toast } from "@/hooks/use-toast";

type Profile = {
  full_name: string;
  email: string;
  phone: string | null;
  cpf: string | null;
  postal_code: string | null;
  address: string | null;
  address_number: string | null;
  address_complement: string | null;
  province: string | null;
  city: string | null;
  state: string | null;
  access_mode: string;
  payment_status: string;
  payment_updated_at: string | null;
  terms_accepted_at: string | null;
  terms_version: string | null;
  started_at: string | null;
  asaas_customer_id: string | null;
};

const ACCESS_LABEL: Record<string, string> = {
  full: "Acesso completo",
  trial_then_paid: "3 primeiros grátis + pagamento",
  friend_promo: "Promoção Amigo (1º mês cortesia + 15% off)",
};

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-0.5 min-w-0">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm break-words">{value && value.trim() ? value : <span className="text-muted-foreground italic">—</span>}</p>
    </div>
  );
}

export default function PerfilTab({ menteeId, onOpenCheckout, onPasswordChanged }: { menteeId: string; onOpenCheckout?: () => void; onPasswordChanged?: () => void }) {
  const [p, setP] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("mentees")
        .select("full_name,email,phone,cpf,postal_code,address,address_number,address_complement,province,city,state,access_mode,payment_status,payment_updated_at,terms_accepted_at,terms_version,started_at,asaas_customer_id")
        .eq("id", menteeId)
        .maybeSingle();
      setP((data as any) ?? null);
      setLoading(false);
    })();
  }, [menteeId]);

  const savePassword = async () => {
    if (pwd.length < 8) { toast({ title: "Senha curta", description: "Mínimo de 8 caracteres.", variant: "destructive" }); return; }
    if (pwd !== pwd2) { toast({ title: "Senhas diferentes", description: "A confirmação não confere.", variant: "destructive" }); return; }
    setSavingPwd(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    if (error) {
      setSavingPwd(false);
      toast({ title: "Não foi possível alterar", description: error.message, variant: "destructive" });
      return;
    }
    await supabase.from("mentees").update({ password_changed_at: new Date().toISOString() } as any).eq("id", menteeId);
    setSavingPwd(false);
    setPwd(""); setPwd2("");
    toast({ title: "Senha atualizada", description: "Use a nova senha no próximo login." });
    onPasswordChanged?.();
  };


  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div>;
  if (!p) return <p className="text-sm text-muted-foreground">Perfil não encontrado.</p>;

  const paid = p.payment_status === "paid";
  const enderecoCompleto = [p.address, p.address_number].filter(Boolean).join(", ");
  const bairroCidade = [p.province, p.city && `${p.city}${p.state ? `/${p.state}` : ""}`].filter(Boolean).join(" — ");

  return (
    <div className="space-y-5">
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-semibold flex items-center gap-2"><User size={15} /> Dados pessoais</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Nome completo" value={p.full_name} />
          <Field label="E-mail" value={p.email} />
          <Field label="WhatsApp" value={p.phone} />
          <Field label="CPF" value={p.cpf} />
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2"><MapPin size={15} /> Endereço de cobrança</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="CEP" value={p.postal_code} />
          <Field label="Endereço" value={enderecoCompleto} />
          <Field label="Complemento" value={p.address_complement} />
          <Field label="Bairro / Cidade" value={bairroCidade} />
        </div>
        {(!p.postal_code || !p.address || !p.cpf) && (
          <div className="flex items-center gap-2 text-xs text-amber-500">
            <Pencil size={13} /> Complete seus dados ao gerar o pagamento.
          </div>
        )}
      </Card>

      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-semibold flex items-center gap-2"><CreditCard size={15} /> Pagamento e acesso</h3>
          <Badge variant="outline" className={paid
            ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
            : "bg-amber-500/15 text-amber-600 border-amber-500/30"}>
            {paid ? "Pago" : "Pendente"}
          </Badge>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Modalidade" value={ACCESS_LABEL[p.access_mode] ?? p.access_mode} />
          <Field label="Início da mentoria" value={p.started_at ? new Date(p.started_at).toLocaleDateString("pt-BR") : null} />
          <Field label="Última atualização do pagamento" value={p.payment_updated_at ? new Date(p.payment_updated_at).toLocaleString("pt-BR") : null} />
          <Field label="ID cliente Asaas" value={p.asaas_customer_id} />
        </div>
        {!paid && p.access_mode !== "full" && onOpenCheckout && (
          <Button size="sm" onClick={onOpenCheckout}>Fazer pagamento</Button>
        )}
      </Card>

      <Card className="p-5 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2"><FileCheck2 size={15} /> Termo de Adesão</h3>
        {p.terms_accepted_at ? (
          <div className="text-sm space-y-2">
            <p className="text-emerald-500">✓ Aceito em {new Date(p.terms_accepted_at).toLocaleString("pt-BR")}</p>
            {p.terms_version && <p className="text-xs text-muted-foreground">Versão {p.terms_version}</p>}
            <p className="text-xs text-muted-foreground">Inclui multa de 2%, juros de 1% a.m. em atraso, suspensão dos serviços e notificações de cobrança.</p>
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() => downloadTermoPdf({
                name: p.full_name, cpf: p.cpf, email: p.email,
                address: p.address, address_number: p.address_number,
                address_complement: p.address_complement, province: p.province,
                city: p.city, state: p.state, postal_code: p.postal_code,
                access_mode: undefined,
                accessMode: p.access_mode as any,
                acceptedAt: p.terms_accepted_at,
              } as any)}
            >
              <Download size={14} /> Baixar PDF do termo
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Você ainda não aceitou o termo. Ele é apresentado no momento do pagamento.</p>
        )}
      </Card>
    </div>
  );
}
