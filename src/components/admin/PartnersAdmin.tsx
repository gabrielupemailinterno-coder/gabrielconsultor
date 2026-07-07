import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Copy, Check, Pencil, X, ChevronDown, ChevronRight, Trash2 } from "lucide-react";
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
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partner | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [trialForm, setTrialForm] = useState<Record<string, { product_type: string; contact_email: string; expires_at: string; notes: string }>>({});

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
    const [pRes, tRes] = await Promise.all([
      (supabase as any).from("partners").select("*").order("created_at", { ascending: false }),
      (supabase as any).from("partner_trials").select("*").order("created_at", { ascending: false }),
    ]);
    setPartners((pRes.data as Partner[]) || []);
    setTrials((tRes.data as Trial[]) || []);
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
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
              <th className="text-left px-4 py-2">Parceiro</th>
              <th className="text-left px-4 py-2">Código</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="text-left px-4 py-2">Observações</th>
              <th className="text-right px-4 py-2">Link</th>
            </tr>
          </thead>
          <tbody>
            {partners.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-muted-foreground py-8 text-sm">
                  Nenhum parceiro cadastrado.
                </td>
              </tr>
            )}
            {partners.map((p) => {
              const isEdit = editing?.id === p.id;
              return (
                <tr key={p.id} className="border-t border-border align-top">
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
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
