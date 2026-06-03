import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";

type AccessMode = "full" | "trial_then_paid";
type PaymentStatus = "pending" | "paid";

export default function MenteePaymentCard({ menteeId, onChange }: { menteeId: string; onChange?: () => void }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accessMode, setAccessMode] = useState<AccessMode>("full");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("pending");
  const [notes, setNotes] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("mentees")
      .select("access_mode,payment_status,payment_notes,payment_updated_at")
      .eq("id", menteeId).maybeSingle();
    if (data) {
      setAccessMode(((data as any).access_mode ?? "full") as AccessMode);
      setPaymentStatus(((data as any).payment_status ?? "pending") as PaymentStatus);
      setNotes((data as any).payment_notes ?? "");
      setUpdatedAt((data as any).payment_updated_at ?? null);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, [menteeId]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("mentees").update({
      access_mode: accessMode,
      payment_status: paymentStatus,
      payment_notes: notes || null,
      payment_updated_at: new Date().toISOString(),
    }).eq("id", menteeId);
    setSaving(false);
    if (error) return toast.error(`Falha: ${error.message}`);
    toast.success("Pagamento atualizado.");
    load();
    onChange?.();
  };

  const unlockAll = async () => {
    if (!confirm("Liberar TODOS os encontros bloqueados deste mentorado?")) return;
    const { error } = await supabase.from("meetings")
      .update({ status: "available" })
      .eq("mentee_id", menteeId).eq("status", "blocked");
    if (error) return toast.error(`Falha: ${error.message}`);
    toast.success("Encontros liberados.");
    onChange?.();
  };

  if (loading) return <div className="border border-border rounded-lg p-4 flex justify-center"><Loader2 className="animate-spin text-primary" size={16} /></div>;

  return (
    <div className="border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-semibold flex items-center gap-2"><CreditCard size={15} /> Pagamento e acesso</h3>
        <Badge variant="outline" className={paymentStatus === "paid"
          ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
          : "bg-amber-500/15 text-amber-600 border-amber-500/30"}>
          {paymentStatus === "paid" ? "Pago" : "Pendente"}
        </Badge>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="space-y-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Modalidade</p>
          <Select value={accessMode} onValueChange={(v) => setAccessMode(v as AccessMode)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="full">Acesso completo (pago)</SelectItem>
              <SelectItem value="trial_then_paid">3 primeiros grátis, depois paga</SelectItem>
            </SelectContent>
          </Select>
        </label>
        <label className="space-y-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Status</p>
          <Select value={paymentStatus} onValueChange={(v) => setPaymentStatus(v as PaymentStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pagamento pendente</SelectItem>
              <SelectItem value="paid">Pago</SelectItem>
            </SelectContent>
          </Select>
        </label>
      </div>

      <Textarea
        placeholder="Notas (forma de pagamento, comprovante, observações)..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
      />

      <div className="flex flex-wrap gap-2 items-center">
        <Button size="sm" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="animate-spin" size={14} /> : "Salvar"}
        </Button>
        <Button size="sm" variant="outline" onClick={unlockAll}>Liberar todos encontros</Button>
        {updatedAt && (
          <span className="text-xs text-muted-foreground ml-auto">
            Atualizado {new Date(updatedAt).toLocaleString("pt-BR")}
          </span>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        <strong>Acesso completo:</strong> mentorado vê todos os encontros liberados normalmente.<br />
        <strong>3 primeiros grátis:</strong> encontros 4–6 ficam bloqueados até você marcar como Pago.
      </p>
    </div>
  );
}
