export type Aula = {
  slug: string;
  title: string;
  duration: string;
  kind: "video" | "leitura" | "workshop";
  locked?: boolean;
};

export type Modulo = {
  slug: string;
  category: string;
  title: string;
  description: string;
  aulas: Aula[];
  locked?: boolean;
};

export const CATEGORIES = [
  "Fundamentos Comerciais",
  "Prospecção",
  "Qualificação",
  "Follow-up",
  "Negociação",
  "CRM e Rotina",
  "Gestão Comercial",
  "Liderança Comercial",
] as const;

export const MODULOS: Modulo[] = [
  {
    slug: "fundamentos-do-vendedor-de-alta-performance",
    category: "Fundamentos Comerciais",
    title: "Fundamentos do vendedor de alta performance",
    description: "Postura, mentalidade, disciplina e método de trabalho por trás de resultados consistentes.",
    aulas: [
      { slug: "abertura", title: "Abertura do módulo", duration: "6 min", kind: "video" },
      { slug: "mentalidade", title: "Mentalidade e disciplina", duration: "22 min", kind: "video" },
      { slug: "rotina-diaria", title: "Rotina diária do top performer", duration: "18 min", kind: "video" },
      { slug: "leitura-base", title: "Leitura-base: SPIN Selling", duration: "45 min", kind: "leitura" },
    ],
  },
  {
    slug: "prospeccao-outbound-b2b",
    category: "Prospecção",
    title: "Prospecção outbound B2B",
    description: "Como montar uma máquina de prospecção previsível: ICP, cadências e volume qualificado.",
    aulas: [
      { slug: "icp", title: "Definindo seu ICP", duration: "14 min", kind: "video" },
      { slug: "cadencias", title: "Cadências multicanal", duration: "26 min", kind: "video" },
      { slug: "cold-call", title: "Cold call sem medo", duration: "31 min", kind: "video" },
      { slug: "workshop", title: "Workshop: monte sua cadência", duration: "60 min", kind: "workshop" },
    ],
  },
  {
    slug: "qualificacao-spin-e-bant",
    category: "Qualificação",
    title: "Qualificação: SPIN e BANT aplicados",
    description: "Frameworks para separar curioso de comprador em minutos.",
    aulas: [
      { slug: "spin", title: "SPIN na prática", duration: "24 min", kind: "video" },
      { slug: "bant", title: "BANT sem burocracia", duration: "17 min", kind: "video" },
      { slug: "scripts", title: "Scripts prontos", duration: "12 min", kind: "leitura" },
    ],
  },
  {
    slug: "follow-up-que-fecha",
    category: "Follow-up",
    title: "Follow-up que fecha",
    description: "A diferença entre insistir e ser útil. Cadências pós-reunião que não queimam relacionamento.",
    aulas: [
      { slug: "regras", title: "As 5 regras do follow-up eficaz", duration: "15 min", kind: "video" },
      { slug: "modelos", title: "Modelos de mensagem", duration: "20 min", kind: "leitura" },
    ],
    locked: true,
  },
  {
    slug: "negociacao-por-valor",
    category: "Negociação",
    title: "Negociação por valor",
    description: "Como sustentar preço, defender proposta e conduzir concessões estratégicas.",
    aulas: [
      { slug: "ancoragem", title: "Ancoragem e enquadramento", duration: "22 min", kind: "video" },
      { slug: "objecoes", title: "Objeções: 12 respostas afiadas", duration: "34 min", kind: "video" },
      { slug: "fechamento", title: "Fechamento consultivo", duration: "19 min", kind: "video" },
    ],
    locked: true,
  },
  {
    slug: "crm-e-rotina-comercial",
    category: "CRM e Rotina",
    title: "CRM e rotina comercial",
    description: "Como usar o CRM como painel de comando e não como boletim burocrático.",
    aulas: [
      { slug: "setup", title: "Setup mínimo eficiente", duration: "18 min", kind: "video" },
      { slug: "ritual", title: "Ritual semanal do vendedor", duration: "16 min", kind: "video" },
    ],
    locked: true,
  },
  {
    slug: "gestao-comercial-fundamentos",
    category: "Gestão Comercial",
    title: "Gestão comercial: fundamentos",
    description: "Meta, funil, previsão e ritmo de gestão para líderes que estão começando.",
    aulas: [
      { slug: "metas", title: "Metas realistas e ambiciosas", duration: "21 min", kind: "video" },
      { slug: "previsao", title: "Previsão de vendas confiável", duration: "28 min", kind: "video" },
    ],
    locked: true,
  },
  {
    slug: "lideranca-comercial",
    category: "Liderança Comercial",
    title: "Liderança comercial",
    description: "Como cobrar, desenvolver e reter time comercial de alto desempenho.",
    aulas: [
      { slug: "1x1", title: "1:1 que gera evolução", duration: "23 min", kind: "video" },
      { slug: "coaching", title: "Coaching de call na prática", duration: "36 min", kind: "workshop" },
    ],
    locked: true,
  },
];

export function moduloBySlug(slug: string) {
  return MODULOS.find((m) => m.slug === slug);
}

export function aulaBySlug(moduloSlug: string, aulaSlug: string) {
  const m = moduloBySlug(moduloSlug);
  if (!m) return null;
  const idx = m.aulas.findIndex((a) => a.slug === aulaSlug);
  if (idx < 0) return null;
  return {
    modulo: m,
    aula: m.aulas[idx],
    prev: idx > 0 ? m.aulas[idx - 1] : null,
    next: idx < m.aulas.length - 1 ? m.aulas[idx + 1] : null,
  };
}
