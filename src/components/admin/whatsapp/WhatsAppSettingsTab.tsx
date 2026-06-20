import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

type Settings = {
  channel_id: string | null;
  agent_id: string | null;
  optout_text: string;
  delay_seconds: number;
  batch_limit: number;
  add_to_agent_context: boolean;
};

type Discovery = {
  channels: { id: string; name: string; type: string | null; workspaceId: string }[];
  agents: { id: string; name: string; type: string | null; workspaceId: string }[];
};

const DEFAULT: Settings = {
  channel_id: "",
  agent_id: "",
  optout_text: "Para não receber novas mensagens, responda SAIR.",
  delay_seconds: 3,
  batch_limit: 100,
  add_to_agent_context: false,
};

export default function WhatsAppSettingsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT);
  const [discovery, setDiscovery] = useState<Discovery | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await (supabase as any).from("settings").select("*").eq("user_id", user.id).maybeSingle();
      if (data) setSettings({ ...DEFAULT, ...data });
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await (supabase as any).from("settings").upsert({
      user_id: user.id,
      ...settings,
    }, { onConflict: "user_id" });
    setSaving(false);
    if (error) toast.error("Erro ao salvar: " + error.message);
    else toast.success("Configurações salvas");
  };

  const discover = async () => {
    setDiscovering(true);
    const { data, error } = await supabase.functions.invoke("gpt-maker-discover");
    setDiscovering(false);
    if (error) {
      toast.error("Erro: " + error.message);
      return;
    }
    if ((data as any)?.error) {
      toast.error((data as any).error);
      return;
    }
    setDiscovery(data as Discovery);
    toast.success(`Encontrados ${(data as any).channels?.length ?? 0} canais e ${(data as any).agents?.length ?? 0} agentes`);
  };

  if (loading) return <div className="p-6"><Loader2 className="animate-spin" /></div>;

  const configured = !!settings.channel_id;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-2 text-sm">
        {configured ? (
          <><CheckCircle2 className="text-green-500" size={18} /> <span>Canal configurado</span></>
        ) : (
          <><AlertCircle className="text-amber-500" size={18} /> <span>Configure um canal para começar a enviar</span></>
        )}
      </div>

      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-lg">Conexão GPT Maker</h3>
          <button onClick={discover} disabled={discovering} className="flex items-center gap-2 text-sm px-3 py-1.5 border border-border rounded hover:bg-secondary/40 transition disabled:opacity-50">
            {discovering ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
            Descobrir IDs
          </button>
        </div>

        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground">Canal (channel_id)</label>
          {discovery?.channels?.length ? (
            <select
              value={settings.channel_id ?? ""}
              onChange={(e) => setSettings({ ...settings, channel_id: e.target.value })}
              className="w-full bg-background border border-border rounded px-3 py-2 mt-1 text-sm"
            >
              <option value="">— selecione —</option>
              {discovery.channels.map((c) => (
                <option key={c.id} value={c.id}>{c.name} {c.type ? `(${c.type})` : ""} · {c.id.slice(0, 12)}…</option>
              ))}
            </select>
          ) : (
            <input
              value={settings.channel_id ?? ""}
              onChange={(e) => setSettings({ ...settings, channel_id: e.target.value })}
              placeholder="ch_..."
              className="w-full bg-background border border-border rounded px-3 py-2 mt-1 text-sm font-mono"
            />
          )}
        </div>

        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground">Agente (agent_id) — opcional</label>
          {discovery?.agents?.length ? (
            <select
              value={settings.agent_id ?? ""}
              onChange={(e) => setSettings({ ...settings, agent_id: e.target.value })}
              className="w-full bg-background border border-border rounded px-3 py-2 mt-1 text-sm"
            >
              <option value="">— nenhum —</option>
              {discovery.agents.map((a) => (
                <option key={a.id} value={a.id}>{a.name} · {a.id.slice(0, 12)}…</option>
              ))}
            </select>
          ) : (
            <input
              value={settings.agent_id ?? ""}
              onChange={(e) => setSettings({ ...settings, agent_id: e.target.value })}
              placeholder="ag_..."
              className="w-full bg-background border border-border rounded px-3 py-2 mt-1 text-sm font-mono"
            />
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <h3 className="font-serif text-lg">Disparo & LGPD</h3>

        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground">Texto de opt-out (anexado quando ativado na campanha)</label>
          <textarea
            value={settings.optout_text}
            onChange={(e) => setSettings({ ...settings, optout_text: e.target.value })}
            rows={2}
            className="w-full bg-background border border-border rounded px-3 py-2 mt-1 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Intervalo entre envios (s)</label>
            <input
              type="number" min={0}
              value={settings.delay_seconds}
              onChange={(e) => setSettings({ ...settings, delay_seconds: Number(e.target.value) })}
              className="w-full bg-background border border-border rounded px-3 py-2 mt-1 text-sm"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Limite por lote</label>
            <input
              type="number" min={1}
              value={settings.batch_limit}
              onChange={(e) => setSettings({ ...settings, batch_limit: Number(e.target.value) })}
              className="w-full bg-background border border-border rounded px-3 py-2 mt-1 text-sm"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.add_to_agent_context}
            onChange={(e) => setSettings({ ...settings, add_to_agent_context: e.target.checked })}
          />
          Injetar mensagens no contexto do agente (memória)
        </label>
      </div>

      <button onClick={save} disabled={saving} className="bg-primary text-primary-foreground px-6 py-3 rounded text-sm uppercase tracking-wide disabled:opacity-50">
        {saving ? "Salvando…" : "Salvar configurações"}
      </button>
    </div>
  );
}
