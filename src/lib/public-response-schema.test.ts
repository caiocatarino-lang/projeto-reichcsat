import { describe, expect, it } from "vitest";
import { isValidSurveyScore, publicResponseSchema } from "./public-response-schema";

describe("public response validation", () => {
  const validPayload = { token: "0123456789abcdef01234567", score: 10 };

  it("accepts NPS boundary scores from 0 through 10", () => {
    expect(isValidSurveyScore("nps", 0, 5)).toBe(true);
    expect(isValidSurveyScore("nps", 10, 5)).toBe(true);
    expect(isValidSurveyScore("nps", -1, 5)).toBe(false);
    expect(isValidSurveyScore("nps", 11, 5)).toBe(false);
  });

  it("accepts CSAT scores only within the configured 5- or 10-point scale", () => {
    expect(isValidSurveyScore("csat", 1, 5)).toBe(true);
    expect(isValidSurveyScore("csat", 5, 5)).toBe(true);
    expect(isValidSurveyScore("csat", 0, 5)).toBe(false);
    expect(isValidSurveyScore("csat", 6, 5)).toBe(false);
    expect(isValidSurveyScore("csat", 10, 10)).toBe(true);
    expect(isValidSurveyScore("csat", 3, 3)).toBe(false);
    expect(isValidSurveyScore("csat", 2.5, 5)).toBe(false);
  });

  it("rejects caller-supplied CRM entity IDs and channel overrides", () => {
    const result = publicResponseSchema.safeParse({
      ...validPayload,
      entityType: "deal",
      entityId: "123",
      channel: "whatsapp",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid public response payload", () => {
    expect(publicResponseSchema.safeParse({
      token: validPayload.token,
      score: 9,
      name: "Cliente",
      email: "cliente@example.com",
      comment: "Bom atendimento",
    }).success).toBe(true);
  });
});
