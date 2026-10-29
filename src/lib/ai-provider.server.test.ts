import { afterEach, describe, expect, it } from "vitest";
import {
  defaultModels,
  decryptProviderApiKey,
  encryptProviderApiKey,
} from "./ai-provider.server";

const originalMaster = process.env["SUPABASE_SERVICE_ROLE_KEY"];

afterEach(() => {
  if (originalMaster === undefined) delete process.env["SUPABASE_SERVICE_ROLE_KEY"];
  else process.env["SUPABASE_SERVICE_ROLE_KEY"] = originalMaster;
});

describe("AI provider credentials", () => {
  it("encrypts credentials so they are not stored in plaintext", () => {
    process.env["SUPABASE_SERVICE_ROLE_KEY"] = "test-server-only-master-key-with-strong-entropy";
    const encrypted = encryptProviderApiKey("sk-test-provider-key-123456");
    expect(encrypted.api_key_ciphertext).not.toContain("sk-test-provider-key-123456");
    expect(decryptProviderApiKey(encrypted)).toBe("sk-test-provider-key-123456");
  });

  it("uses randomized encryption metadata for the same plaintext", () => {
    process.env["SUPABASE_SERVICE_ROLE_KEY"] = "test-server-only-master-key-with-strong-entropy";
    const first = encryptProviderApiKey("sk-test-provider-key-123456");
    const second = encryptProviderApiKey("sk-test-provider-key-123456");
    expect(first.api_key_ciphertext).not.toBe(second.api_key_ciphertext);
    expect(first.api_key_iv).not.toBe(second.api_key_iv);
  });

  it("rejects a credential encrypted with a different server key", () => {
    process.env["SUPABASE_SERVICE_ROLE_KEY"] = "test-server-only-master-key-with-strong-entropy";
    const encrypted = encryptProviderApiKey("sk-test-provider-key-123456");
    process.env["SUPABASE_SERVICE_ROLE_KEY"] = "another-server-only-master-key-with-entropy";
    expect(() => decryptProviderApiKey(encrypted)).toThrow("Não foi possível descriptografar");
  });

  it("selects current defaults for OpenAI and Gemini", () => {
    expect(defaultModels("openai")).toEqual({ analysisModel: "gpt-6-luna", transcriptionModel: "gpt-transcribe" });
    expect(defaultModels("gemini")).toEqual({ analysisModel: "gemini-3.8-flash", transcriptionModel: "gemini-3.8-flash" });
  });
});
