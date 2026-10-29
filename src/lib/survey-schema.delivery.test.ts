import { describe, expect, it } from "vitest";
import { defaultDeliveryChannels, surveySchema, deliveryChannelsSchema, parseDeliveryChannels } from "./survey-schema";

const baseSurvey = {
  type: "nps" as const,
  name: "Pesquisa de satisfação",
  question: "Você recomendaria nosso atendimento?",
  comment_prompt: "Conte-nos mais",
  thank_you: "Obrigado pela resposta",
  service_type: "Suporte",
  csat_scale: 5 as const,
  csat_threshold: 4,
};

describe("configuração de canais de envio", () => {
  it("fornece modelos curtos e longos por canal, desativados por padrão", () => {
    expect(defaultDeliveryChannels.whatsapp.enabled).toBe(false);
    expect(defaultDeliveryChannels.sms.enabled).toBe(false);
    expect(defaultDeliveryChannels.email.enabled).toBe(false);
    expect(defaultDeliveryChannels.email.subject).toContain("{{empresa}}");
    expect(defaultDeliveryChannels.whatsapp.message).toContain("{{link_pesquisa}}");
    expect(defaultDeliveryChannels.sms.message.length).toBeLessThan(defaultDeliveryChannels.email.message.length);
  });

  it("mantém a criação de pesquisa compatível quando o campo de canais não é informado", () => {
    expect(surveySchema.parse(baseSurvey).delivery_channels).toEqual(defaultDeliveryChannels);
  });

  it("exige texto nos canais que estiverem habilitados", () => {
    const parsed = deliveryChannelsSchema.safeParse({
      whatsapp: { enabled: true, message: "  " },
      sms: { enabled: false, message: "" },
      email: { enabled: false, subject: "", message: "" },
    });
    expect(parsed.success).toBe(false);
  });

  it("usa os modelos padrão para configurações antigas ausentes ou inválidas", () => {
    expect(parseDeliveryChannels(null)).toEqual(defaultDeliveryChannels);
    expect(parseDeliveryChannels({})).toEqual(defaultDeliveryChannels);
  });

  it("limita o tamanho das mensagens de SMS", () => {
    const parsed = deliveryChannelsSchema.safeParse({
      whatsapp: defaultDeliveryChannels.whatsapp,
      sms: { enabled: false, message: "x".repeat(321) },
      email: defaultDeliveryChannels.email,
    });
    expect(parsed.success).toBe(false);
  });
});
