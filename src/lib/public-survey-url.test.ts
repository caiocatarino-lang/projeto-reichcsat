import { describe, expect, it } from "vitest";
import { makePublicSurveyPath, parsePublicSurveySlug, slugifySurveyName } from "./public-survey-url";

const token = "a1b2c3d4e5f60718293a4b5c";

describe("branded public survey URL", () => {
  it("turns survey names into readable URL slugs", () => {
    expect(slugifySurveyName("Pesquisa de Satisfação — Clientes")).toBe("pesquisa-de-satisfacao-clientes");
  });

  it("builds a named path with no query string", () => {
    const path = makePublicSurveyPath("Pesquisa de Satisfação", token);
    expect(path).toBe(`/pesquisa/pesquisa-de-satisfacao-${token}`);
    expect(path).not.toContain("?");
  });

  it.each(["whatsapp", "sms", "email"] as const)("encodes %s in the path instead of a query parameter", (channel) => {
    const path = makePublicSurveyPath("Pós atendimento", token, channel);
    expect(path).toBe(`/pesquisa/pos-atendimento-${token}-${channel}`);
    expect(path).not.toContain("?");
    expect(parsePublicSurveySlug(path.split("/").at(-1) ?? "")).toEqual({ token, channel });
  });

  it("returns the default channel when no suffix is present", () => {
    expect(parsePublicSurveySlug(`pesquisa-${token}`)).toEqual({ token, channel: "link" });
  });

  it("rejects malformed or incomplete identifiers", () => {
    expect(parsePublicSurveySlug("pesquisa-sem-token")).toBeNull();
    expect(() => makePublicSurveyPath("Pesquisa", "token-invalido")).toThrow("Token público inválido");
  });
});
