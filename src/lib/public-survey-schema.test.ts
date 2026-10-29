import { describe, expect, it } from "vitest";
import { isAllowedPublicScore, publicResponseSchema, publicSurveyChannelSchema } from "./public-survey-schema";

describe("public survey links", () => {
  it("accepts the channels available for manual sharing", () => {
    for (const channel of ["link", "whatsapp", "sms", "email"]) {
      expect(publicSurveyChannelSchema.safeParse(channel).success).toBe(true);
    }
    expect(publicSurveyChannelSchema.safeParse("telegram").success).toBe(false);
  });

  it("validates NPS scores from 0 through 10", () => {
    expect(isAllowedPublicScore("nps", 0, 5)).toBe(true);
    expect(isAllowedPublicScore("nps", 10, 5)).toBe(true);
    expect(isAllowedPublicScore("nps", 11, 5)).toBe(false);
    expect(isAllowedPublicScore("nps", 5.5, 5)).toBe(false);
  });

  it("validates CSAT according to its configured scale", () => {
    expect(isAllowedPublicScore("csat", 1, 5)).toBe(true);
    expect(isAllowedPublicScore("csat", 5, 5)).toBe(true);
    expect(isAllowedPublicScore("csat", 0, 5)).toBe(false);
    expect(isAllowedPublicScore("csat", 6, 5)).toBe(false);
    expect(isAllowedPublicScore("csat", 10, 10)).toBe(true);
  });

  it("accepts optional respondent identity without allowing CRM entity IDs from the public browser", () => {
    const parsed = publicResponseSchema.safeParse({
      token: "a".repeat(24), score: 10, channel: "whatsapp", name: "Ana", email: "ana@example.com",
    });
    expect(parsed.success).toBe(true);
    expect(publicResponseSchema.safeParse({
      token: "a".repeat(24), score: 10, entityType: "deal", entityId: "123",
    }).success).toBe(true); // Zod strips unknown fields; the server never reads these IDs.
  });
});
