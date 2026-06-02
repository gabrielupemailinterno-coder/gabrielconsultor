export type FormType =
  | "contato"
  | "mentoria_1a1_vendedores"
  | "consultoria_operacional"
  | "mentoria_estrategica";

export type QuestionType = "single" | "multi";

export type Question = {
  id: string;
  label: string;
  type: QuestionType;
  options: string[];
};

export type FormSchema = {
  type: FormType;
  title: string;
  subtitle: string;
  questions: Question[];
  /** whether to ask company name on the contact step */
  askCompany: boolean;
};

export const FORM_LABELS: Record<FormType, string> = {
  contato: "Contato",
  mentoria_1a1_vendedores: "Mentoria 1:1 (Vendedores)",
  consultoria_operacional: "Consultoria Operacional",
  mentoria_estrategica: "Mentoria Estratégica",
};

export const FORM_SCHEMAS: Record<Exclude<FormType, "contato">, FormSchema> = {
  mentoria_1a1_vendedores: {
    type: "mentoria_1a1_vendedores",
    title: "Mentoria 1:1 — Vendedores",
    subtitle: "6 perguntas rápidas pra entender seu momento.",
    askCompany: false,
    questions: [
      {
        id: "papel",
        label: "Você atua hoje como?",
        type: "single",
        options: ["SDR / BDR", "Closer / Executivo", "Hunter", "Gerente comercial", "Outro"],
      },
      {
        id: "experiencia",
        label: "Tempo de experiência em vendas",
        type: "single",
        options: ["Menos de 1 ano", "1 a 3 anos", "3 a 5 anos", "5+ anos"],
      },
      {
        id: "ticket",
        label: "Ticket médio que você opera",
        type: "single",
        options: ["Até R$ 5 mil", "R$ 5 a 20 mil", "R$ 20 a 100 mil", "R$ 100 mil+"],
      },
      {
        id: "meta",
        label: "Quanto bate de meta hoje?",
        type: "single",
        options: ["Abaixo de 70%", "70% a 100%", "100% a 130%", "130%+"],
      },
      {
        id: "gargalo",
        label: "Maior gargalo hoje",
        type: "single",
        options: ["Prospecção", "Qualificação", "Negociação", "Fechamento", "Follow-up"],
      },
      {
        id: "investimento",
        label: "Investimento mensal disponível pra mentoria",
        type: "single",
        options: ["Até R$ 500", "R$ 500 a 1.500", "R$ 1.500 a 3.000", "R$ 3.000+"],
      },
    ],
  },
  consultoria_operacional: {
    type: "consultoria_operacional",
    title: "Consultoria Operacional",
    subtitle: "6 perguntas pra desenhar o diagnóstico certo.",
    askCompany: true,
    questions: [
      {
        id: "cargo",
        label: "Seu cargo",
        type: "single",
        options: ["CEO / Sócio", "Diretor", "Gerente", "Outro"],
      },
      {
        id: "faturamento",
        label: "Faturamento mensal da empresa",
        type: "single",
        options: ["Até R$ 100k", "R$ 100k a 500k", "R$ 500k a 2M", "R$ 2M+"],
      },
      {
        id: "time_comercial",
        label: "Tamanho do time comercial",
        type: "single",
        options: ["1 a 3", "4 a 10", "11 a 30", "30+"],
      },
      {
        id: "canais",
        label: "Canais de aquisição ativos (selecione todos)",
        type: "multi",
        options: ["Orgânico / SEO", "Mídia paga", "Outbound", "Indicação", "Eventos"],
      },
      {
        id: "dor",
        label: "Principal dor operacional",
        type: "single",
        options: [
          "CAC alto",
          "Conversão baixa",
          "Time sem processo",
          "Falta de previsibilidade",
          "Qualificação de leads",
        ],
      },
      {
        id: "horizonte",
        label: "Quando pretende começar?",
        type: "single",
        options: ["Imediato", "Em até 30 dias", "60 a 90 dias", "Explorando"],
      },
    ],
  },
  mentoria_estrategica: {
    type: "mentoria_estrategica",
    title: "Mentoria Estratégica",
    subtitle: "6 perguntas pra calibrar o programa.",
    askCompany: true,
    questions: [
      {
        id: "papel",
        label: "Seu papel",
        type: "single",
        options: ["Founder", "C-level", "Head de Marketing/Growth", "Outro"],
      },
      {
        id: "estagio",
        label: "Estágio da empresa",
        type: "single",
        options: ["Validando", "Early-stage", "Scale-up", "Consolidada"],
      },
      {
        id: "faturamento_anual",
        label: "Faturamento anual",
        type: "single",
        options: ["Até R$ 1M", "R$ 1M a 5M", "R$ 5M a 20M", "R$ 20M+"],
      },
      {
        id: "time_marketing",
        label: "Já tem time de marketing/growth?",
        type: "single",
        options: ["Sim, estruturado", "Em formação", "Não"],
      },
      {
        id: "decisao",
        label: "Maior decisão estratégica em aberto",
        type: "single",
        options: [
          "Canal a priorizar",
          "Posicionamento",
          "Estrutura de time",
          "Pricing",
          "Expansão",
        ],
      },
      {
        id: "horizonte",
        label: "Horizonte da mentoria",
        type: "single",
        options: ["3 meses", "6 meses", "12 meses"],
      },
    ],
  },
};
