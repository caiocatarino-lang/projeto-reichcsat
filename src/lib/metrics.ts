/** NPS: % promotores (9-10) − % detratores (0-6). Base: todas as respostas NPS válidas. */
export type NpsResult = { nps: number | null; promoters: number; passives: number; detractors: number; total: number };

export function classifyNps(score: number): "promoter" | "passive" | "detractor" {
  if (score >= 9) return "promoter";
  if (score >= 7) return "passive";
  return "detractor";
}

export function computeNps(scores: number[]): NpsResult {
  const valid = scores.filter((s) => Number.isInteger(s) && s >= 0 && s <= 10);
  let promoters = 0, passives = 0, detractors = 0;
  for (const s of valid) {
    const c = classifyNps(s);
    if (c === "promoter") promoters++;
    else if (c === "passive") passives++;
    else detractors++;
  }
  const total = valid.length;
  const nps = total ? Math.round(((promoters - detractors) / total) * 1000) / 10 : null;
  return { nps, promoters, passives, detractors, total };
}

/** CSAT: respostas satisfeitas (nota >= limite) ÷ respostas válidas × 100. */
export type CsatResult = { csat: number | null; satisfied: number; total: number };

export function computeCsat(scores: number[], scale = 5, threshold = 4): CsatResult {
  const valid = scores.filter((s) => Number.isInteger(s) && s >= 1 && s <= scale);
  const satisfied = valid.filter((s) => s >= threshold).length;
  const total = valid.length;
  return { csat: total ? Math.round((satisfied / total) * 1000) / 10 : null, satisfied, total };
}
