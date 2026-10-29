import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { currentOrganization } from "@/lib/organization.server";
import { aiProviderConfigSchema, testAIConfigSchema } from "@/lib/ai-provider-schema";
import {
  defaultModels,
  decryptProviderApiKey,
  encryptProviderApiKey,
  validateProviderCredentials,
} from "@/lib/ai-provider.server";

const safeProviderError = "Não foi possível salvar a configuração da IA. Confira a chave, os modelos e tente novamente.";

export const getAIProviderConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const membership = await currentOrganization(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("ai_provider_configs")
      .select("provider,analysis_model,transcription_model,last_validated_at,updated_at")
      .eq("org_id", membership.org_id)
      .maybeSingle();

    if (error) {
      console.error("[getAIProviderConfig] Read failed", { code: error.code });
      throw new Error("Não foi possível carregar a configuração de IA.");
    }

    const defaults = defaultModels(data?.provider === "gemini" ? "gemini" : "openai");
    return {
      role: membership.role,
      isConfigured: Boolean(data),
      provider: data?.provider ?? "openai",
      analysisModel: data?.analysis_model ?? defaults.analysisModel,
      transcriptionModel: data?.transcription_model ?? defaults.transcriptionModel,
      hasApiKey: Boolean(data),
      lastValidatedAt: data?.last_validated_at ?? null,
      updatedAt: data?.updated_at ?? null,
    };
  });

export const saveAIProviderConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => aiProviderConfigSchema.parse(input))
  .handler(async ({ data, context }) => {
    const membership = await currentOrganization(context.supabase, context.userId, true);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing, error: existingError } = await supabaseAdmin
      .from("ai_provider_configs")
      .select("*")
      .eq("org_id", membership.org_id)
      .maybeSingle();

    if (existingError) {
      console.error("[saveAIProviderConfig] Existing config lookup failed", { code: existingError.code });
      throw new Error(safeProviderError);
    }

    let apiKey = data.apiKey.trim();
    if (!apiKey && existing && existing.provider === data.provider) {
      apiKey = decryptProviderApiKey(existing);
    }
    if (!apiKey) throw new Error("Informe a chave de API do provedor selecionado.");

    const candidate = {
      provider: data.provider,
      apiKey,
      analysisModel: data.analysisModel.trim(),
      transcriptionModel: data.transcriptionModel.trim(),
    };
    const validation = await validateProviderCredentials(candidate);
    if (!validation.analysis || !validation.transcription) {
      throw new Error(validation.message);
    }

    const encrypted = encryptProviderApiKey(apiKey);
    const now = new Date().toISOString();
    const { data: saved, error: saveError } = await supabaseAdmin
      .from("ai_provider_configs")
      .upsert({
        org_id: membership.org_id,
        provider: data.provider,
        ...encrypted,
        analysis_model: candidate.analysisModel,
        transcription_model: candidate.transcriptionModel,
        last_validated_at: now,
        updated_at: now,
      }, { onConflict: "org_id" })
      .select("provider,analysis_model,transcription_model,last_validated_at,updated_at")
      .single();

    if (saveError || !saved) {
      console.error("[saveAIProviderConfig] Save failed", { code: saveError?.code });
      throw new Error(safeProviderError);
    }

    return {
      ok: true,
      message: validation.message,
      provider: saved.provider,
      analysisModel: saved.analysis_model,
      transcriptionModel: saved.transcription_model,
      lastValidatedAt: saved.last_validated_at,
      updatedAt: saved.updated_at,
      hasApiKey: true,
    };
  });

export const testAIProviderConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => testAIConfigSchema.parse(input))
  .handler(async ({ context }) => {
    const membership = await currentOrganization(context.supabase, context.userId, true);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("ai_provider_configs")
      .select("*")
      .eq("org_id", membership.org_id)
      .maybeSingle();

    if (error) throw new Error("Não foi possível carregar a configuração para o teste.");
    if (!row) throw new Error("Configure e salve primeiro uma conexão de IA.");

    const config = {
      provider: row.provider as "openai" | "gemini",
      apiKey: decryptProviderApiKey(row),
      analysisModel: row.analysis_model,
      transcriptionModel: row.transcription_model,
    };
    const validation = await validateProviderCredentials(config);
    if (validation.analysis && validation.transcription) {
      const { error: updateError } = await supabaseAdmin
        .from("ai_provider_configs")
        .update({ last_validated_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("org_id", membership.org_id);
      if (updateError) console.error("[testAIProviderConnection] Could not update validation timestamp", { code: updateError.code });
    }

    return {
      ...validation,
      provider: row.provider,
      analysisModel: row.analysis_model,
      transcriptionModel: row.transcription_model,
      lastValidatedAt: validation.analysis && validation.transcription ? new Date().toISOString() : row.last_validated_at,
    };
  });

export const disconnectAIProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => testAIConfigSchema.parse(input))
  .handler(async ({ context }) => {
    const membership = await currentOrganization(context.supabase, context.userId, true);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("ai_provider_configs")
      .delete()
      .eq("org_id", membership.org_id);
    if (error) {
      console.error("[disconnectAIProvider] Delete failed", { code: error.code });
      throw new Error("Não foi possível remover a conexão de IA.");
    }
    return { ok: true };
  });
