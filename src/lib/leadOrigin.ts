// Helper para padronizar a origem de leads em todos os formulários públicos.
// Retorna landing_page + product_interest + source_path + UTMs, prontos para insert.

export type LeadFormType =
  | "contato"
  | "whatsapp"
  | "mentoria_1a1_vendedores"
  | "consultoria_operacional"
  | "mentoria_estrategica";

export type LeadLandingPage =
  | "site_principal"
  | "mentoria_comercial"
  | "score_comercial"
  | "aci_del_rei"
  | "parceiros";

export type LeadProductInterest =
  | "contato_geral"
  | "mentoria_comercial"
  | "score_comercial"
  | "parceiros"
  | "consultoria_operacional"
  | "mentoria_estrategica";

export const LANDING_LABELS: Record<LeadLandingPage | "outros", string> = {
  site_principal: "Site principal",
  mentoria_comercial: "Mentoria Comercial",
  score_comercial: "Score Comercial",
  aci_del_rei: "ACI Del Rei",
  parceiros: "Parceiros",
  outros: "Outros",
};

export const PRODUCT_LABELS: Record<LeadProductInterest | "outros", string> = {
  contato_geral: "Contato geral",
  mentoria_comercial: "Mentoria Comercial",
  score_comercial: "Score Comercial",
  parceiros: "Parceiros/Afiliados",
  consultoria_operacional: "Consultoria Operacional",
  mentoria_estrategica: "Mentoria Estratégica",
  outros: "Outros",
};

export const LEAD_STATUS_LABELS: Record<string, string> = {
  new: "Novo",
  contacted: "Em contato",
  qualified: "Qualificado",
  converted: "Convertido",
  lost: "Perdido",
};

export function landingFromPath(path: string | null | undefined): LeadLandingPage {
  const p = (path || "/").toLowerCase();
  if (p.startsWith("/scoreapp") || p.includes("score")) return "score_comercial";
  if (p.startsWith("/mentoria")) return "mentoria_comercial";
  if (p.startsWith("/associadoacidel") || p.includes("aci")) return "aci_del_rei";
  if (p.startsWith("/parceiros") || p.startsWith("/parceria") || p.startsWith("/r/"))
    return "parceiros";
  return "site_principal";
}

export function productFromForm(
  formType: LeadFormType | string,
  landing: LeadLandingPage,
): LeadProductInterest {
  switch (formType) {
    case "mentoria_1a1_vendedores":
      return "mentoria_comercial";
    case "consultoria_operacional":
      return "consultoria_operacional";
    case "mentoria_estrategica":
      return "mentoria_estrategica";
    case "contato":
    case "whatsapp":
    default:
      // Para contato/whatsapp, herdar o produto quando a landing é específica
      if (landing === "score_comercial") return "score_comercial";
      if (landing === "mentoria_comercial") return "mentoria_comercial";
      if (landing === "parceiros") return "parceiros";
      return "contato_geral";
  }
}

export function buildLeadOrigin(formType: LeadFormType | string) {
  if (typeof window === "undefined") {
    return {
      landing_page: "site_principal" as const,
      product_interest: productFromForm(formType, "site_principal"),
      source_path: "/",
      utm_source: null as string | null,
      utm_medium: null as string | null,
      utm_campaign: null as string | null,
    };
  }
  const path = window.location.pathname;
  const params = new URLSearchParams(window.location.search);
  const landing = landingFromPath(path);
  return {
    landing_page: landing,
    product_interest: productFromForm(formType, landing),
    source_path: path,
    utm_source: params.get("utm_source") || null,
    utm_medium: params.get("utm_medium") || null,
    utm_campaign: params.get("utm_campaign") || null,
  };
}
