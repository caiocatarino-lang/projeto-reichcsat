import { describe, expect, it } from "vitest";
import { aiProviderConfigSchema, aiProviderSchema, testAIConfigSchema } from "./ai-provider-schema";

describe("AI provider integration settings", () => {
  it("supports the supported server-side providers", () => {
    expect(aiProviderSchema.safeParse("openai").success).toBe(true);
    expect(aiProviderSchema.safeParse("gemini").success).toBe(true);
    expect(aiProviderSchema.safeParse("arbitrary-url-provider").success).toBe(false);
  });

  it("validates provider model names and optional replacement key", () => {
    expect(aiProviderConfigSchema.safeParse({
      provider: "openai",
      apiKey: "",
      analysisModel: "gpt-6-luna",
      transcriptionModel: "gpt-transcribe",
    }).success).toBe(true);
    expect(aiProviderConfigSchema.safeParse({
      provider: "gemini",
      apiKey: "test-api-key",
      analysisModel: "gemini-3.8-flash",
      transcriptionModel: "gemini-3.8-flash",
    }).success).toBe(true);
    expect(aiProviderConfigSchema.safeParse({
      provider: "openai",
      analysisModel: "",
      transcriptionModel: "gpt-transcribe",
    }).success).toBe(false);
  });

  it("accepts only an empty input for testing the already-saved connection", () => {
    expect(testAIConfigSchema.safeParse({}).success).toBe(true);
    expect(testAIConfigSchema.safeParse({ apiKey: "secret" }).success).toBe(false);
  });
});
