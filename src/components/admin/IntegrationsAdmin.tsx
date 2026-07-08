import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, Plus, Play, Trash2, RefreshCw, ChevronRight, Loader2 } from "lucide-react";

type EventRow = { id: string; key: string; label: string; category: string; description: string | null; sample_payload: any };
type Webhook = {
  id: string; name: string; url: string; enabled: boolean; secret: string | null;
  event_name: string; headers: Record<string, string>; timeout_ms: number;
  max_attempts: number; backoff_seconds: number;
  last_delivery_at: string | null; last_delivery_status: string | null;
};
type Delivery = {
  id: string; webhook_id: string | null; event_key: string; payload: any; attempt: number;
  status: string; response_status: number | null; response_body: string | null;
  error: string | null; duration_ms: number | null; created_at: string;
};

const empty: Omit<Webhook, "id" | "last_delivery_at" | "last_delivery_status"> = {
  name: "", url: "", enabled: true, secret: null, event_name: "", headers: {},
  timeout_ms: 10000, max_attempts: 3, backoff_seconds: 60,
};

const statusColor: Record<string, string> = {
  success: "text-emerald-600 bg-emerald-50 border-emerald-200",
  failed: "text-rose-600 bg-rose-50 border-rose-200",
  retrying: "text-amber-600 bg-amber-50 border-amber-200",
  pending: "text-muted-foreground bg-muted border-border",
};

function isValidUrl(u: string) {
  try { const x = new URL(u); return x.protocol === "http:" || x.protocol === "https:"; } catch { return false; }
}

export default function IntegrationsAdmin() {
  const [tab, setTab] = useState<"webhooks" | "events" | "logs">("webhooks");
  const [events, setEvents] = useState<EventRow[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Webhook> | null>(null);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [e, w, d] = await Promise.all([
      supabase.from("integration_events").select("*").order("category").order("key"),
      supabase.from("integration_webhooks").select("*").order("event_name", { ascending: true }),
      supabase.from("integration_deliveries").select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    setEvents((e.data as any) || []);
    setWebhooks((w.data as any) || []);
    setDeliveries((d.data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const eventsByCat = useMemo(() => {
    const g: Record<string, EventRow[]> = {};
    events.forEach((ev) => { (g[ev.category] ||= []).push(ev); });
    return g;
  }, [events]);

  const eventByKey = useMemo(() => {
    const m: Record<string, EventRow> = {};
    events.forEach((ev) => { m[ev.key] = ev; });
    return m;
  }, [events]);

  const takenEvents = useMemo(() => {
    const s = new Set<string>();
    webhooks.forEach((w) => { if (w.event_name && w.id !== editing?.id) s.add(w.event_name); });
    return s;
  }, [webhooks, editing?.id]);

  const save = async () => {
    if (!editing?.event_name) { toast.error("Escolha um evento"); return; }
    if (!editing?.name?.trim()) { toast.error("Nome é obrigatório"); return; }
    if (!editing?.url || !isValidUrl(editing.url)) { toast.error("URL inválida"); return; }

    // Prevent duplicated event on create/edit
    const dup = webhooks.find((w) => w.event_name === editing.event_name && w.id !== editing.id);
    if (dup) {
      toast.error("Este evento já possui um webhook configurado. Edite o webhook existente ou remova antes de criar outro.");
      return;
    }

    const payload = { ...empty, ...editing } as any;
    delete payload.id;
    delete payload.last_delivery_at;
    delete payload.last_delivery_status;

    if (editing.id) {
      const { error } = await supabase.from("integration_webhooks").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("integration_webhooks").insert(payload);
      if (error) return toast.error(error.message);
    }
    toast.success("Webhook salvo");
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este webhook e todo o histórico dele?")) return;
    await supabase.from("integration_webhooks").delete().eq("id", id);
    load();
  };

  const test = async (wh: Webhook) => {
    setBusy(wh.id);
    try {
      const ev = eventByKey[wh.event_name];
      const { data, error } = await supabase.functions.invoke("integrations-dispatch", {
        body: { mode: "test", webhook_id: wh.id, event_key: wh.event_name, payload: ev?.sample_payload || { test: true } },
      });
      if (error) throw error;
      if (data?.ok) toast.success(`OK (${data.status})`);
      else toast.error(`Falhou (${data?.status || "sem resposta"})`);
      load();
    } catch (e: any) {
      toast.error(e?.message || "Erro no teste");
    } finally {
      setBusy(null);
    }
  };

  const runRetries = async () => {
    setBusy("retry");
    try {
      const { data, error } = await supabase.functions.invoke("integrations-dispatch", { body: { mode: "retry_pending" } });
      if (error) throw error;
      toast.success(`${data?.processed ?? 0} entregas processadas`);
      load();
    } catch (e: any) { toast.error(e?.message || "Erro"); }
    finally { setBusy(null); }
  };

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-border">
        {[
          { id: "webhooks", label: `Webhooks de Saída (${webhooks.length})` },
          { id: "events", label: `Catálogo de Eventos (${events.length})` },
          { id: "logs", label: `Logs (${deliveries.length})` },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`px-4 py-2 text-sm border-b-2 transition ${tab === t.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "webhooks" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Cada evento tem seu próprio webhook, com URL exclusiva de destino.</p>
            <div className="flex gap-2">
              <button onClick={runRetries} disabled={busy === "retry"} className="flex items-center gap-2 text-sm px-3 py-2 border border-border rounded-md hover:bg-secondary/50">
                <RefreshCw size={14} className={busy === "retry" ? "animate-spin" : ""} /> Rodar retries
              </button>
              <button onClick={() => setEditing({ ...empty })} className="flex items-center gap-2 text-sm px-3 py-2 bg-primary text-primary-foreground rounded-md">
                <Plus size={14} /> Novo webhook
              </button>
            </div>
          </div>

          {webhooks.length === 0 && <p className="text-sm text-muted-foreground italic">Nenhum webhook configurado.</p>}

          <div className="space-y-3">
            {webhooks.map((wh) => {
              const ev = eventByKey[wh.event_name];
              return (
                <div key={wh.id} className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`w-2 h-2 rounded-full ${wh.enabled ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
                        <span className="text-[10px] px-2 py-0.5 bg-secondary rounded font-mono">{wh.event_name}</span>
                        <h3 className="font-medium">{wh.name}</h3>
                        {wh.last_delivery_status && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusColor[wh.last_delivery_status] || ""}`}>
                            {wh.last_delivery_status}
                          </span>
                        )}
                      </div>
                      {ev && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {ev.label}{ev.description ? ` — ${ev.description}` : ""}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground font-mono">
                        <code className="truncate">{wh.url}</code>
                        <button onClick={() => { navigator.clipboard.writeText(wh.url); toast.success("URL copiada"); }} className="hover:text-foreground shrink-0">
                          <Copy size={12} />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="flex gap-1">
                        <button onClick={() => test(wh)} disabled={busy === wh.id} className="p-2 text-sm hover:bg-secondary rounded-md disabled:opacity-40" title="Testar">
                          {busy === wh.id ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                        </button>
                        <button onClick={() => setEditing(wh)} className="px-3 py-1.5 text-xs border border-border rounded-md hover:bg-secondary">Editar</button>
                        <button onClick={() => remove(wh.id)} className="p-2 text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
                      </div>
                      {wh.last_delivery_at && (
                        <span className="text-[10px] text-muted-foreground">último: {new Date(wh.last_delivery_at).toLocaleString("pt-BR")}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {editing && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
              <div onClick={(e) => e.stopPropagation()} className="bg-background border border-border rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4">
                <h3 className="font-serif text-lg">{editing.id ? "Editar webhook" : "Novo webhook"}</h3>

                <label className="block">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Evento</span>
                  <select
                    value={editing.event_name || ""}
                    onChange={(e) => setEditing({ ...editing, event_name: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-md text-sm font-mono"
                  >
                    <option value="">Selecione um evento…</option>
                    {Object.entries(eventsByCat).map(([cat, evs]) => (
                      <optgroup key={cat} label={cat}>
                        {evs.map((ev) => {
                          const taken = takenEvents.has(ev.key);
                          return (
                            <option key={ev.key} value={ev.key} disabled={taken}>
                              {ev.key}{taken ? " (já configurado)" : ""}
                            </option>
                          );
                        })}
                      </optgroup>
                    ))}
                  </select>
                  {editing.event_name && eventByKey[editing.event_name]?.description && (
                    <p className="text-[11px] text-muted-foreground mt-1">{eventByKey[editing.event_name].description}</p>
                  )}
                </label>

                <label className="block">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Nome do webhook</span>
                  <input value={editing.name || ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-md text-sm" placeholder="Ex: BotConversa - lead.contato" />
                </label>

                <label className="block">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">URL de destino</span>
                  <input value={editing.url || ""} onChange={(e) => setEditing({ ...editing, url: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-md text-sm font-mono" placeholder="https://..." />
                </label>

                <div className="grid grid-cols-3 gap-3">
                  <label className="block">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Timeout (ms)</span>
                    <input type="number" value={editing.timeout_ms ?? 10000} onChange={(e) => setEditing({ ...editing, timeout_ms: Number(e.target.value) })}
                      className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-md text-sm" />
                  </label>
                  <label className="block">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Tentativas</span>
                    <input type="number" value={editing.max_attempts ?? 3} onChange={(e) => setEditing({ ...editing, max_attempts: Number(e.target.value) })}
                      className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-md text-sm" />
                  </label>
                  <label className="block">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Backoff (s)</span>
                    <input type="number" value={editing.backoff_seconds ?? 60} onChange={(e) => setEditing({ ...editing, backoff_seconds: Number(e.target.value) })}
                      className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-md text-sm" />
                  </label>
                </div>

                <label className="block">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Segredo (HMAC opcional)</span>
                  <input value={editing.secret || ""} onChange={(e) => setEditing({ ...editing, secret: e.target.value || null })}
                    className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-md text-sm font-mono" placeholder="Gera header X-Lovable-Signature: sha256=..." />
                </label>

                <label className="block">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Headers extras (JSON)</span>
                  <textarea value={JSON.stringify(editing.headers || {}, null, 2)}
                    onChange={(e) => { try { setEditing({ ...editing, headers: JSON.parse(e.target.value || "{}") }); } catch { /* ignore */ } }}
                    className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-md text-xs font-mono" rows={3} />
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={editing.enabled ?? true} onChange={(e) => setEditing({ ...editing, enabled: e.target.checked })} />
                  Ativo
                </label>

                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm border border-border rounded-md">Cancelar</button>
                  <button onClick={save} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md">Salvar</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "events" && (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">Eventos que o sistema pode disparar. Cada evento aceita 1 webhook configurado.</p>
          {Object.entries(eventsByCat).map(([cat, evs]) => (
            <div key={cat}>
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{cat}</h3>
              <div className="space-y-2">
                {evs.map((ev) => (
                  <div key={ev.id} className="bg-card border border-border rounded-md p-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div>
                        <div className="font-medium text-sm">{ev.label}</div>
                        <code className="text-[11px] text-muted-foreground">{ev.key}</code>
                      </div>
                      <button onClick={() => { navigator.clipboard.writeText(ev.key); toast.success("key copiada"); }} className="text-muted-foreground hover:text-foreground">
                        <Copy size={12} />
                      </button>
                    </div>
                    {ev.description && <p className="text-xs text-muted-foreground mt-1">{ev.description}</p>}
                    <details className="mt-2">
                      <summary className="text-xs text-muted-foreground cursor-pointer">Exemplo de payload</summary>
                      <pre className="text-[11px] mt-1 bg-secondary/40 p-2 rounded overflow-x-auto">{JSON.stringify(ev.sample_payload, null, 2)}</pre>
                    </details>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "logs" && (
        <div className="space-y-2">
          <div className="flex justify-end">
            <button onClick={load} className="text-sm flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <RefreshCw size={14} /> Atualizar
            </button>
          </div>
          {deliveries.length === 0 && <p className="text-sm text-muted-foreground italic">Sem entregas ainda.</p>}
          {deliveries.map((d) => {
            const wh = webhooks.find((w) => w.id === d.webhook_id);
            const open = expandedLog === d.id;
            return (
              <div key={d.id} className="bg-card border border-border rounded-md">
                <button onClick={() => setExpandedLog(open ? null : d.id)} className="w-full flex items-center gap-3 p-3 text-left">
                  <ChevronRight size={14} className={`transition-transform ${open ? "rotate-90" : ""}`} />
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusColor[d.status] || ""}`}>{d.status}</span>
                  <span className="text-xs font-mono text-muted-foreground">{d.event_key}</span>
                  <span className="text-xs text-muted-foreground truncate flex-1">→ {wh?.name || "webhook removido"}{wh?.url ? ` · ${wh.url}` : ""}</span>
                  {d.response_status && <span className="text-xs">{d.response_status}</span>}
                  {d.duration_ms != null && <span className="text-[10px] text-muted-foreground">{d.duration_ms}ms</span>}
                  <span className="text-[10px] text-muted-foreground">{new Date(d.created_at).toLocaleString("pt-BR")}</span>
                </button>
                {open && (
                  <div className="border-t border-border p-3 space-y-2 text-xs">
                    <div>
                      <div className="text-muted-foreground uppercase tracking-wider text-[10px] mb-1">Payload enviado</div>
                      <pre className="bg-secondary/40 p-2 rounded overflow-x-auto">{JSON.stringify(d.payload, null, 2)}</pre>
                    </div>
                    {d.response_body && (
                      <div>
                        <div className="text-muted-foreground uppercase tracking-wider text-[10px] mb-1">Resposta</div>
                        <pre className="bg-secondary/40 p-2 rounded overflow-x-auto">{d.response_body}</pre>
                      </div>
                    )}
                    {d.error && (
                      <div>
                        <div className="text-rose-600 uppercase tracking-wider text-[10px] mb-1">Erro</div>
                        <pre className="bg-rose-50 text-rose-700 p-2 rounded overflow-x-auto">{d.error}</pre>
                      </div>
                    )}
                    <div className="text-[10px] text-muted-foreground">tentativa {d.attempt}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
