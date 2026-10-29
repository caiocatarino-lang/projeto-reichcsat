import { z } from "zod";

export const publicSurveyTokenSchema = z.string().min(1).max(64);
export const publicSurveyChannelSchema = z.enum(["link", "whatsapp", "sms", "email"]);
export type PublicSurveyChannel = z.infer<typeof publicSurveyChannelSchema>;

export const publicResponseSchema = z.object({
  token: publicSurveyTokenSchema,
  score: z.number().int().min(0).max(10),
  comment: z.string().trim().max(2000).optional(),
  name: z.string().trim().max(120).optional(),
  email: z.string().trim().email().max(200).optional().or(z.literal("")),
  channel: publicSurveyChannelSchema.default("link"),
});

export function isAllowedPublicScore(type: "nps" | "csat", score: number, csatScale: number): boolean {
  if (!Number.isInteger(score)) return false;
  if (type === "nps") return score >= 0 && score <= 10;
  return score >= 1 && score <= csatScale;
}
