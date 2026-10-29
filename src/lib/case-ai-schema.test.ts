import { describe, expect, it } from "vitest";
import { caseAiBriefingSchema } from "./case-ai-schema";

const briefing = {
  summary: "O cliente relata demora na solução.",
  main_issue: "Prazo de atendimento.",
  customer_need: "Previsão clara e resolução.",
  sentiment: "frustrated",
  urgency: "medium",
  approach: "empathetic",
  suggested_opening: "Entendo a frustração com a demora e vou verificar o que falta para resolver.",
  recommended_actions: ["Confirmar o protocolo e o contexto.", "Apurar o responsável e o prazo.", "Retornar com uma atualização objetiva."],
  avoid: ["Prometer prazo sem validar com a equipe."],
  evidence_quote: "Estou esperando há dias.",
  confidence: "high",
};

describe("case AI briefing schema", () => {
  it("accepts a valid, actionable customer recovery briefing", () => {
    expect(caseAiBriefingSchema.safeParse(briefing).success).toBe(true);
  });
  it("rejects unsupported tone and urgency labels", () => {
    expect(caseAiBriefingSchema.safeParse({...briefing, sentiment:"personality"}).success).toBe(false);
    expect(caseAiBriefingSchema.safeParse({...briefing, urgency:"critical"}).success).toBe(false);
  });
  it("requires at least two recommended actions", () => {
    expect(caseAiBriefingSchema.safeParse({...briefing, recommended_actions:["Retornar ao cliente."]}).success).toBe(false);
  });
});
