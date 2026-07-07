import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Copy, Check, Pencil, X, ChevronDown, ChevronRight, Trash2, UserPlus, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Partner = {
  id: string;
  name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  partner_code: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  commission_rate: number;
};

type PartnerLink = {
  id: string;
  partner_id: string;
  slug: string;
  label: string | null;
  destination: string;
  active: boolean;
  created_at: string;
};

type Conversion = {
  id: string;
  partner_id: string;
  kind: "lead" | "purchase";
  source_table: string;
  amount_cents: number | null;
  commission_cents: number;
  commission_status: "pending" | "approved" | "paid" | "canceled";
  created_at: string;
};

const brl = (cents: number | null | undefined) =>
  ((cents || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const CONV_STATUS = ["pending", "approved", "paid", "canceled"] as const;
const convStatusLabel: Record<string, string> = {
  pending: "Pendente",
  approved: "Aprovada",
  paid: "Paga",
  canceled: "Cancelada",
};
const convStatusClass: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-600",
  approved: "bg-primary/15 text-primary",
  paid: "bg-emerald-500/15 text-emerald-600",
  canceled: "bg-muted text-muted-foreground",
};

type Trial = {
  id: string;
  partner_id: string;
  product_type: "score_comercial" | "mentoria" | "ambos";
  contact_email: string | null;
  status: "pending" | "active" | "expired" | "revoked";
  expires_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

const PRODUCT_LABEL: Record<string, string> = {
  score_comercial: "Score Comercial",
  mentoria: "Mentoria",
  ambos: "Ambos",
};

const TRIAL_STATUS = ["pending", "active", "expired", "revoked"] as const;
const trialStatusLabel: Record<string, string> = {
  pending: "Pendente",
  active: "Ativo",
  expired: "Expirado",
  revoked: "Revogado",
};
const trialStatusClass: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-600",
  active: "bg-primary/15 text-primary",
  expired: "bg-muted text-muted-foreground",
  revoked: "bg-destructive/15 text-destructive",
};

const STATUS_OPTIONS = ["active", "trial", "inactive"] as const;

const statusLabel: Record<string, string> = {
  active: "Ativo",
  trial: "Teste",
  inactive: "Inativo",
};

const statusClass: Record<string, string> = {
  active: "bg-primary/15 text-primary",
  trial: "bg-yellow-500/15 text-yellow-600",
  inactive: "bg-muted text-muted-foreground",
};

const genCode = (name: string) => {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 8) || "PARC";
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${base}-${suffix}`;
};

const linkFor = (code: string) =>
  `${typeof window !== "undefined" ? window.location.origin : ""}/scoreapp?partner=${encodeURIComponent(code)}`;

export default function PartnersAdmin() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [links, setLinks] = useState<PartnerLink[]>([]);
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partner | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [trialForm, setTrialForm] = useState<Record<string, { product_type: string; contact_email: string; expires_at: string; notes: string }>>({});
  const [linkEmail, setLinkEmail] = useState<Record<string, string>>({});
  const [linkingPid, setLinkingPid] = useState<string | null>(null);
  const [convFilter, setConvFilter] = useState<string>("all");

  const [form, setForm] = useState({
    name: "",
    company_name: "",
    email: "",
    phone: "",
    partner_code: "",
    notes: "",
  });

  const load = async () => {
    setLoading(true);
    const [pRes, tRes, lRes, cRes] = await Promise.all([
      (supabase as any).from("partners").select("*").order("created_at", { ascending: false }),
      (supabase as any).from("partner_trials").select("*").order("created_at", { ascending: false }),
      (supabase as any).from("partner_links").select("*").order("created_at", { ascending: false }),
      (supabase as any).from("partner_conversions").select("*").order("created_at", { ascending: false }),
    ]);
    setPartners((pRes.data as Partner[]) || []);
    setTrials((tRes.data as Trial[]) || []);
    setLinks((lRes.data as PartnerLink[]) || []);
    setConversions((cRes.data as Conversion[]) || []);
    setLoading(false);
  };


  useEffect(() => {
    load();
  }, []);

  const trialsByPartner = useMemo(() => {
    const map: Record<string, Trial[]> = {};
    trials.forEach((t) => {
      (map[t.partner_id] ||= []).push(t);
    });
    return map;
  }, [trials]);

  const resetForm = () =>
    setForm({ name: "", company_name: "", email: "", phone: "", partner_code: "", notes: "" });

  const create = async () => {
    if (!form.name.trim()) {
      toast({ title: "Nome obrigatório", variant: "destructive" });
      return;
    }
    const code = form.partner_code.trim() || genCode(form.name);
    const { error } = await (supabase as any).from("partners").insert({
      name: form.name.trim(),
      company_name: form.company_name.trim() || null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      partner_code: code,
      notes: form.notes.trim() || null,
      status: "active",
    });
    if (error) {
      toast({ title: "Erro ao criar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Parceiro criado" });
    resetForm();
    setCreating(false);
    load();
  };

  const updatePartner = async (id: string, patch: Partial<Partner>) => {
    const { error } = await (supabase as any).from("partners").update(patch).eq("id", id);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    load();
  };

  const copy = async (code: string) => {
    await navigator.clipboard.writeText(linkFor(code));
    setCopied(code);
    toast({ title: "Link copiado" });
    setTimeout(() => setCopied((c) => (c === code ? null : c)), 1500);
  };

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    toast({ title: "Código copiado" });
  };

  const getTrialForm = (pid: string) =>
    trialForm[pid] || { product_type: "score_comercial", contact_email: "", expires_at: "", notes: "" };

  const setTrialFormFor = (pid: string, patch: Partial<{ product_type: string; contact_email: string; expires_at: string; notes: string }>) => {
    setTrialForm((prev) => ({ ...prev, [pid]: { ...getTrialForm(pid), ...patch } }));
  };

  const createTrial = async (partnerId: string) => {
    const f = getTrialForm(partnerId);
    const payload: any = {
      partner_id: partnerId,
      product_type: f.product_type,
      contact_email: f.contact_email.trim() || null,
      notes: f.notes.trim() || null,
      status: "pending",
      expires_at: f.expires_at ? new Date(f.expires_at).toISOString() : null,
    };
    const { error } = await (supabase as any).from("partner_trials").insert(payload);
    if (error) {
      toast({ title: "Erro ao criar teste", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Teste concedido" });
    setTrialFormFor(partnerId, { contact_email: "", expires_at: "", notes: "" });
    load();
  };

  const updateTrial = async (id: string, patch: Partial<Trial>) => {
    const { error } = await (supabase as any).from("partner_trials").update(patch).eq("id", id);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    load();
  };

  const deleteTrial = async (id: string) => {
    if (!confirm("Excluir este teste?")) return;
    await (supabase as any).from("partner_trials").delete().eq("id", id);
    load();
  };

  const toggleExpand = (id: string) => setExpanded((e) => ({ ...e, [id]: !e[id] }));

  const linkUserToPartner = async (partnerId: string) => {
    const email = (linkEmail[partnerId] || "").trim();
    if (!email) {
      toast({ title: "Informe um e-mail", variant: "destructive" });
      return;
    }
    setLinkingPid(partnerId);
    const { data, error } = await supabase.functions.invoke("partner-admin", {
      body: { action: "link_user", partner_id: partnerId, email, redirect_to: `${window.location.origin}/parceiro` },
    });
    setLinkingPid(null);
    if (error || (data as any)?.error) {
      toast({ title: "Erro ao vincular", description: (error as any)?.message || (data as any)?.error, variant: "destructive" });
      return;
    }
    toast({ title: "Usuário vinculado", description: "Link de acesso enviado por e-mail." });
    setLinkEmail((m) => ({ ...m, [partnerId]: "" }));
    load();
  };

  const updateConversionStatus = async (id: string, status: string) => {
    const { data, error } = await supabase.functions.invoke("partner-admin", {
      body: { action: "update_conversion_status", id, status },
    });
    if (error || (data as any)?.error) {
      toast({ title: "Erro", description: (error as any)?.message || (data as any)?.error, variant: "destructive" });
      return;
    }
    load();
  };

  const linksByPartner = useMemo(() => {
    const m: Record<string, PartnerLink[]> = {};
    links.forEach((l) => ((m[l.partner_id] ||= []).push(l)));
    return m;
  }, [links]);

  const convByPartner = useMemo(() => {
    const m: Record<string, Conversion[]> = {};
    conversions.forEach((c) => ((m[c.partner_id] ||= []).push(c)));
    return m;
  }, [conversions]);

  const totalPending = conversions.filter((c) => c.commission_status === "pending").reduce((a, b) => a + b.commission_cents, 0);
  const totalApproved = conversions.filter((c) => c.commission_status === "approved").reduce((a, b) => a + b.commission_cents, 0);
  const totalPaid = conversions.filter((c) => c.commission_status === "paid").reduce((a, b) => a + b.commission_cents, 0);

  const filteredConversions = conversions.filter((c) => convFilter === "all" || c.commission_status === convFilter);
  const partnerName = (pid: string) => partners.find((p) => p.id === pid)?.name || pid.slice(0, 6);

  const total = partners.length;
  const active = partners.filter((p) => p.status === "active").length;
  const inactive = partners.filter((p) => p.status !== "active").length;
  const recent = partners.slice(0, 3);


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Total</p>
          <p className="font-mono text-2xl mt-1">{total}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Ativos</p>
          <p className="font-mono text-2xl mt-1 text-primary">{active}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Teste / Inativos</p>
          <p className="font-mono text-2xl mt-1">{inactive}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Testes concedidos</p>
          <p className="font-mono text-2xl mt-1">{trials.length}</p>
          <p className="text-[10px] text-muted-foreground">{trials.filter((t) => t.status === "active").length} ativos</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Últimos</p>
          <ul className="mt-1 space-y-0.5">
            {recent.length === 0 && <li className="text-xs text-muted-foreground">—</li>}
            {recent.map((p) => (
              <li key={p.id} className="text-xs truncate">{p.name}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="flex items-center justify-between">
        <h3 className="font-serif text-lg">Parceiros</h3>
        <button
          onClick={() => setCreating((v) => !v)}
          className="inline-flex items-center gap-1 bg-primary text-primary-foreground text-xs px-3 py-2 rounded-md uppercase tracking-wide"
        >
          {creating ? <X size={14} /> : <Plus size={14} />}
          {creating ? "Cancelar" : "Novo parceiro"}
        </button>
      </section>

      {creating && (
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              placeholder="Nome *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-background border border-border rounded px-3 py-2 text-sm"
            />
            <input
              placeholder="Empresa"
              value={form.company_name}
              onChange={(e) => setForm({ ...form, company_name: e.target.value })}
              className="bg-background border border-border rounded px-3 py-2 text-sm"
            />
            <input
              placeholder="E-mail"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="bg-background border border-border rounded px-3 py-2 text-sm"
            />
            <input
              placeholder="Telefone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="bg-background border border-border rounded px-3 py-2 text-sm"
            />
            <input
              placeholder="Código (auto se vazio)"
              value={form.partner_code}
              onChange={(e) => setForm({ ...form, partner_code: e.target.value.toUpperCase() })}
              className="bg-background border border-border rounded px-3 py-2 text-sm font-mono"
            />
          </div>
          <textarea
            placeholder="Observações"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
            className="w-full bg-background border border-border rounded px-3 py-2 text-sm"
          />
          <div className="flex justify-end">
            <button
              onClick={create}
              className="bg-primary text-primary-foreground text-xs px-4 py-2 rounded-md uppercase tracking-wide"
            >
              Criar parceiro
            </button>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-[10px] uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="w-6 px-2 py-2"></th>
              <th className="text-left px-4 py-2">Parceiro</th>
              <th className="text-left px-4 py-2">Código</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="text-left px-4 py-2">Testes</th>
              <th className="text-left px-4 py-2">Observações</th>
              <th className="text-right px-4 py-2">Link</th>
            </tr>
          </thead>
          <tbody>
            {partners.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-muted-foreground py-8 text-sm">
                  Nenhum parceiro cadastrado.
                </td>
              </tr>
            )}
            {partners.map((p) => {
              const isEdit = editing?.id === p.id;
              const pTrials = trialsByPartner[p.id] || [];
              const isOpen = !!expanded[p.id];
              const tf = getTrialForm(p.id);
              return (
                <React.Fragment key={p.id}>
                  <tr key={p.id} className="border-t border-border align-top">
                    <td className="px-2 py-3">
                      <button onClick={() => toggleExpand(p.id)} className="text-muted-foreground hover:text-primary">
                        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.company_name || "—"}{p.email ? ` · ${p.email}` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => copyCode(p.partner_code)}
                        className="font-mono text-xs bg-muted px-2 py-1 rounded hover:bg-muted/70"
                        title="Copiar código"
                      >
                        {p.partner_code}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={p.status}
                        onChange={(e) => updatePartner(p.id, { status: e.target.value })}
                        className={`text-xs px-2 py-1 rounded border-0 outline-none ${statusClass[p.status] || statusClass.inactive}`}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{statusLabel[s]}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleExpand(p.id)}
                        className="text-xs font-mono bg-muted px-2 py-1 rounded hover:bg-muted/70"
                      >
                        {pTrials.length}
                      </button>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      {isEdit ? (
                        <div className="flex gap-1">
                          <textarea
                            value={editing!.notes || ""}
                            onChange={(e) => setEditing({ ...editing!, notes: e.target.value })}
                            rows={2}
                            className="flex-1 bg-background border border-border rounded px-2 py-1 text-xs"
                          />
                          <button
                            onClick={async () => {
                              await updatePartner(p.id, { notes: editing!.notes });
                              setEditing(null);
                            }}
                            className="text-primary"
                            title="Salvar"
                          >
                            <Check size={14} />
                          </button>
                          <button onClick={() => setEditing(null)} title="Cancelar">
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-start gap-1">
                          <p className="text-xs text-muted-foreground flex-1 whitespace-pre-wrap">
                            {p.notes || "—"}
                          </p>
                          <button onClick={() => setEditing(p)} className="text-muted-foreground hover:text-primary">
                            <Pencil size={12} />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => copy(p.partner_code)}
                        className="inline-flex items-center gap-1 text-xs bg-muted hover:bg-muted/70 px-2 py-1 rounded"
                        title={linkFor(p.partner_code)}
                      >
                        {copied === p.partner_code ? <Check size={12} /> : <Copy size={12} />}
                        Copiar link
                      </button>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="bg-muted/10 border-t border-border">
                      <td></td>
                      <td colSpan={6} className="px-4 py-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-3 border-b border-border">
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Comissão (%)</p>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={1}
                              defaultValue={p.commission_rate ?? 70}
                              onBlur={(e) => {
                                const v = Number(e.target.value);
                                if (!Number.isNaN(v) && v !== Number(p.commission_rate)) {
                                  updatePartner(p.id, { commission_rate: v } as any);
                                }
                              }}
                              className="bg-background border border-border rounded px-2 py-1 text-xs font-mono w-24"
                            />
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                              {p.user_id ? "Conta vinculada" : "Vincular usuário do portal"}
                            </p>
                            {p.user_id ? (
                              <p className="text-xs font-mono text-muted-foreground truncate">{p.user_id}</p>
                            ) : (
                              <div className="flex gap-2">
                                <input
                                  type="email"
                                  placeholder="email@exemplo.com"
                                  value={linkEmail[p.id] || ""}
                                  onChange={(e) => setLinkEmail((m) => ({ ...m, [p.id]: e.target.value }))}
                                  className="flex-1 bg-background border border-border rounded px-2 py-1 text-xs"
                                />
                                <button
                                  disabled={linkingPid === p.id}
                                  onClick={() => linkUserToPartner(p.id)}
                                  className="inline-flex items-center gap-1 bg-primary text-primary-foreground text-xs px-3 py-1.5 rounded disabled:opacity-50"
                                >
                                  <UserPlus size={12} /> Vincular
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>

                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                            Testes concedidos
                          </p>
                          {pTrials.length === 0 ? (
                            <p className="text-xs text-muted-foreground">Nenhum teste registrado.</p>
                          ) : (
                            <div className="space-y-1">
                              {pTrials.map((t) => (
                                <div
                                  key={t.id}
                                  className="flex items-center gap-2 bg-background border border-border rounded px-3 py-2 text-xs"
                                >
                                  <span className="font-mono">{PRODUCT_LABEL[t.product_type]}</span>
                                  <span className="text-muted-foreground truncate flex-1">
                                    {t.contact_email || "—"}
                                    {t.expires_at ? ` · até ${new Date(t.expires_at).toLocaleDateString("pt-BR")}` : ""}
                                    {t.notes ? ` · ${t.notes}` : ""}
                                  </span>
                                  <select
                                    value={t.status}
                                    onChange={(e) => updateTrial(t.id, { status: e.target.value as Trial["status"] })}
                                    className={`text-[10px] px-2 py-1 rounded border-0 outline-none ${trialStatusClass[t.status]}`}
                                  >
                                    {TRIAL_STATUS.map((s) => (
                                      <option key={s} value={s}>{trialStatusLabel[s]}</option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={() => deleteTrial(t.id)}
                                    className="text-muted-foreground hover:text-destructive"
                                    title="Excluir"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="border-t border-border pt-3">
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                            Novo teste
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                            <select
                              value={tf.product_type}
                              onChange={(e) => setTrialFormFor(p.id, { product_type: e.target.value })}
                              className="bg-background border border-border rounded px-2 py-1 text-xs"
                            >
                              <option value="score_comercial">Score Comercial</option>
                              <option value="mentoria">Mentoria</option>
                              <option value="ambos">Ambos</option>
                            </select>
                            <input
                              type="email"
                              placeholder="E-mail do contato"
                              value={tf.contact_email}
                              onChange={(e) => setTrialFormFor(p.id, { contact_email: e.target.value })}
                              className="bg-background border border-border rounded px-2 py-1 text-xs"
                            />
                            <input
                              type="date"
                              value={tf.expires_at}
                              onChange={(e) => setTrialFormFor(p.id, { expires_at: e.target.value })}
                              className="bg-background border border-border rounded px-2 py-1 text-xs"
                            />
                            <input
                              placeholder="Observações"
                              value={tf.notes}
                              onChange={(e) => setTrialFormFor(p.id, { notes: e.target.value })}
                              className="bg-background border border-border rounded px-2 py-1 text-xs"
                            />
                          </div>
                          <div className="flex justify-end mt-2">
                            <button
                              onClick={() => createTrial(p.id)}
                              className="inline-flex items-center gap-1 bg-primary text-primary-foreground text-xs px-3 py-1.5 rounded uppercase tracking-wide"
                            >
                              <Plus size={12} /> Conceder teste
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

