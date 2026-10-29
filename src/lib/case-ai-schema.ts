import { z } from "zod";

export const caseAiBriefingSchema = z.object({
  summary: z.string().min(1).max(500),
  main_issue: z.string().min(1).max(300),
  customer_need: z.string().min(1).max(300),
  sentiment: z.enum(["frustrated", "angry", "disappointed", "confused", "neutral", "unclear"]),
  urgency: z.enum(["low", "medium", "high"]),
  approach: z.enum(["empathetic", "objective", "technical", "proactive"]),
  suggested_opening: z.string().min(1).max(500),
  recommended_actions: z.array(z.string().min(1).max(240)).min(2).max(4),
  avoid: z.array(z.string().min(1).max(240)).min(1).max(3),
  evidence_quote: z.string().max(300),
  confidence: z.enum(["high", "medium", "low"]),
});
export type CaseAiBriefing = z.infer<typeof caseAiBriefingSchema>;

export const caseAiGenerateSchema = z.object({ caseId: z.string().uuid() });
