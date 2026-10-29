import { describe, expect, it } from "vitest";
import { makePublicSurveyPath, parsePublicSurveySlug, slugifySurveyName } from "./public-survey-url";

const publicId = "a1b2c3d4e5f60718";

describe("branded public survey URL", () => {
  it("turns survey names into readable URL slugs", () => {
    expect(slugifySurveyName("Pesquisa de Satisfação — Clientes")).toBe("pesquisa-de-satisfacao-clientes");
  });

  it("builds a named path with no query string", () => {
    const path = makePublicSurveyPath("Pesquisa de Satisfação", publicId);
    expect(path).toBe(`/pesquisa/pesquisa-de-satisfacao-${publicId}`);
    expect(path).not.toContain("?");
  });

  it.each(["whatsapp", "sms", "email"] as const)("encodes %s in the path instead of a query parameter", (channel) => {
    const path = makePublicSurveyPath("Pós atendimento", publicId, channel);
    expect(path).toBe(`/pesquisa/pos-atendimento-${publicId}-${channel}`);
    expect(path).not.toContain("?");
    expect(parsePublicSurveySlug(path.split("/").at(-1) ?? "")).toEqual({ publicId, channel });
  });

  it("returns the default channel when no suffix is present", () => {
    expect(parsePublicSurveySlug(`pesquisa-${publicId}`)).toEqual({ publicId, channel: "link" });
  });

  it("rejects malformed or incomplete identifiers", () => {
    expect(parsePublicSurveySlug("pesquisa-sem-identificador")).toBeNull();
    expect(() => makePublicSurveyPath("Pesquisa", "id-invalido")).toThrow("Identificador público inválido");
  });
});
