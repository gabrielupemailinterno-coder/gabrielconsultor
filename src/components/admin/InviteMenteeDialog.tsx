import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";

type Plan = { id: string; name: string };

type Props = {
  triggerLabel?: string;
  triggerClassName?: string;
  defaultEmail?: string;
  defaultName?: string;
  defaultPhone?: string;
  leadId?: string;
  onDone?: (menteeId: string) => void;
  asButton?: boolean;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
};

export default function InviteMenteeDialog({
  triggerLabel = "Convidar mentorado",
  triggerClassName,
  defaultEmail = "",
  defaultName = "",
  defaultPhone = "",
  leadId,
  onDone,
  asButton = true,
  open: controlledOpen,
  onOpenChange,
}: Props) {
  const [innerOpen, setInnerOpen] = useState(false);
  const open = controlledOpen ?? innerOpen;
  const setOpen = onOpenChange ?? setInnerOpen;

  const [plans, setPlans] = useState<Plan[]>([]);
  const [planId, setPlanId] = useState<string>("");
  const [email, setEmail] = useState(defaultEmail);
  const [fullName, setFullName] = useState(defaultName);
  const [phone, setPhone] = useState(defaultPhone);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setEmail(defaultEmail);
    setFullName(defaultName);
    setPhone(defaultPhone);
    supabase.from("mentorship_plans").select("id,name").order("created_at").then(({ data }) => {
      const list = (data ?? []) as Plan[];
      setPlans(list);
      if (list.length && !planId) setPlanId(list[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async () => {
    if (!email || !fullName) return toast.error("Nome e e-mail são obrigatórios.");
    setSending(true);
    const { data, error } = await supabase.functions.invoke("admin-invite-mentee", {
      body: { email, full_name: fullName, phone, plan_id: planId || undefined, lead_id: leadId },
    });
    setSending(false);
    if (error || (data as any)?.error) {
      return toast.error((data as any)?.error ?? error?.message ?? "Falha ao convidar.");
    }
    toast.success((data as any)?.invited ? "Convite enviado por e-mail." : "Mentorado criado.");
    setOpen(false);
    onDone?.((data as any).mentee_id);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {asButton && (
        <DialogTrigger asChild>
          <Button size="sm" className={triggerClassName}>
            <UserPlus size={14} className="mr-1.5" /> {triggerLabel}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convidar mentorado por e-mail</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Nome completo</label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nome do mentorado" />
          </div>
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">E-mail</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" />
          </div>
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">WhatsApp (opcional)</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
          </div>
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Plano</label>
            <Select value={planId} onValueChange={setPlanId}>
              <SelectTrigger><SelectValue placeholder="Selecione um plano" /></SelectTrigger>
              <SelectContent>
                {plans.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            Um e-mail de convite será enviado para que o mentorado defina a senha e acesse o portal.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={sending}>Cancelar</Button>
            <Button onClick={submit} disabled={sending}>
              {sending ? <Loader2 className="animate-spin" size={14} /> : "Enviar convite"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
