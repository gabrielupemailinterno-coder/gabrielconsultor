import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { parseContactsCSV } from "@/lib/phone";
import { Loader2, Plus, Trash2 } from "lucide-react";

type Step = { message: string; scheduled_at: string; add_optout: boolean };

export default function NewCampaignDialog({
  open, onClose, onCreated,
}: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [destType, setDestType] = useState<"list" | "group">("list");
  const [groupId, setGroupId] = useState("");
  const [contactsText, setContactsText] = useState("");
  const [message, setMessage] = useState("");
  const [addOptout, setAddOptout] = useState(false);
  const [mode, setMode] = useState<"single" | "sequence">("single");
  const [steps, setSteps] = useState<Step[]>([]);
  const [saving, setSaving] = useState(false);

  const insertVar = (v: string) => setMessage((m) => m + `{{${v}}}`);

  const addStep = () => setSteps((s) => [...s, {
    message: message || "",
    scheduled_at: new Date(Date.now() + (s.length + 1) * 86400000).toISOString().slice(0, 16),
    add_optout: addOptout,
  }]);

  const removeStep = (i: number) => setSteps((s) => s.filter((_, idx) => idx !== i));

  const submit = async () => {
    if (!message.trim() && mode === "single") return toast.error("Mensagem obrigatória");
    if (destType === "group" && !groupId.trim()) return toast.error("Group ID obrigatório");

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("não autenticado");

      let parsed: ReturnType<typeof parseContactsCSV> = { contacts: [], invalid: [] };
      if (destType === "list") {
        parsed = parseContactsCSV(contactsText);
        if (parsed.contacts.length === 0) throw new Error("Adicione pelo menos 1 contato válido");
        if (parsed.invalid.length) toast.warning(`${parsed.invalid.length} linhas inválidas ignoradas`);
      }

      const campaignName = name.trim() || `Campanha ${new Date().toLocaleString("pt-BR")}`;

      const { data: camp, error: e1 } = await (supabase as any).from("campaigns").insert({
        user_id: user.id,
        name: campaignName,
        message: message || "(sequência)",
        kind: "social",
        destination_type: destType,
        group_id: destType === "group" ? groupId.trim() : null,
        status: mode === "single" ? "running" : "scheduled",
        total: destType === "group" ? 1 : parsed.contacts.length,
        add_optout: addOptout,
      }).select().single();
      if (e1) throw e1;

      if (destType === "list") {
        const rows = parsed.contacts.map((c) => ({
          campaign_id: camp.id,
          user_id: user.id,
          phone_raw: c.phone_raw,
          phone_e164: c.phone_e164,
          name: c.name ?? null,
          empresa: c.empresa ?? null,
        }));
        await (supabase as any).from("contacts").insert(rows);
      }

      if (mode === "sequence" && steps.length > 0) {
        const stepRows = steps.map((s, i) => ({
          campaign_id: camp.id,
          user_id: user.id,
          step_order: i + 1,
          message: s.message,
          add_optout: s.add_optout,
          scheduled_at: new Date(s.scheduled_at).toISOString(),
        }));
        await (supabase as any).from("campaign_steps").insert(stepRows);
        toast.success("Sequência agendada");
      } else if (mode === "single") {
        // disparo imediato: para lista, chama send-message por contato; para grupo, cria step com agora.
        if (destType === "group") {
          await (supabase as any).from("campaign_steps").insert({
            campaign_id: camp.id,
            user_id: user.id,
            step_order: 1,
            message,
            add_optout: addOptout,
            scheduled_at: new Date().toISOString(),
          });
          toast.success("Mensagem agendada para o próximo ciclo (≤ 1 min)");
        } else {
          const { data: cs } = await (supabase as any).from("contacts").select("id").eq("campaign_id", camp.id);
          let ok = 0;
          for (const c of cs ?? []) {
            const { data } = await supabase.functions.invoke("send-message", { body: { contactId: c.id } });
            if ((data as any)?.ok) ok++;
          }
          await (supabase as any).from("campaigns").update({ status: "done" }).eq("id", camp.id);
          toast.success(`Enviado: ${ok}/${cs?.length ?? 0}`);
        }
      }

      onCreated();
      onClose();
      setName(""); setContactsText(""); setMessage(""); setSteps([]); setGroupId("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Nova campanha</DialogTitle></DialogHeader>

        <div className="space-y-4">
          <input className="w-full bg-background border border-border rounded px-3 py-2 text-sm" placeholder="Nome da campanha" value={name} onChange={(e) => setName(e.target.value)} />

          <div className="flex gap-2">
            {(["list", "group"] as const).map((t) => (
              <button key={t} onClick={() => setDestType(t)} className={`flex-1 px-3 py-2 rounded border text-sm ${destType === t ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}>
                {t === "list" ? "Lista de contatos" : "Grupo do WhatsApp"}
              </button>
            ))}
          </div>

          {destType === "list" ? (
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Contatos (1 por linha) — formato: telefone, nome, empresa</label>
              <textarea
                rows={6}
                value={contactsText}
                onChange={(e) => setContactsText(e.target.value)}
                placeholder={"+5511999999999, Maria, ACME\n11988887777, João"}
                className="w-full bg-background border border-border rounded px-3 py-2 mt-1 text-sm font-mono"
              />
            </div>
          ) : (
            <input className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono" placeholder="120363xxxx@g.us" value={groupId} onChange={(e) => setGroupId(e.target.value)} />
          )}

          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Mensagem</label>
            <textarea
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-background border border-border rounded px-3 py-2 mt-1 text-sm"
              placeholder="Olá {{nome}}, tudo bem? ..."
            />
            {destType === "list" && (
              <div className="flex gap-2 mt-2 text-xs">
                <span className="text-muted-foreground">Variáveis:</span>
                {["nome", "telefone", "empresa"].map((v) => (
                  <button key={v} type="button" onClick={() => insertVar(v)} className="px-2 py-0.5 bg-secondary rounded hover:bg-secondary/70">{`{{${v}}}`}</button>
                ))}
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={addOptout} onChange={(e) => setAddOptout(e.target.checked)} />
            Adicionar texto de opt-out
          </label>

          <div className="flex gap-2">
            {(["single", "sequence"] as const).map((t) => (
              <button key={t} onClick={() => setMode(t)} className={`flex-1 px-3 py-2 rounded border text-sm ${mode === t ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}>
                {t === "single" ? "Envio único" : "Sequência agendada"}
              </button>
            ))}
          </div>

          {mode === "sequence" && (
            <div className="space-y-2 border border-border rounded p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Passos ({steps.length})</span>
                <button onClick={addStep} className="flex items-center gap-1 text-xs px-2 py-1 bg-secondary rounded"><Plus size={12} /> Adicionar passo</button>
              </div>
              {steps.map((s, i) => (
                <div key={i} className="border border-border rounded p-2 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">Passo {i + 1}</span>
                    <button onClick={() => removeStep(i)} className="text-destructive"><Trash2 size={12} /></button>
                  </div>
                  <input type="datetime-local" value={s.scheduled_at} onChange={(e) => setSteps((ss) => ss.map((x, idx) => idx === i ? { ...x, scheduled_at: e.target.value } : x))} className="w-full bg-background border border-border rounded px-2 py-1 text-xs" />
                  <textarea rows={3} value={s.message} onChange={(e) => setSteps((ss) => ss.map((x, idx) => idx === i ? { ...x, message: e.target.value } : x))} className="w-full bg-background border border-border rounded px-2 py-1 text-xs" />
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded">Cancelar</button>
          <button onClick={submit} disabled={saving} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded disabled:opacity-50">
            {saving ? <Loader2 className="animate-spin" size={14} /> : "Criar"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
