import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function CampaignDetail({ campaignId, onBack }: { campaignId: string; onBack: () => void }) {
  const [campaign, setCampaign] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [steps, setSteps] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [sending, setSending] = useState<string | null>(null);

  const load = async () => {
    const [c, ct, st, lg] = await Promise.all([
      (supabase as any).from("campaigns").select("*").eq("id", campaignId).maybeSingle(),
      (supabase as any).from("contacts").select("*").eq("campaign_id", campaignId).order("created_at"),
      (supabase as any).from("campaign_steps").select("*").eq("campaign_id", campaignId).order("step_order"),
      (supabase as any).from("campaign_logs").select("*").eq("campaign_id", campaignId).order("created_at", { ascending: false }).limit(100),
    ]);
    setCampaign(c.data);
    setContacts(ct.data || []);
    setSteps(st.data || []);
    setLogs(lg.data || []);
  };

  useEffect(() => {
    load();
    const ch = (supabase as any)
      .channel(`camp-${campaignId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "contacts", filter: `campaign_id=eq.${campaignId}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "campaign_logs", filter: `campaign_id=eq.${campaignId}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "campaign_steps", filter: `campaign_id=eq.${campaignId}` }, () => load())
      .subscribe();
    return () => { (supabase as any).removeChannel(ch); };
  }, [campaignId]);

  const sendOne = async (contactId: string) => {
    setSending(contactId);
    const { data, error } = await supabase.functions.invoke("send-message", { body: { contactId } });
    setSending(null);
    if (error) toast.error(error.message);
    else if ((data as any)?.ok) toast.success("Enviado");
    else toast.error((data as any)?.error || "Falha");
  };

  if (!campaign) return <Loader2 className="animate-spin" />;

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={14} /> Voltar
      </button>

      <div className="bg-card border border-border rounded-lg p-5">
        <h2 className="font-serif text-xl">{campaign.name}</h2>
        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{campaign.message}</p>
        <div className="flex gap-4 mt-3 text-sm">
          <span>Status: <strong>{campaign.status}</strong></span>
          <span>Total: <strong>{campaign.total}</strong></span>
          <span className="text-green-500">Enviados: <strong>{campaign.sent_count}</strong></span>
          <span className="text-destructive">Erros: <strong>{campaign.error_count}</strong></span>
        </div>
      </div>

      {steps.length > 0 && (
        <div>
          <h3 className="font-serif mb-2">Sequência ({steps.length} passos)</h3>
          <div className="border border-border rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/30 text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="text-left p-2">#</th><th className="text-left p-2">Quando</th><th className="text-left p-2">Mensagem</th><th className="text-left p-2">Status</th></tr>
              </thead>
              <tbody>
                {steps.map((s) => (
                  <tr key={s.id} className="border-t border-border">
                    <td className="p-2">{s.step_order}</td>
                    <td className="p-2 whitespace-nowrap">{new Date(s.scheduled_at).toLocaleString("pt-BR")}</td>
                    <td className="p-2 max-w-md truncate">{s.message}</td>
                    <td className="p-2"><span className="px-2 py-0.5 bg-secondary rounded text-xs">{s.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {contacts.length > 0 && (
        <div>
          <h3 className="font-serif mb-2">Contatos ({contacts.length})</h3>
          <div className="border border-border rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/30 text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="text-left p-2">Telefone</th><th className="text-left p-2">Nome</th><th className="text-left p-2">Empresa</th><th className="text-left p-2">Status</th><th className="text-left p-2">Ação</th></tr>
              </thead>
              <tbody>
                {contacts.map((c) => (
                  <tr key={c.id} className="border-t border-border">
                    <td className="p-2 font-mono">{c.phone_e164}</td>
                    <td className="p-2">{c.name}</td>
                    <td className="p-2">{c.empresa}</td>
                    <td className="p-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${c.status === "sent" ? "bg-green-500/15 text-green-500" : c.status === "error" ? "bg-destructive/15 text-destructive" : "bg-secondary"}`}>{c.status}</span>
                      {c.error_message && <div className="text-xs text-destructive mt-1">{c.error_message}</div>}
                    </td>
                    <td className="p-2">
                      <button onClick={() => sendOne(c.id)} disabled={sending === c.id} className="flex items-center gap-1 text-xs px-2 py-1 border border-border rounded hover:bg-secondary/40">
                        {sending === c.id ? <Loader2 className="animate-spin" size={10} /> : <Send size={10} />}
                        {c.status === "sent" ? "Reenviar" : "Enviar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div>
        <h3 className="font-serif mb-2">Logs recentes</h3>
        <div className="border border-border rounded-lg max-h-96 overflow-y-auto">
          {logs.length === 0 && <p className="p-3 text-sm text-muted-foreground">Nenhum log ainda.</p>}
          {logs.map((l) => (
            <div key={l.id} className="border-t border-border p-2 text-xs flex gap-3">
              <span className="text-muted-foreground whitespace-nowrap">{new Date(l.created_at).toLocaleString("pt-BR")}</span>
              <span className={l.status === "sent" ? "text-green-500" : "text-destructive"}>{l.status}</span>
              <span className="flex-1">{l.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
