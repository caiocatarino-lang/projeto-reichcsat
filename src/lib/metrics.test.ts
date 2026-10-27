import { describe, expect, it } from "vitest";
import { classifyNps, computeCsat, computeNps } from "./metrics";

describe("NPS", () => {
  it("classifica 0-6 detrator, 7-8 neutro, 9-10 promotor", () => {
    expect(classifyNps(6)).toBe("detractor");
    expect(classifyNps(7)).toBe("passive");
    expect(classifyNps(8)).toBe("passive");
    expect(classifyNps(9)).toBe("promoter");
  });
  it("NPS = %promotores − %detratores", () => {
    // 5 promotores, 3 neutros, 2 detratores → 50% − 20% = 30
    expect(computeNps([10, 10, 9, 9, 9, 8, 7, 7, 3, 0]).nps).toBe(30);
  });
  it("sem respostas retorna null", () => {
    expect(computeNps([]).nps).toBeNull();
  });
});

describe("CSAT", () => {
  it("escala 1-5 com satisfeito = 4 e 5", () => {
    // 3 satisfeitos de 4 → 75
    expect(computeCsat([5, 4, 4, 2], 5, 4).csat).toBe(75);
  });
  it("limite configurável", () => {
    expect(computeCsat([5, 4, 4, 2], 5, 5).csat).toBe(25);
  });
});
