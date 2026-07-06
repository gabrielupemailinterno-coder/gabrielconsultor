import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Send, Copy, MessageSquare } from "lucide-react";

const DEFAULT_TEMPLATES: Record<string, string> = {
  checkin: `Fala {{nome}}! Bora fechar seu Score de hoje?

Responde nesse formato (ou só os números na ordem):

Ligações: 
WhatsApps: 
Reuniões: 
Apresentações: 
Propostas: 
Vendas: 
Valor vendido: 

Se não vendeu hoje, manda "0".`,
  alert_2: `{{nome}}, você está há 2 dias sem atualizar seu Score.

Sem número, você volta a vender no achismo. Registra rapidinho agora e mantém sua sequência.`,
  alert_5: `{{nome}}, seu diagnóstico está ficando incompleto — 5 dias sem registro.

Quer voltar hoje com um registro rápido? Manda os números aqui ou registra na plataforma.`,
  alert_10: `{{nome}}, seu Score caiu porque você ficou 10 dias sem atualizar.

O sistema começou a penalizar sua nota. Bora recuperar? Responde aqui mesmo com seus números de hoje.`,
};

const LABELS: Record<string, string> = {
  checkin: "Check-in diário (18h)",
  alert_2: "Alerta de 2 dias sem registro",
  alert_5: "Alerta de 5 dias sem registro",
  alert_10: "Alerta de 10 dias (penaliza Score)",
};

const WEBHOOK_URL = "https://xhzsdnbztsnupbukmdjg.supabase.co/functions/v1/whatsapp-inbound";

export default function WhatsAppRitualAdmin() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);
  const [templates, setTemplates] = useState<Record<string, string>>({});
  const [testPhone, setTestPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase.from("settings").select("*").eq("user_id", session.user.id).maybeSingle();
      setSettings(data);
      const t = (data?.whatsapp_templates as any) || {};
      setTemplates({ ...DEFAULT_TEMPLATES, ...t });
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    const { error } = await supabase.from("settings").update({
      whatsapp_ritual_enabled: settings.whatsapp_ritual_enabled,
      whatsapp_templates: templates,
    }).eq("id", settings.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Configurações do ritual salvas.");
  };

  const toggleEnabled = (v: boolean) => setSettings({ ...settings, whatsapp_ritual_enabled: v });

  const sendTest = async () => {
    if (!testPhone) { toast.error("Informe um telefone para o teste."); return; }
    setSending(true);
    const { data, error } = await supabase.functions.invoke("whatsapp-daily-checkin", { body: { testPhone } });
    setSending(false);
    if (error) toast.error(error.message);
    else if ((data as any)?.ok) toast.success("Mensagem de teste enviada.");
    else toast.error((data as any)?.error || "Falha ao enviar.");
  };

  if (loading) return <div className="p-6"><Loader2 className="animate-spin" /></div>;
  if (!settings) return <div className="p-6 text-muted-foreground">Configure primeiro o WhatsApp na aba WhatsApp (canal + agente).</div>;

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-5">
        <div className="flex items-start gap-3 mb-3">
          <MessageSquare className="text-primary mt-1" size={20} />
          <div className="flex-1">
            <h3 className="font-serif text-lg">Ritual diário no WhatsApp</h3>
            <p className="text-xs text-muted-foreground">
              Check-in 18h (seg–sáb) · Alertas 10h · Diagnóstico segunda 8h. Usa o mesmo canal do GPT Maker configurado na aba WhatsApp.
            </p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={!!settings.whatsapp_ritual_enabled} onChange={(e) => toggleEnabled(e.target.checked)} className="w-4 h-4" />
            <span className="text-sm">{settings.whatsapp_ritual_enabled ? "Ativado" : "Desativado"}</span>
          </label>
        </div>
        {!settings.channel_id && (
          <div className="text-xs text-destructive">⚠️ Nenhum channel_id salvo. Configure na aba WhatsApp antes de ativar o ritual.</div>
        )}
      </div>

      <div className="bg-card border border-border rounded-lg p-5">
        <h4 className="font-serif text-base mb-1">Webhook de resposta (GPT Maker)</h4>
        <p className="text-xs text-muted-foreground mb-3">
          Cole esta URL no GPT Maker como webhook de mensagens recebidas. Envie um POST JSON com <code>{"{ phone, message }"}</code> e o header <code>X-Webhook-Token</code> igual ao valor salvo em <code>GPT_MAKER_WEBHOOK_TOKEN</code>.
        </p>
        <div className="flex gap-2">
          <input readOnly value={WEBHOOK_URL} className="flex-1 bg-input border border-border rounded-md px-3 py-2 text-xs font-mono" />
          <button onClick={() => { navigator.clipboard.writeText(WEBHOOK_URL); toast.success("URL copiada"); }} className="border border-border rounded-md px-3 text-xs uppercase tracking-wide flex items-center gap-1">
            <Copy size={12} /> Copiar
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-5 space-y-4">
        <h4 className="font-serif text-base">Templates de mensagem</h4>
        <p className="text-xs text-muted-foreground -mt-2">Use <code>{"{{nome}}"}</code> como placeholder do primeiro nome.</p>
        {Object.keys(DEFAULT_TEMPLATES).map((k) => (
          <label key={k} className="block">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">{LABELS[k]}</span>
            <textarea
              value={templates[k] ?? DEFAULT_TEMPLATES[k]}
              onChange={(e) => setTemplates({ ...templates, [k]: e.target.value })}
              rows={k === "checkin" ? 10 : 5}
              className="w-full mt-1 bg-input border border-border rounded-md px-3 py-2 text-sm font-mono"
            />
          </label>
        ))}
        <button onClick={save} disabled={saving} className="bg-primary text-primary-foreground text-sm uppercase tracking-wide py-2.5 px-6 rounded-md disabled:opacity-50">
          {saving ? "Salvando…" : "Salvar templates"}
        </button>
      </div>

      <div className="bg-card border border-border rounded-lg p-5">
        <h4 className="font-serif text-base mb-2">Enviar check-in de teste</h4>
        <p className="text-xs text-muted-foreground mb-3">Envia a mensagem de check-in para o telefone abaixo agora (ignora se o usuário já registrou hoje).</p>
        <div className="flex gap-2">
          <input value={testPhone} onChange={(e) => setTestPhone(e.target.value)} placeholder="5511999999999" className="flex-1 bg-input border border-border rounded-md px-3 py-2 text-sm font-mono" />
          <button onClick={sendTest} disabled={sending} className="bg-primary text-primary-foreground text-xs uppercase tracking-wide px-4 rounded-md flex items-center gap-1 disabled:opacity-50">
            <Send size={12} /> {sending ? "Enviando…" : "Enviar"}
          </button>
        </div>
      </div>
    </div>
  );
}
