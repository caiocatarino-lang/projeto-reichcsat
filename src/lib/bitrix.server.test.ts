import { describe, expect, it } from "vitest";
import { normalizeWebhook } from "./bitrix.server";

describe("Bitrix24 webhook validation", () => {
  it("normalizes a valid Bitrix24 Cloud webhook", () => {
    expect(normalizeWebhook("https://br24.bitrix24.com.br/rest/42/AbC123/"))
      .toBe("https://br24.bitrix24.com.br/rest/42/AbC123/");
    expect(normalizeWebhook("https://portal.bitrix24.com/rest/7/abc123"))
      .toBe("https://portal.bitrix24.com/rest/7/abc123/");
  });

  it("rejects HTTP and non-Bitrix hosts", () => {
    expect(() => normalizeWebhook("http://br24.bitrix24.com.br/rest/42/AbC123/")).toThrow(/HTTPS/);
    expect(() => normalizeWebhook("https://example.com/rest/42/AbC123/")).toThrow(/domínio oficial/);
  });

  it("rejects embedded credentials, nonstandard ports and extra URL parameters", () => {
    expect(() => normalizeWebhook("https://user:pass@br24.bitrix24.com.br/rest/42/AbC123/")).toThrow();
    expect(() => normalizeWebhook("https://br24.bitrix24.com.br:8443/rest/42/AbC123/")).toThrow(/porta/);
    expect(() => normalizeWebhook("https://br24.bitrix24.com.br/rest/42/AbC123/?redirect=example.com")).toThrow(/parâmetros/);
  });

  it("rejects malformed webhook paths", () => {
    expect(() => normalizeWebhook("https://br24.bitrix24.com.br/rest/not-an-id/token/")).toThrow(/Formato esperado/);
  });
});
