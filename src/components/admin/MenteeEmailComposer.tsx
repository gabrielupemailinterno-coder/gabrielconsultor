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
  presets?: Preset[];
};

const BLOG_BASE = "https://gabrielconsultor.com/blog";

const BLOG_PRESETS: Preset[] = [
  {
    id: "spin-selling",
    label: "SPIN Selling na prática",
    values: {
      eyebrow: "INSIGHT · QUALIFICAÇÃO",
      title: "SPIN Selling na prática: a matemática que limpa o seu funil",
      intro: "A maioria das operações acha que o problema é falta de lead. Quando a gente abre o funil, o erro quase sempre está na qualificação — não no topo.",
      bullets: "Situação: entenda o contexto operacional antes de propor qualquer coisa.\nProblema: traga à tona a dor que o cliente ainda não verbalizou.\nImplicação: faça o custo da inércia ficar maior que o custo da decisão.\nNecessidade de solução: deixe o próprio cliente descrever o ganho.",
      body: "Quando o vendedor aplica SPIN com disciplina, a taxa de conversão de proposta para fechamento sobe — e o tempo médio de ciclo cai. É matemática, não sorte.",
      ctaLabel: "Ler artigo completo",
      ctaUrl: `${BLOG_BASE}/spin-selling-na-pratica-a-matematica-para-limpar-seu-funil-e-escalar-a-conversao`,
      closing: "Aplique numa call essa semana e me conta o resultado.",
    },
  },
  {
    id: "arquitetura-receita",
    label: "Arquitetura de Receita",
    values: {
      eyebrow: "INSIGHT · ESTRATÉGIA",
      title: "Arquitetura de Receita: pare de vender no escuro",
      intro: "Receita previsível não nasce de esforço, nasce de estrutura. Existem 4 camadas que sustentam uma operação comercial saudável — e é nelas que você precisa olhar antes de contratar mais um vendedor.",
      bullets: "Camada 1 — ICP e oferta: para quem você vende e o que entrega de valor real.\nCamada 2 — Aquisição: quais canais sustentam o seu CAC.\nCamada 3 — Conversão: processo, qualificação e cadência.\nCamada 4 — Retenção e expansão: onde mora a receita mais barata.",
      body: "Se uma dessas camadas está furada, todo o resto compensa com esforço — e esforço não escala.",
      ctaLabel: "Ler artigo completo",
      ctaUrl: `${BLOG_BASE}/arquitetura-de-receita-pare-de-vender-no-escuro`,
      closing: "Qual camada está mais fraca na sua operação hoje? Responde aqui.",
    },
  },
  {
    id: "icp-filtro",
    label: "ICP como filtro de decisão",
    values: {
      eyebrow: "INSIGHT · ICP",
      title: "ICP não é uma persona bonita no slide — é um filtro de decisão",
      intro: "Se o seu ICP não muda a sua rotina comercial diária, ele não existe. Persona não qualifica lead, não decide canal e não fecha negócio.",
      bullets: "Defina critérios objetivos: setor, porte, momento, dor mensurável.\nUse o ICP para dizer NÃO — não para abraçar todo mundo.\nRevise trimestralmente: quem fechou, ficou e expandiu?",
      body: "Um ICP bem desenhado economiza CAC, encurta ciclo e melhora margem. É um dos exercícios de maior ROI numa operação comercial.",
      ctaLabel: "Ler artigo completo",
      ctaUrl: `${BLOG_BASE}/icp-nao-e-persona-bonita-e-filtro-de-decisao`,
      closing: "Olhe seus últimos 10 fechados: existe um padrão? Esse é o seu ICP real.",
    },
  },
  {
    id: "qualificacao",
    label: "Qualificação — a pergunta que falta",
    values: {
      eyebrow: "INSIGHT · QUALIFICAÇÃO",
      title: "A pergunta que você não faz está custando o seu mês",
      intro: "Vendedor que não qualifica entrega proposta para quem nunca ia comprar. E proposta sem qualificação é só desconto disfarçado de processo.",
      bullets: "Dor: o problema é real, mensurável e prioritário?\nOrçamento: existe verba destinada ou precisa ser aprovada?\nAutoridade: quem decide e quem influencia?\nTiming: qual o gatilho que faz isso virar prioridade?",
      body: "Quando os 4 blocos estão cobertos, a proposta vira formalidade. Quando não estão, a proposta vira torcida.",
      ctaLabel: "Ler artigo completo",
      ctaUrl: `${BLOG_BASE}/qualificacao-a-pergunta-que-voce-nao-faz`,
      closing: "Reveja sua próxima call com esses 4 blocos em mãos.",
    },
  },
  {
    id: "canais-cac",
    label: "Canais — gostar de CAC",
    values: {
      eyebrow: "INSIGHT · AQUISIÇÃO",
      title: "Pare de gostar de canal. Comece a gostar de CAC.",
      intro: "Escolher canal por moda é o caminho mais rápido para queimar caixa. O critério é frio: quanto custa adquirir, quanto retorna, em quanto tempo.",
      bullets: "CAC por canal: separe e meça individualmente.\nPayback: em quantos meses o cliente paga o custo de aquisição.\nLTV/CAC: relação saudável começa em 3x.\nConcentração: 1 canal forte > 5 canais médios.",
      body: "Operação enxuta dobra antes em um canal dominado do que em cinco canais mornos.",
      ctaLabel: "Ler artigo completo",
      ctaUrl: `${BLOG_BASE}/canais-de-aquisicao-gostar-de-cac`,
      closing: "Qual canal hoje paga o próprio CAC em menos de 6 meses?",
    },
  },
  {
    id: "gestao-carteira",
    label: "Gestão de carteira",
    values: {
      eyebrow: "INSIGHT · CARTEIRA",
      title: "O ouro está dentro de casa — e quase ninguém olha",
      intro: "A receita mais barata da sua empresa não está no novo lead. Está no cliente que já comprou, já confia e já tem histórico de pagamento.",
      bullets: "Segmente a base: A, B, C — por receita, margem e potencial.\nCrie rotina de contato proativa, não reativa.\nMapeie oportunidades de cross-sell e upsell por segmento.\nTrate churn como métrica diária, não trimestral.",
      body: "Reduzir 5% do churn impacta mais o EBITDA do que dobrar leads novos. Faça as contas.",
      ctaLabel: "Ler artigo completo",
      ctaUrl: `${BLOG_BASE}/gestao-de-carteira-o-ouro-dentro-de-casa`,
      closing: "Olhe sua carteira essa semana. Existe receita parada aí.",
    },
  },
  {
    id: "alta-performance",
    label: "Times de alta performance",
    values: {
      eyebrow: "INSIGHT · GESTÃO",
      title: "Times de alta performance não nascem motivados — são construídos com método",
      intro: "Motivação é resultado, não insumo. Time bom não é o que está animado na segunda — é o que entrega previsível na sexta.",
      bullets: "Processo claro: cada etapa com critério de avanço definido.\nCadência de gestão: 1:1 semanal, fórum semanal, ciclo mensal.\nMétrica de atividade + métrica de resultado, todo dia visível.",
      body: "Quando o método existe, motivação aparece sozinha. Quando não existe, nenhum bônus segura.",
      ctaLabel: "Ler artigo completo",
      ctaUrl: `${BLOG_BASE}/times-de-alta-performance-construidos-com-metodo`,
      closing: "Qual desses 3 pilares está mais fraco no seu time hoje?",
    },
  },
  {
    id: "caso-1milhao",
    label: "Case: R$ 1M em 2 meses",
    values: {
      eyebrow: "CASE · RESULTADO",
      title: "Como um processo comercial estruturado destravou R$ 1M em 2 meses",
      intro: "Não foi mágica e não foi sorte. Foi redesenho de processo, automações de ponta a ponta e alinhamento real com os representantes.",
      bullets: "Diagnóstico do funil: onde o lead morria e por quê.\nRedesenho do processo: etapas, critérios de avanço e SLA.\nAutomação: tirou do vendedor o que não era venda.\nAlinhamento: representantes na mesma régua, mesma linguagem.",
      body: "Em 2 meses, mais de R$ 1 milhão em contratos fechados. O ativo que sobra é o processo — replicável, mensurável, escalável.",
      ctaLabel: "Ler o case completo",
      ctaUrl: `${BLOG_BASE}/processo-comercial-r1-milhao-contratos-2-meses`,
      closing: "Se quiser olhar o seu funil com esse mesmo rigor, me responde.",
    },
  },
];

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
    defaultSubject: (d) => `Reunião agendada: ${d.meetingTitle || "[título]"}`,
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
  {
    key: "blog-insight",
    label: "Conteúdo / Insight do blog",
    description: "Envia um insight editorial baseado nos artigos do blog. Use um dos presets ou edite livremente.",
    defaultSubject: (d) => d.title || "Insight Comercial · Gabriel Vieira",
    presets: BLOG_PRESETS,
    fields: [
      { key: "eyebrow", label: "Categoria / Etiqueta", placeholder: "Ex.: INSIGHT · QUALIFICAÇÃO" },
      { key: "title", label: "Título", required: true, placeholder: "Título do e-mail" },
      { key: "intro", label: "Introdução", type: "textarea", required: true, placeholder: "Parágrafo de abertura" },
      { key: "bullets", label: "Pontos-chave (uma linha por bullet)", type: "textarea", placeholder: "Ponto 1\nPonto 2\nPonto 3" },
      { key: "body", label: "Parágrafo de fechamento (opcional)", type: "textarea" },
      { key: "ctaLabel", label: "Texto do botão (opcional)", placeholder: "Ex.: Ler artigo completo" },
      { key: "ctaUrl", label: "Link do botão (opcional)", placeholder: "https://gabrielconsultor.com/blog/..." },
      { key: "closing", label: "Linha de encerramento (opcional)", placeholder: "Ex.: Aplique e me conta o resultado." },
    ],
    buildData: (f, m) => ({
      fullName: m.full_name,
      eyebrow: f.eyebrow || undefined,
      title: f.title,
      intro: f.intro,
      bullets: f.bullets ? f.bullets.split("\n").map((s) => s.trim()).filter(Boolean) : undefined,
      body: f.body || undefined,
      ctaLabel: f.ctaLabel || undefined,
      ctaUrl: f.ctaUrl || undefined,
      closing: f.closing || undefined,
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
          {template.presets && template.presets.length > 0 && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Modelos prontos (clique para preencher)</label>
              <div className="flex flex-wrap gap-2">
                {template.presets.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setForm(p.values);
                      setCustomSubject("");
                    }}
                    className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-primary hover:bg-primary/5 transition"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}
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
