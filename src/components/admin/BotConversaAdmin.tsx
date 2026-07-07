import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { sendBotConversaLead } from "@/lib/botconversa";

const TEST_FLOWS: { key: string; label: string; nome: string; telefone: string }[] = [
  { key: "onboarding", label: "Onboarding", nome: "TESTE Onboarding", telefone: "5511999990001" },
  { key: "checkin", label: "Check-in diário", nome: "TESTE Checkin Diario", telefone: "5511999990002" },
  { key: "gabriel", label: "Falar com Gabriel", nome: "TESTE Falar com Gabriel", telefone: "5511999990003" },
  { key: "assistente", label: "Assistente", nome: "TESTE Assistente", telefone: "5511999990004" },
  { key: "diagnostico", label: "Diagnóstico semanal", nome: "TESTE Diagnostico Semanal", telefone: "5511999990005" },
  { key: "inativo", label: "Recuperação de inativo", nome: "TESTE Recuperacao Inativo", telefone: "5511999990006" },
];

type LogRow = {
  id: string;
  user_id: string | null;
  phone: string | null;
  direction: string;
  event_type: string;
  status: string | null;
  error_message: string | null;
  created_at: string;
};

type Pending = {
  id: string;
  phone: string | null;
  email: string | null;
  reason: string | null;
  status: string;
  created_at: string;
  payload: any;
};

type Profile = {
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  plan: string;
  botconversa_subscriber_id: string | null;
  whatsapp_opt_in: boolean;
  daily_checkin_time: string;
};

async function invoke(name: string, body: any) {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) throw error;
  return data;
}

export default function BotConversaAdmin() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [pending, setPending] = useState<Pending[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [p, l, pw] = await Promise.all([
      supabase.from("score_profiles").select("user_id, full_name, email, phone, plan, botconversa_subscriber_id, whatsapp_opt_in, daily_checkin_time").order("created_at", { ascending: false }),
      supabase.from("botconversa_integration_logs").select("*").order("created_at", { ascending: false }).limit(80),
      supabase.from("botconversa_pending_webhooks").select("*").eq("status", "pending").order("created_at", { ascending: false }).limit(50),
    ]);
    setProfiles((p.data || []) as any);
    setLogs((l.data || []) as any);
    setPending((pw.data || []) as any);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function action(userId: string, name: string, label: string) {
    setBusyId(userId + name);
    try {
      await invoke(name, { user_id: userId });
      toast.success(`${label} enviado`);
      load();
    } catch (e: any) {
      toast.error(e?.message || "falha");
    } finally {
      setBusyId(null);
    }
  }

  async function resolvePending(id: string) {
    const { error } = await supabase.from("botconversa_pending_webhooks").update({ status: "resolved", resolved_at: new Date().toISOString() }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("resolvido"); load(); }
  }

  if (loading) return <p className="text-muted-foreground">Carregando…</p>;

  const synced = profiles.filter((p) => p.botconversa_subscriber_id).length;
  const withWhats = profiles.filter((p) => p.phone).length;

  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-4 gap-3">
        <Stat label="Perfis totais" value={profiles.length} />
        <Stat label="Com WhatsApp" value={withWhats} />
        <Stat label="Sincronizados no BotConversa" value={synced} />
        <Stat label="Webhooks pendentes" value={pending.length} />
      </div>

      <section>
        <h2 className="font-serif text-xl mb-3">Usuários</h2>
        <div className="overflow-x-auto border border-border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-3 py-2">Nome</th>
                <th className="text-left px-3 py-2">WhatsApp</th>
                <th className="text-left px-3 py-2">Plano</th>
                <th className="text-left px-3 py-2">Subscriber</th>
                <th className="text-left px-3 py-2">Check-in</th>
                <th className="text-right px-3 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p.user_id} className="border-t border-border">
                  <td className="px-3 py-2">{p.full_name}<div className="text-xs text-muted-foreground">{p.email}</div></td>
                  <td className="px-3 py-2 font-mono text-xs">{p.phone || "—"}</td>
                  <td className="px-3 py-2">{p.plan}</td>
                  <td className="px-3 py-2 font-mono text-xs">{p.botconversa_subscriber_id || <span className="text-muted-foreground">não sinc.</span>}</td>
                  <td className="px-3 py-2 text-xs">{p.whatsapp_opt_in ? p.daily_checkin_time?.slice(0, 5) : "off"}</td>
                  <td className="px-3 py-2 text-right space-x-2">
                    <button disabled={!p.phone || busyId === p.user_id + "botconversa-sync-user"} onClick={() => action(p.user_id, "botconversa-sync-user", "Sync")} className="text-xs px-2 py-1 border border-border rounded hover:bg-muted disabled:opacity-40">Sync</button>
                    <button disabled={!p.phone || busyId === p.user_id + "botconversa-start-onboarding"} onClick={() => action(p.user_id, "botconversa-start-onboarding", "Onboarding")} className="text-xs px-2 py-1 border border-border rounded hover:bg-muted disabled:opacity-40">Onboarding</button>
                    <button disabled={!p.phone || busyId === p.user_id + "botconversa-send-checkin"} onClick={() => action(p.user_id, "botconversa-send-checkin", "Check-in")} className="text-xs px-2 py-1 border border-border rounded hover:bg-muted disabled:opacity-40">Check-in</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="font-serif text-xl mb-3">Webhooks pendentes ({pending.length})</h2>
        {pending.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum pendente.</p> : (
          <div className="space-y-2">
            {pending.map((w) => (
              <div key={w.id} className="border border-border rounded p-3 text-xs">
                <div className="flex justify-between gap-3">
                  <div>
                    <div className="font-mono">{w.phone || w.email || "—"}</div>
                    <div className="text-muted-foreground">{w.reason}</div>
                    <div className="text-muted-foreground">{new Date(w.created_at).toLocaleString("pt-BR")}</div>
                  </div>
                  <button onClick={() => resolvePending(w.id)} className="px-2 py-1 border border-border rounded hover:bg-muted">Marcar resolvido</button>
                </div>
                <pre className="mt-2 bg-muted/30 p-2 rounded overflow-x-auto">{JSON.stringify(w.payload, null, 2)}</pre>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-serif text-xl mb-3">Últimos eventos ({logs.length})</h2>
        <div className="overflow-x-auto border border-border rounded-lg">
          <table className="w-full text-xs">
            <thead className="bg-muted/40 uppercase tracking-wide">
              <tr>
                <th className="text-left px-3 py-2">Quando</th>
                <th className="text-left px-3 py-2">Direção</th>
                <th className="text-left px-3 py-2">Evento</th>
                <th className="text-left px-3 py-2">Telefone</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-left px-3 py-2">Erro</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-t border-border">
                  <td className="px-3 py-2 whitespace-nowrap">{new Date(l.created_at).toLocaleString("pt-BR")}</td>
                  <td className="px-3 py-2">{l.direction}</td>
                  <td className="px-3 py-2">{l.event_type}</td>
                  <td className="px-3 py-2 font-mono">{l.phone || "—"}</td>
                  <td className={`px-3 py-2 ${l.status === "ok" ? "text-primary" : l.status === "error" ? "text-destructive" : ""}`}>{l.status || "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{l.error_message || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-border rounded-lg p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-2xl font-serif mt-1">{value}</div>
    </div>
  );
}
