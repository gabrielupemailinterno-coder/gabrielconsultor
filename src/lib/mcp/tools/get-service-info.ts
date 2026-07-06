import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

const SERVICES = {
  mentoria: {
    name: "Mentoria Profissional para Corretores de Seguros",
    duration: "8 a 12 semanas",
    price_brl_monthly: 457.9,
    description:
      "Mentoria estruturada para corretores de seguros que querem escalar produção com processo, prospecção ativa e uso de sistemas.",
    url: "https://gabrielconsultor.com/mentoria-profissional",
  },
  consultoria: {
    name: "Consultoria Executiva",
    duration: "4 semanas",
    description:
      "Diagnóstico e implementação de processos comerciais e operacionais em corretoras e times de vendas.",
    url: "https://gabrielconsultor.com/",
  },
  parceiros: {
    name: "Programa de Parceiros",
    description:
      "Estrutura de parceria com a UP: treinamento, acompanhamento especializado, produtos de qualidade, tablet para apresentações, eventos de ativação de carteira, campanhas de tráfego direcionadas e estratégia comercial.",
    url: "https://gabrielconsultor.com/parceiros",
  },
} as const;

export default defineTool({
  name: "get_service_info",
  title: "Get service info",
  description:
    "Return details about Gabriel Consultor services: mentoria, consultoria, or programa de parceiros.",
  inputSchema: {
    service: z
      .enum(["mentoria", "consultoria", "parceiros"])
      .describe("Which service to describe."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ service }) => {
    const info = SERVICES[service];
    return {
      content: [{ type: "text", text: JSON.stringify(info) }],
      structuredContent: info,
    };
  },
});
