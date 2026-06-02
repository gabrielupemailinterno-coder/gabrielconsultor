import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function CheckoutDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("asaas-create-checkout", {
      body: { name, email, phone, cpfCnpj: cpf.replace(/\D/g, "") },
    });
    setLoading(false);
    const invoiceUrl = (data as any)?.invoiceUrl;
    if (error || !invoiceUrl) {
      toast.error("Não foi possível gerar o checkout. Verifique seus dados e tente novamente.");
      return;
    }
    window.location.href = invoiceUrl;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Mentoria Comercial 1:1</DialogTitle>
          <p className="text-sm text-muted-foreground">3 meses · 6 encontros · 3x de R$ 197,00 no cartão</p>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <Input placeholder="Nome completo" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input placeholder="WhatsApp" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          <Input placeholder="CPF" value={cpf} onChange={(e) => setCpf(e.target.value)} required />
          <DialogFooter className="pt-2">
            <Button type="submit" disabled={loading} className="w-full h-11 font-semibold">
              {loading ? <Loader2 className="animate-spin" size={16} /> : "Ir para o pagamento"}
            </Button>
          </DialogFooter>
          <p className="text-xs text-muted-foreground text-center">
            Pagamento processado com segurança via Asaas. Seu acesso ao portal é liberado automaticamente após a confirmação.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
