import { z } from "zod";

export const surveySchema = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(["nps", "csat"]),
  name: z.string().trim().min(1, "Informe o nome").max(160),
  question: z.string().trim().min(1, "Informe a pergunta").max(500),
  comment_prompt: z.string().trim().min(1).max(500),
  thank_you: z.string().trim().min(1).max(500),
  service_type: z.string().trim().max(120),
  csat_scale: z.union([z.literal(5), z.literal(10)]),
  csat_threshold: z.number().int().min(1).max(10),
}).refine((s) => s.csat_threshold <= s.csat_scale, {
  message: "O limite de satisfação deve ser menor ou igual à escala.", path: ["csat_threshold"],
});
export type SurveyInput = z.infer<typeof surveySchema>;
export const canManageSurveys = (role: string) => role === "admin" || role === "manager";
export const surveyStatusLabel = { draft: "Rascunho", active: "Ativa", archived: "Arquivada" };
export const newSurvey: SurveyInput = {
  type: "nps", name: "", question: "De 0 a 10, quanto você recomendaria nossa empresa?",
  comment_prompt: "Conte-nos o motivo da sua nota", thank_you: "Obrigado pela sua resposta!",
  service_type: "", csat_scale: 5, csat_threshold: 4,
};