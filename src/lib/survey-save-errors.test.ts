import { describe, expect, it } from "vitest";
import { surveySaveErrorMessage } from "./survey-save-errors";

describe("surveySaveErrorMessage", () => {
  it("explains a permissions failure without exposing database details", () => {
    expect(surveySaveErrorMessage("42501")).toContain("Sem permissão");
  });

  it("explains required-column and foreign-key failures", () => {
    expect(surveySaveErrorMessage("23502")).toContain("campo obrigatório");
    expect(surveySaveErrorMessage("23503")).toContain("organização ou o usuário");
  });

  it("explains uniqueness and check constraint failures", () => {
    expect(surveySaveErrorMessage("23505")).toContain("identificador duplicado");
    expect(surveySaveErrorMessage("23514")).toContain("não é compatível");
  });

  it("explains a stale PostgREST schema cache", () => {
    expect(surveySaveErrorMessage("PGRST204")).toContain("estrutura de dados");
  });

  it("does not leak unknown database errors", () => {
    const message = surveySaveErrorMessage("unknown");
    expect(message).toContain("falha foi registrada");
    expect(message).not.toContain("SQL");
  });
});
