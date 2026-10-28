import { z } from "zod";

export const publicResponseSchema = z.object({
  token: z.string().min(8).max(64),
  score: z.number().int().min(0).max(10),
  comment: z.string().trim().max(2000).optional(),
  name: z.string().trim().max(120).optional(),
  email: z.string().email().max(200).optional().or(z.literal("")),
}).strict();

export type PublicResponseInput = z.infer<typeof publicResponseSchema>;

export function isValidSurveyScore(
  type: "nps" | "csat",
  score: number,
  csatScale: number,
): boolean {
  if (!Number.isInteger(score)) return false;
  if (type === "nps") return score >= 0 && score <= 10;
  if (csatScale !== 5 && csatScale !== 10) return false;
  return score >= 1 && score <= csatScale;
}
