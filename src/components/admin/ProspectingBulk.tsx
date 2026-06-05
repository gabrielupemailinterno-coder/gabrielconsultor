import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Send, Upload, Users2, Trash2, AlertCircle } from "lucide-react";

type Recipient = { email: string; name?: string; company?: string };

type FunnelKey = "topo" | "meio" | "fundo" | "custom";

type FunnelPreset = {
  key: FunnelKey;
  label: string;
  description: string;
  subject: string;
  headline: string;
  intro: string;
  bullets: string;
  proofLine?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  signoff?: string;
};

const SITE = "https://gabrielconsultor.com";

const PRESETS: FunnelPreset[] = [
  {
    key: "topo",
    label: "Topo de funil — desperta dor",
    description: "Primeiro contato. Provoca uma reflexão sem pedir reunião direto.",
    subject: "{{company}}: 3 sinais de que o seu funil está vazando receita",
    headline: "3 sinais de que o seu funil comercial está vazando receita",
    intro:
      "Vi rapidamente o perfil da {{company}} e separei 3 pontos que costumam aparecer em operações no seu estágio. Não é diagnóstico — é provocação técnica.",
    bullets:
      "Vendedor fechando proposta sem qualificação real (CAC sobe, margem cai).\nMais de um canal de aquisição sem CAC medido por canal.\nReceita 100% dependente de novo lead, sem rotina de carteira ativa.",
    proofLine: "Em operações que rodaram esse diagnóstico, o ticket médio subiu 18-32% em 60-90 dias.",
    ctaLabel: "Ver o conteúdo no blog",
    ctaUrl: `${SITE}/blog/arquitetura-de-receita-pare-de-vender-no-escuro`,
    signoff: "Se algum desses pontos faz barulho aí, me responde com qual — eu te mando material específico.",
  },
  {
    key: "meio",
    label: "Meio de funil — entrega valor",
    description: "Segundo contato. Entrega conteúdo prático e convida a interagir.",
    subject: "Material prático: como limpar funil com SPIN Selling — {{company}}",
    headline: "Como limpar o funil aplicando SPIN Selling na prática",
    intro:
      "Continuando a conversa: separei um material que mostra, com matemática, como a qualificação SPIN destrava conversão sem precisar gerar mais lead. É leitura de 7 minutos.",
    bullets:
      "Situação · Problema · Implicação · Necessidade de solução.\nMatriz de qualificação aplicada em call real.\nCálculo do impacto no CAC quando qualificação melhora 20%.",
    proofLine: "Case real: R$ 1MM em contratos fechados em ~2 meses após redesenho do processo.",
    ctaLabel: "Ler o artigo completo",
    ctaUrl: `${SITE}/blog/spin-selling-na-pratica-a-matematica-para-limpar-seu-funil-e-escalar-a-conversao`,
    signoff: "Depois da leitura, se quiser que eu olhe o seu funil com esse mesmo rigor, me responde.",
  },
  {
    key: "fundo",
    label: "Fundo de funil — chama pra reunião",
    description: "Terceiro contato. Pede 30 minutos pra diagnóstico estruturado.",
    subject: "{{company}}: 30 minutos pra mapear gargalo comercial",
    headline: "Proposta: 30 minutos pra mapear o gargalo comercial da {{company}}",
    intro:
      "Quero te propor o seguinte: 30 minutos de conversa estruturada, sem pitch, sem proposta no fim. Você apresenta a operação, eu devolvo um diagnóstico técnico com os 3 maiores pontos de alavanca.",
    bullets:
      "Diagnóstico ao vivo: funil, qualificação, conversão, retenção.\nDevolutiva escrita com prioridades em até 48h.\nVocê decide se faz sentido seguir — sem obrigação.",
    proofLine: "Já apliquei esse formato com indústrias, SaaS, serviços B2B e distribuidores em vários portes.",
    ctaLabel: "Agendar 30 minutos",
    ctaUrl: `${SITE}/consultoria`,
    signoff: "Se preferir, me responde aqui com 2 horários que funcionam pra você essa semana.",
  },
  {
    key: "custom",
    label: "Em branco — eu escrevo",
    description: "Template vazio para você escrever do zero.",
    subject: "",
    headline: "",
    intro: "",
    bullets: "",
    signoff: "",
  },
];

const personalize = (s: string, r: Recipient) =>
  s
    .split("{{name}}").join(r.name || "")
    .split("{{first_name}}").join((r.name || "").split(" ")[0] || "")
    .split("{{company}}").join(r.company || "sua empresa");

const parseCsv = (text: string): Recipient[] => {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const sep = lines[0].includes(";") ? ";" : lines[0].includes(",") ? "," : "\t";
  const header = lines[0].toLowerCase().split(sep).map((h) => h.trim());
  const hasHeader = header.includes("email") || header.includes("e-mail");
  const rows = hasHeader ? lines.slice(1) : lines;

  const emailIdx = hasHeader ? Math.max(header.indexOf("email"), header.indexOf("e-mail")) : -1;
  const nameIdx = hasHeader ? Math.max(header.indexOf("name"), header.indexOf("nome")) : -1;
  const companyIdx = hasHeader ? Math.max(header.indexOf("company"), header.indexOf("empresa")) : -1;

  const out: Recipient[] = [];
  for (const line of rows) {
    const cols = line.split(sep).map((c) => c.trim().replace(/^"|"$/g, ""));
    if (hasHeader) {
      const email = cols[emailIdx];
      if (!email) continue;
      out.push({
        email,
        name: nameIdx >= 0 ? cols[nameIdx] : undefined,
        company: companyIdx >= 0 ? cols[companyIdx] : undefined,
      });
    } else {
      // No header: try to detect email column
      const email = cols.find((c) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c));
      if (!email) continue;
      const others = cols.filter((c) => c !== email);
      out.push({ email, name: others[0], company: others[1] });
    }
  }
  return out;
};

const ProspectingBulk = () => {
  const [presetKey, setPresetKey] = useState<FunnelKey>("topo");
  const preset = useMemo(() => PRESETS.find((p) => p.key === presetKey)!, [presetKey]);

  const [subject, setSubject] = useState(preset.subject);
  const [headline, setHeadline] = useState(preset.headline);
  const [intro, setIntro] = useState(preset.intro);
  const [bullets, setBullets] = useState(preset.bullets);
  const [proofLine, setProofLine] = useState(preset.proofLine || "");
  const [ctaLabel, setCtaLabel] = useState(preset.ctaLabel || "");
  const [ctaUrl, setCtaUrl] = useState(preset.ctaUrl || "");
  const [signoff, setSignoff] = useState(preset.signoff || "");

  const [rawList, setRawList] = useState("");
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [throttleMs, setThrottleMs] = useState(400);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; total: number; details?: any[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applyPreset = (k: FunnelKey) => {
    const p = PRESETS.find((x) => x.key === k)!;
    setPresetKey(k);
    setSubject(p.subject);
    setHeadline(p.headline);
    setIntro(p.intro);
    setBullets(p.bullets);
    setProofLine(p.proofLine || "");
    setCtaLabel(p.ctaLabel || "");
    setCtaUrl(p.ctaUrl || "");
    setSignoff(p.signoff || "");
    setResult(null);
    setError(null);
  };

  const handleParse = () => {
    const parsed = parseCsv(rawList);
    setRecipients(parsed);
    setResult(null);
    setError(null);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setRawList(text);
    setRecipients(parseCsv(text));
    setResult(null);
    setError(null);
  };

  const removeRecipient = (email: string) => {
    setRecipients(recipients.filter((r) => r.email !== email));
  };

  const send = async () => {
    setError(null);
    setResult(null);
    if (recipients.length === 0) {
      setError("Adicione pelo menos um destinatário.");
      return;
    }
    if (!headline.trim() || !intro.trim()) {
      setError("Preencha pelo menos o título e a introdução.");
      return;
    }
    setSending(true);
    try {
      // Group calls in batches of 50 to stay under the 200 cap and keep UX responsive
      const BATCH = 50;
      let sent = 0, failed = 0, total = 0;
      const allDetails: any[] = [];

      for (let i = 0; i < recipients.length; i += BATCH) {
        const slice = recipients.slice(i, i + BATCH);
        // Personalize once per recipient by passing data per-call (subject/headline templated)
        // We do per-recipient personalization on client by sending one batch per recipient group with same template
        // To keep variables-aware personalization, send 1-by-1 inside this batch using send-app-email
        for (const r of slice) {
          const personalSubject = personalize(subject, r).trim() || personalize(headline, r) || "Uma ideia comercial para a sua operação";
          const data = {
            recipientName: r.name,
            companyName: r.company,
            headline: personalize(headline, r),
            intro: personalize(intro, r),
            bullets: bullets ? bullets.split("\n").map((l) => personalize(l, r).trim()).filter(Boolean) : undefined,
            proofLine: proofLine ? personalize(proofLine, r) : undefined,
            ctaLabel: ctaLabel || undefined,
            ctaUrl: ctaUrl ? personalize(ctaUrl, r) : undefined,
            signoff: signoff ? personalize(signoff, r) : undefined,
          };
          try {
            const { data: res, error: err } = await supabase.functions.invoke("send-app-email", {
              body: { template: "prospecting", to: r.email, data, subject: personalSubject },
            });
            if (err || (res as any)?.error) {
              failed++;
              allDetails.push({ email: r.email, ok: false, error: err?.message || (res as any)?.error });
            } else {
              sent++;
              allDetails.push({ email: r.email, ok: true });
            }
          } catch (e: any) {
            failed++;
            allDetails.push({ email: r.email, ok: false, error: e?.message });
          }
          total++;
          // Throttle
          if (throttleMs > 0) await new Promise((res) => setTimeout(res, throttleMs));
        }
      }
      setResult({ sent, failed, total, details: allDetails });
    } catch (e: any) {
      setError(e?.message || "Falha no envio em massa.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-6">
      <section className="space-y-5">
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
              Modelo de prospecção
            </label>
            <div className="grid sm:grid-cols-2 gap-2">
              {PRESETS.map((p) => {
                const active = p.key === presetKey;
                return (
                  <button
                    key={p.key}
                    onClick={() => applyPreset(p.key)}
                    className={`text-left p-3 rounded-md border transition ${
                      active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="text-sm font-medium">{p.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{p.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="text-xs text-muted-foreground italic">
            Use <code className="px-1 py-0.5 bg-muted rounded">{"{{first_name}}"}</code>,{" "}
            <code className="px-1 py-0.5 bg-muted rounded">{"{{name}}"}</code>,{" "}
            <code className="px-1 py-0.5 bg-muted rounded">{"{{company}}"}</code> em qualquer campo — serão substituídos por destinatário.
          </div>

          <Field label="Assunto" value={subject} onChange={setSubject} placeholder="Assunto do e-mail" />
          <Field label="Título (headline)" value={headline} onChange={setHeadline} placeholder="Título principal" required />
          <Field label="Introdução" value={intro} onChange={setIntro} placeholder="Parágrafo de abertura" textarea required />
          <Field label="Pontos-chave (uma linha por bullet)" value={bullets} onChange={setBullets} placeholder="Ponto 1&#10;Ponto 2" textarea />
          <Field label="Prova social (opcional)" value={proofLine} onChange={setProofLine} placeholder="Frase de prova social" />
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Texto do botão" value={ctaLabel} onChange={setCtaLabel} placeholder="Ex.: Agendar conversa" />
            <Field label="Link do botão" value={ctaUrl} onChange={setCtaUrl} placeholder="https://..." />
          </div>
          <Field label="Linha de fechamento" value={signoff} onChange={setSignoff} placeholder="Linha de encerramento" textarea />
        </div>
      </section>

      <aside className="space-y-4">
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Users2 size={14} /> Lista de destinatários
            </div>
            <span className="text-xs text-foreground font-mono">{recipients.length}</span>
          </div>

          <label className="block">
            <span className="text-xs text-muted-foreground mb-2 block">Upload de CSV (email, nome, empresa)</span>
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-2 px-3 py-2 text-xs border border-border rounded-md cursor-pointer hover:border-primary">
                <Upload size={14} /> Escolher arquivo
                <input type="file" accept=".csv,.txt,.tsv" className="hidden" onChange={handleFile} />
              </label>
            </div>
          </label>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Ou cole a lista (CSV/TSV ou só e-mails)</label>
            <textarea
              value={rawList}
              onChange={(e) => setRawList(e.target.value)}
              rows={5}
              placeholder={`email,nome,empresa\njoao@acme.com,João,Acme\nmaria@beta.com,Maria,Beta`}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-xs font-mono"
            />
            <button
              onClick={handleParse}
              className="mt-2 text-xs px-3 py-1.5 border border-border rounded-md hover:border-primary"
            >
              Processar lista
            </button>
          </div>

          {recipients.length > 0 && (
            <div className="border-t border-border pt-3 max-h-72 overflow-y-auto space-y-1">
              {recipients.map((r) => (
                <div key={r.email} className="flex items-center justify-between text-xs py-1">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-mono text-foreground">{r.email}</div>
                    {(r.name || r.company) && (
                      <div className="text-muted-foreground truncate">
                        {r.name}{r.name && r.company ? " · " : ""}{r.company}
                      </div>
                    )}
                  </div>
                  <button onClick={() => removeRecipient(r.email)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Intervalo entre envios (ms)</label>
            <input
              type="number"
              value={throttleMs}
              onChange={(e) => setThrottleMs(Number(e.target.value))}
              min={0}
              step={100}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-xs"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Recomendado 300-600ms para não acionar rate limit do servidor de e-mail.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-xs px-3 py-2 rounded-md bg-destructive/10 border border-destructive/30 text-destructive">
              <AlertCircle size={14} className="shrink-0 mt-0.5" /> {error}
            </div>
          )}

          {result && (
            <div className="text-xs px-3 py-2 rounded-md bg-primary/10 border border-primary/30 space-y-1">
              <div className="font-medium text-foreground">
                Envio concluído: {result.sent}/{result.total} entregues ({result.failed} falhas)
              </div>
              {result.failed > 0 && result.details && (
                <details className="text-muted-foreground">
                  <summary className="cursor-pointer">Ver falhas</summary>
                  <ul className="mt-1 space-y-0.5">
                    {result.details.filter((d: any) => !d.ok).map((d: any, i: number) => (
                      <li key={i} className="font-mono">{d.email} — {d.error}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}

          <button
            onClick={send}
            disabled={sending || recipients.length === 0}
            className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-3 rounded-md text-sm uppercase tracking-wider disabled:opacity-50"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {sending ? `Enviando…` : `Enviar para ${recipients.length}`}
          </button>
        </div>
      </aside>
    </div>
  );
};

const Field = ({
  label, value, onChange, placeholder, textarea, required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  textarea?: boolean;
  required?: boolean;
}) => (
  <div>
    <label className="text-xs text-muted-foreground mb-1 block">
      {label} {required && <span className="text-destructive">*</span>}
    </label>
    {textarea ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
      />
    ) : (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
      />
    )}
  </div>
);

export default ProspectingBulk;
