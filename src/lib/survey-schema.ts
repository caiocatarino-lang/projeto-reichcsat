import { z } from "zod";

export const deliveryChannelsSchema = z.object({
  whatsapp: z.object({
    enabled: z.boolean(),
    message: z.string().max(500, "A mensagem de WhatsApp deve ter até 500 caracteres."),
  }),
  sms: z.object({
    enabled: z.boolean(),
    message: z.string().max(320, "A mensagem de SMS deve ter até 320 caracteres."),
  }),
  email: z.object({
    enabled: z.boolean(),
    subject: z.string().max(180, "O assunto deve ter até 180 caracteres."),
    message: z.string().max(3000, "A mensagem de e-mail deve ter até 3.000 caracteres."),
  }),
}).superRefine((channels, ctx) => {
  if (channels.whatsapp.enabled && !channels.whatsapp.message.trim()) {
    ctx.addIssue({ code: "custom", path: ["whatsapp", "message"], message: "Informe a mensagem de WhatsApp." });
  }
  if (channels.sms.enabled && !channels.sms.message.trim()) {
    ctx.addIssue({ code: "custom", path: ["sms", "message"], message: "Informe a mensagem de SMS." });
  }
  if (channels.email.enabled && !channels.email.subject.trim()) {
    ctx.addIssue({ code: "custom", path: ["email", "subject"], message: "Informe o assunto do e-mail." });
  }
  if (channels.email.enabled && !channels.email.message.trim()) {
    ctx.addIssue({ code: "custom", path: ["email", "message"], message: "Informe o texto do e-mail." });
  }
});

export type DeliveryChannels = z.infer<typeof deliveryChannelsSchema>;

export const defaultDeliveryChannels: DeliveryChannels = {
  whatsapp: {
    enabled: false,
    message: "Olá, {{nome}}! Queremos saber como foi sua experiência com nosso atendimento. Pode avaliar por este link? {{link_pesquisa}} Obrigado!",
  },
  sms: {
    enabled: false,
    message: "{{empresa}}: avalie seu atendimento: {{link_pesquisa}}",
  },
  email: {
    enabled: false,
    subject: "Como foi sua experiência com a {{empresa}}?",
    message: "Olá, {{nome}}!\n\nA sua opinião é muito importante para nós. Queremos entender como foi sua experiência com nosso atendimento e identificar oportunidades de melhoria.\n\nReserve alguns instantes para responder à pesquisa pelo link abaixo:\n{{link_pesquisa}}\n\nAgradecemos pela sua confiança e participação.\n\nAtenciosamente,\nEquipe {{empresa}}",
  },
};

export function parseDeliveryChannels(value: unknown): DeliveryChannels {
  const parsed = deliveryChannelsSchema.safeParse(value);
  if (parsed.success) return parsed.data;
  return {
    whatsapp: { ...defaultDeliveryChannels.whatsapp },
    sms: { ...defaultDeliveryChannels.sms },
    email: { ...defaultDeliveryChannels.email },
  };
}

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
  delivery_channels: deliveryChannelsSchema.default(defaultDeliveryChannels),
}).refine((s) => s.csat_threshold <= s.csat_scale, {
  message: "O limite de satisfação deve ser menor ou igual à escala.", path: ["csat_threshold"],
});
export type SurveyInput = z.infer<typeof surveySchema>;
export const canManageSurveys = (role: string) => role === "admin" || role === "manager";
export const surveyStatusLabel = { draft: "Rascunho", active: "Ativa", archived: "Arquivada" };
export const newSurvey: SurveyInput = {
  type: "nps", name: "", question: "De 0 a 10, quanto você recomendaria nossa empresa?",
  comment_prompt: "Conte-nos o motivo da sua nota", thank_you: "Obrigado pela sua resposta!",
  service_type: "", csat_scale: 5, csat_threshold: 4, delivery_channels: parseDeliveryChannels(defaultDeliveryChannels),
};
