import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Mail, Send, Users } from "lucide-react";

type Mentee = { id: string; full_name: string; email: string };

type TemplateKey = "welcome-mentee" | "meeting-scheduled" | "meeting-available" | "activity-available" | "blog-insight";

type Preset = {
  id: string;
  label: string;
  values: Record<string, string>;
};

type FieldDef = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "datetime-local" | "number";
  placeholder?: string;
  required?: boolean;
};

type TemplateDef = {
  key: TemplateKey;
  label: string;
  description: string;
  defaultSubject: (data: Record<string, any>) => string;
  fields: FieldDef[];
  buildData: (form: Record<string, string>, mentee: Mentee) => Record<string, any>;
};

const TEMPLATES: TemplateDef[] = [
  {
    key: "welcome-mentee",
    label: "Boas-vindas (credenciais)",
    description: "Envia mensagem de boas-vindas com e-mail e senha temporária de acesso ao portal.",
    defaultSubject: () => "Bem-vindo à Mentoria Comercial · Gabriel Vieira",
    fields: [
      { key: "tempPassword", label: "Senha temporária", required: true, placeholder: "Ex.: Mentor@2025" },
      { key: "portalUrl", label: "URL do portal (opcional)", placeholder: "https://gabrielconsultor.com/mentorados/login" },
    ],
    buildData: (f, m) => ({
      fullName: m.full_name,
      email: m.email,
      tempPassword: f.tempPassword,
      ...(f.portalUrl ? { portalUrl: f.portalUrl } : {}),
    }),
  },
  {
    key: "meeting-scheduled",
    label: "Reunião agendada",
    description: "Confirmação de agendamento de uma sessão (com data, hora e link do Meet).",
    defaultSubject: (d) => `Reunião agendada: ${d.meetingTitle}`,
    fields: [
      { key: "meetingTitle", label: "Título da sessão", required: true, placeholder: "Ex.: Sessão 3 — Qualificação SPIN" },
      { key: "scheduledAt", label: "Data e hora", type: "datetime-local", required: true },
      { key: "meetLink", label: "Link do Google Meet (opcional)", placeholder: "https://meet.google.com/..." },
    ],
    buildData: (f, m) => ({
      fullName: m.full_name,
      meetingTitle: f.meetingTitle,
      scheduledAt: new Date(f.scheduledAt).toISOString(),
      ...(f.meetLink ? { meetLink: f.meetLink } : {}),
    }),
  },
  {
    key: "meeting-available",
    label: "Nova sessão liberada",
    description: "Avisa que uma nova sessão do cronograma foi liberada no portal.",
    defaultSubject: (d) => `Nova sessão liberada: ${d.meetingTitle}`,
    fields: [
      { key: "meetingTitle", label: "Título da sessão", required: true, placeholder: "Ex.: Sessão 4 — Negociação" },
      { key: "meetingSequence", label: "Número da sessão (opcional)", type: "number", placeholder: "Ex.: 4" },
    ],
    buildData: (f, m) => ({
      fullName: m.full_name,
      meetingTitle: f.meetingTitle,
      ...(f.meetingSequence ? { meetingSequence: Number(f.meetingSequence) } : {}),
    }),
  },
  {
    key: "activity-available",
    label: "Nova atividade",
    description: "Avisa que uma nova atividade prática foi liberada para o mentorado.",
    defaultSubject: (d) => `Nova atividade: ${d.activityTitle}`,
    fields: [
      { key: "activityTitle", label: "Título da atividade", required: true, placeholder: "Ex.: Mapear 10 contas-alvo" },
      { key: "activityDescription", label: "Descrição (opcional)", type: "textarea", placeholder: "Detalhes da atividade..." },
    ],
    buildData: (f, m) => ({
      fullName: m.full_name,
      activityTitle: f.activityTitle,
      ...(f.activityDescription ? { activityDescription: f.activityDescription } : {}),
    }),
  },
];

const MenteeEmailComposer = () => {
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [loading, setLoading] = useState(true);
  const [menteeId, setMenteeId] = useState<string>("");
  const [overrideEmail, setOverrideEmail] = useState<string>("");
  const [templateKey, setTemplateKey] = useState<TemplateKey>("welcome-mentee");
  const [form, setForm] = useState<Record<string, string>>({});
  const [customSubject, setCustomSubject] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  const template = useMemo(() => TEMPLATES.find((t) => t.key === templateKey)!, [templateKey]);
  const mentee = useMemo(() => mentees.find((m) => m.id === menteeId), [mentees, menteeId]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("mentees")
        .select("id, full_name, email")
        .order("created_at", { ascending: false });
      setMentees((data as Mentee[]) || []);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    setForm({});
    setCustomSubject("");
    setStatus(null);
  }, [templateKey]);

  const updateField = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const send = async () => {
    setStatus(null);
    if (!mentee) {
      setStatus({ kind: "err", msg: "Selecione um mentorado." });
      return;
    }
    for (const f of template.fields) {
      if (f.required && !form[f.key]?.trim()) {
        setStatus({ kind: "err", msg: `Preencha: ${f.label}` });
        return;
      }
    }
    const data = template.buildData(form, mentee);
    const subject = customSubject.trim() || template.defaultSubject(data);
    const to = overrideEmail.trim() || mentee.email;
    setSending(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("send-app-email", {
        body: { template: templateKey, to, data, subject },
      });
      if (error) throw error;
      if ((res as any)?.error) throw new Error((res as any).error);
      setStatus({ kind: "ok", msg: `E-mail enviado para ${to}.` });
    } catch (e: any) {
      setStatus({ kind: "err", msg: e?.message || "Falha ao enviar e-mail." });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-[320px_1fr] gap-6">
      {/* Template list */}
      <aside className="space-y-2">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
          <Mail size={14} /> Modelos
        </div>
        {TEMPLATES.map((t) => {
          const active = t.key === templateKey;
          return (
            <button
              key={t.key}
              onClick={() => setTemplateKey(t.key)}
              className={`w-full text-left p-3 rounded-lg border transition ${
                active
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <div className="text-sm font-medium text-foreground">{t.label}</div>
              <div className="text-xs text-muted-foreground mt-1 leading-snug">{t.description}</div>
            </button>
          );
        })}
      </aside>

      {/* Composer */}
      <section className="bg-card border border-border rounded-lg p-6 space-y-5">
        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-2">
            <Users size={14} /> Mentorado
          </label>
          <select
            value={menteeId}
            onChange={(e) => setMenteeId(e.target.value)}
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
          >
            <option value="">Selecione um mentorado…</option>
            {mentees.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name} — {m.email}
              </option>
            ))}
          </select>
        </div>

        {mentee && (
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
              Enviar para (opcional, sobrescreve o e-mail do mentorado)
            </label>
            <input
              type="email"
              value={overrideEmail}
              onChange={(e) => setOverrideEmail(e.target.value)}
              placeholder={mentee.email}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
            />
          </div>
        )}

        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
            Assunto (opcional — usa o padrão se vazio)
          </label>
          <input
            type="text"
            value={customSubject}
            onChange={(e) => setCustomSubject(e.target.value)}
            placeholder={template.defaultSubject(form)}
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-3 pt-2 border-t border-border">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Conteúdo</div>
          {template.fields.map((f) => (
            <div key={f.key}>
              <label className="text-xs text-muted-foreground mb-1 block">
                {f.label} {f.required && <span className="text-destructive">*</span>}
              </label>
              {f.type === "textarea" ? (
                <textarea
                  value={form[f.key] || ""}
                  onChange={(e) => updateField(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  rows={4}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
                />
              ) : (
                <input
                  type={f.type || "text"}
                  value={form[f.key] || ""}
                  onChange={(e) => updateField(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
                />
              )}
            </div>
          ))}
        </div>

        {status && (
          <div
            className={`text-sm px-3 py-2 rounded-md border ${
              status.kind === "ok"
                ? "bg-primary/10 border-primary/30 text-foreground"
                : "bg-destructive/10 border-destructive/30 text-destructive"
            }`}
          >
            {status.msg}
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-border">
          <button
            onClick={send}
            disabled={sending || !menteeId}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-md text-sm uppercase tracking-wider disabled:opacity-50"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {sending ? "Enviando…" : "Enviar e-mail"}
          </button>
        </div>
      </section>
    </div>
  );
};

export default MenteeEmailComposer;
