import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function CheckoutDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", cpf: "",
    postalCode: "", addressNumber: "", address: "", addressComplement: "",
    province: "", city: "", state: "",
  });
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((s) => ({ ...s, [k]: e.target.value }));

  // Auto-fill address from ViaCEP when 8 digits typed
  const onCepBlur = async () => {
    const cep = form.postalCode.replace(/\D/g, "");
    if (cep.length !== 8) return;
    try {
      const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const j = await r.json();
      if (!j.erro) setForm((s) => ({
        ...s,
        address: j.logradouro || s.address,
        province: j.bairro || s.province,
        city: j.localidade || s.city,
        state: j.uf || s.state,
      }));
    } catch { /* ignore */ }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("asaas-create-checkout", {
      body: {
        name: form.name, email: form.email, phone: form.phone, cpfCnpj: form.cpf.replace(/\D/g, ""),
        postalCode: form.postalCode, addressNumber: form.addressNumber,
        address: form.address, addressComplement: form.addressComplement,
        province: form.province, city: form.city, state: form.state,
      },
    });
    setLoading(false);
    const payload = data as any;
    const invoiceUrl = payload?.invoiceUrl;
    if (error || !invoiceUrl) {
      const msg = payload?.error || error?.message || "Não foi possível gerar o checkout.";
      toast.error(msg);
      return;
    }
    window.location.href = invoiceUrl;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mentoria Comercial 1:1</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Assinatura mensal · 3x de R$ 187,00 · 6 encontros em 3 meses
          </p>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <Input placeholder="Nome completo" value={form.name} onChange={set("name")} required />
          <div className="grid grid-cols-2 gap-3">
            <Input type="email" placeholder="E-mail" value={form.email} onChange={set("email")} required />
            <Input placeholder="WhatsApp (com DDD)" value={form.phone} onChange={set("phone")} required />
          </div>
          <Input placeholder="CPF" value={form.cpf} onChange={set("cpf")} required />

          <div className="pt-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Endereço de cobrança
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input
              placeholder="CEP"
              value={form.postalCode}
              onChange={set("postalCode")}
              onBlur={onCepBlur}
              required
            />
            <Input className="col-span-2" placeholder="Endereço (rua/avenida)" value={form.address} onChange={set("address")} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input placeholder="Número" value={form.addressNumber} onChange={set("addressNumber")} required />
            <Input className="col-span-2" placeholder="Complemento (opcional)" value={form.addressComplement} onChange={set("addressComplement")} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input placeholder="Bairro" value={form.province} onChange={set("province")} />
            <Input placeholder="Cidade" value={form.city} onChange={set("city")} />
            <Input placeholder="UF" maxLength={2} value={form.state} onChange={set("state")} />
          </div>

          <DialogFooter className="pt-2">
            <Button type="submit" disabled={loading} className="w-full h-11 font-semibold">
              {loading ? <Loader2 className="animate-spin" size={16} /> : "Ir para o pagamento"}
            </Button>
          </DialogFooter>
          <p className="text-xs text-muted-foreground text-center">
            Pagamento processado com segurança via Asaas. Acesso ao portal liberado automaticamente após a confirmação da 1ª mensalidade.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
