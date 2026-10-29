import { z } from "zod";

export const aiProviderSchema = z.enum(["openai", "gemini"]);
export type AIProvider = z.infer<typeof aiProviderSchema>;

export const aiProviderConfigSchema = z.object({
  provider: aiProviderSchema,
  apiKey: z.string().trim().max(500).optional().default(""),
  analysisModel: z.string().trim().min(1).max(100),
  transcriptionModel: z.string().trim().min(1).max(100),
});

export const testAIConfigSchema = z.object({}).strict();
