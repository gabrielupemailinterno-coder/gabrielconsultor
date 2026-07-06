export type ScoreProfile = {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  profession: string | null;
  experience_level: string | null;
  lead_origin: string | null;
  segment: string | null;
  accepted_terms_at: string | null;
  plan: "free" | "mensal" | "semestral";
  plan_started_at: string | null;
  plan_expires_at: string | null;
  last_seen_at: string | null;
  created_at: string;
};

export type ScoreGoals = {
  id: string;
  user_id: string;
  meta_mensal_valor: number;
  ticket_medio: number;
  meta_vendas: number;
  ligacoes_dia: number;
  whatsapps_dia: number;
  apresentacoes_semana: number;
  propostas_semana: number;
  segmento: string | null;
  effective_from: string;
};

export type DailyLog = {
  id: string;
  user_id: string;
  date: string;
  ligacoes: number;
  whatsapps: number;
  prospeccoes: number;
  contatos_efetivos: number;
  reunioes_agendadas: number;
  apresentacoes: number;
  propostas: number;
  vendas: number;
  valor_vendido: number;
  observacoes: string | null;
};

export type ContentModule = {
  id: string;
  categoria: string;
  slug: string;
  titulo: string;
  descricao: string | null;
  video_url: string | null;
  material_url: string | null;
  sort_order: number;
  published: boolean;
};
