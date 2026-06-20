import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { normalizeBR } from "@/lib/phone";

export default function WhatsAppComplianceTab() {
  const [blocklist, setBlocklist] = useState<any[]>([]);
  const [optouts, setOptouts] = useState<any[]>([]);
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");

  const load = async () => {
    const [b, o] = await Promise.all([
      (supabase as any).from("blocklist").select("*").order("created_at", { ascending: false }),
      (supabase as any).from("optouts").select("*").order("created_at", { ascending: false }),
    ]);
    setBlocklist(b.data || []);
    setOptouts(o.data || []);
  };

  useEffect(() => { load(); }, []);

  const addBlock = async () => {
    const norm = normalizeBR(phone);
    if (!norm) return toast.error("Telefone inválido");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await (supabase as any).from("blocklist").insert({ user_id: user.id, phone_e164: norm, note });
    if (error) toast.error(error.message);
    else {
      toast.success("Adicionado");
      setPhone(""); setNote(""); load();
    }
  };

  const remove = async (table: "blocklist" | "optouts", id: string) => {
    await (supabase as any).from(table).delete().eq("id", id);
    load();
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-xl mb-3">Bloqueios manuais</h2>
        <div className="flex gap-2 mb-4">
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+5511..." className="bg-background border border-border rounded px-3 py-2 text-sm font-mono" />
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="motivo (opcional)" className="flex-1 bg-background border border-border rounded px-3 py-2 text-sm" />
          <button onClick={addBlock} className="flex items-center gap-1 bg-primary text-primary-foreground px-4 py-2 rounded text-sm"><Plus size={14} /> Bloquear</button>
        </div>
        <div className="border border-border rounded-lg">
          {blocklist.length === 0 && <p className="p-3 text-sm text-muted-foreground">Nenhum bloqueio.</p>}
          {blocklist.map((b) => (
            <div key={b.id} className="border-t border-border p-2 flex items-center gap-3 text-sm">
              <span className="font-mono">{b.phone_e164}</span>
              <span className="flex-1 text-muted-foreground">{b.note}</span>
              <button onClick={() => remove("blocklist", b.id)} className="text-destructive"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-serif text-xl mb-3">Opt-outs (LGPD)</h2>
        <div className="border border-border rounded-lg">
          {optouts.length === 0 && <p className="p-3 text-sm text-muted-foreground">Nenhum opt-out registrado.</p>}
          {optouts.map((o) => (
            <div key={o.id} className="border-t border-border p-2 flex items-center gap-3 text-sm">
              <span className="font-mono">{o.phone_e164}</span>
              <span className="flex-1 text-muted-foreground text-xs">{new Date(o.created_at).toLocaleString("pt-BR")}</span>
              <button onClick={() => remove("optouts", o.id)} className="text-destructive"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
