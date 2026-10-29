import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import type { AIProvider } from "@/lib/ai-provider-schema";

export interface EncryptedProviderSecret {
  api_key_ciphertext: string;
  api_key_iv: string;
  api_key_tag: string;
}

export interface StoredAIProviderConfig extends EncryptedProviderSecret {
  id: string;
  org_id: string;
  provider: AIProvider;
  analysis_model: string;
  transcription_model: string;
  last_validated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DecryptedAIProviderConfig {
  provider: AIProvider;
  apiKey: string;
  analysisModel: string;
  transcriptionModel: string;
}

export interface ProviderValidation {
  analysis: boolean;
  transcription: boolean;
  message: string;
}

function encryptionKey(): Buffer {
  const masterKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!masterKey) throw new Error("O segredo de criptografia do servidor não está disponível.");
  // Derive a purpose-specific encryption key from an existing server-only high-entropy secret.
  // Never return this value to the client or log it.
  return createHash("sha256")
    .update("reichcsat:ai-provider-config:v1\0", "utf8")
    .update(masterKey, "utf8")
    .digest();
}

export function encryptProviderApiKey(apiKey: string): EncryptedProviderSecret {
  const cleanKey = apiKey.trim();
  if (cleanKey.length < 12 || cleanKey.length > 500) {
    throw new Error("A chave de API parece inválida. Confira o valor informado.");
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(cleanKey, "utf8"), cipher.final()]);
  return {
    api_key_ciphertext: ciphertext.toString("base64"),
    api_key_iv: iv.toString("base64"),
    api_key_tag: cipher.getAuthTag().toString("base64"),
  };
}

export function decryptProviderApiKey(secret: EncryptedProviderSecret): string {
  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      encryptionKey(),
      Buffer.from(secret.api_key_iv, "base64"),
    );
    decipher.setAuthTag(Buffer.from(secret.api_key_tag, "base64"));
    return Buffer.concat([
      decipher.update(Buffer.from(secret.api_key_ciphertext, "base64")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw new Error("Não foi possível descriptografar a credencial de IA. Salve a chave novamente nas Integrações.");
  }
}

export function defaultModels(provider: AIProvider) {
  return provider === "openai"
    ? { analysisModel: "gpt-6-luna", transcriptionModel: "gpt-transcribe" }
    : { analysisModel: "gemini-3.8-flash", transcriptionModel: "gemini-3.8-flash" };
}

async function openAIModelAvailable(apiKey: string, model: string): Promise<boolean> {
  const response = await fetch(`https://api.openai.com/v1/models/${encodeURIComponent(model)}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(15000),
  });
  return response.ok;
}

async function geminiModelAvailable(apiKey: string, model: string): Promise<boolean> {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}`, {
    headers: { "x-goog-api-key": apiKey },
    signal: AbortSignal.timeout(15000),
  });
  return response.ok;
}

async function validateAnalysisCapability(
  provider: AIProvider,
  apiKey: string,
  model: string,
): Promise<boolean> {
  try {
    if (provider === "openai") {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          input: "Responda somente com a palavra OK.",
          max_output_tokens: 16,
          store: false,
        }),
        signal: AbortSignal.timeout(25000),
      });
      return response.ok;
    }
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Responda somente com a palavra OK." }] }],
          generationConfig: { maxOutputTokens: 16, responseMimeType: "text/plain" },
        }),
        signal: AbortSignal.timeout(25000),
      },
    );
    return response.ok;
  } catch {
    return false;
  }
}

export async function validateProviderCredentials(config: DecryptedAIProviderConfig): Promise<ProviderValidation> {
  let transcription = false;
  try {
    transcription = config.provider === "openai"
      ? await openAIModelAvailable(config.apiKey, config.transcriptionModel)
      : await geminiModelAvailable(config.apiKey, config.transcriptionModel);
  } catch {
    transcription = false;
  }
  const analysis = await validateAnalysisCapability(config.provider, config.apiKey, config.analysisModel);

  if (analysis && transcription) {
    return { analysis: true, transcription: true, message: "Conexão validada para análise de comentários e transcrição de áudio." };
  }
  if (!analysis && !transcription) {
    return {
      analysis: false,
      transcription: false,
      message: "Não foi possível validar a chave e os modelos. Confira a chave, o acesso à API e os identificadores dos modelos.",
    };
  }
  if (!analysis) {
    return {
      analysis: false,
      transcription: true,
      message: "O modelo de transcrição foi encontrado, mas a chamada de análise falhou. Confira o modelo de análise e as permissões.",
    };
  }
  return {
    analysis: true,
    transcription: false,
    message: "A análise respondeu, mas o modelo de transcrição não foi encontrado ou não está disponível para esta chave.",
  };
}

function providerFailureMessage(status: number): string {
  if (status === 401 || status === 403) return "A credencial foi recusada pelo provedor de IA. Confira a chave e suas permissões.";
  if (status === 429) return "O provedor de IA atingiu o limite de uso. Aguarde ou confira sua cota.";
  if (status === 413) return "O áudio é maior que o limite aceito pelo provedor.";
  return "O provedor de IA não conseguiu completar a solicitação. Confira a configuração e tente novamente.";
}

export async function transcribeAudioWithProvider(
  config: DecryptedAIProviderConfig,
  input: { bytes: ArrayBuffer; mimeType: string; fileName: string },
): Promise<string> {
  let response: Response;
  try {
    if (config.provider === "openai") {
      const form = new FormData();
      form.append("file", new Blob([input.bytes], { type: input.mimeType }), input.fileName);
      form.append("model", config.transcriptionModel);
      form.append("languages[]", "pt");
      form.append("prompt", "Português brasileiro. Comentário de cliente para uma pesquisa de satisfação. Transcreva fielmente o que foi dito, sem resumir ou inventar informações.");
      response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${config.apiKey}` },
        body: form,
        signal: AbortSignal.timeout(45000),
      });
    } else {
      const audioBase64 = Buffer.from(input.bytes).toString("base64");
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.transcriptionModel)}:generateContent`,
        {
          method: "POST",
          headers: { "x-goog-api-key": config.apiKey, "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: "Transcreva fielmente este áudio em português brasileiro. Retorne somente as palavras faladas, sem introdução, resumo, tradução ou comentários. Não invente palavras que não estejam audíveis." },
                { inlineData: { mimeType: input.mimeType, data: audioBase64 } },
              ],
            }],
            generationConfig: { responseMimeType: "text/plain", maxOutputTokens: 4096 },
          }),
          signal: AbortSignal.timeout(45000),
        },
      );
    }
  } catch {
    throw new Error("Não foi possível conectar ao provedor de transcrição. Tente novamente.");
  }

  if (!response.ok) {
    console.error("[ai-provider] Transcription request failed", { provider: config.provider, status: response.status });
    throw new Error(providerFailureMessage(response.status));
  }
  try {
    if (config.provider === "openai") {
      const payload = await response.json() as { text?: unknown };
      if (typeof payload.text === "string" && payload.text.trim()) return payload.text.trim();
    } else {
      const payload = await response.json() as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const text = payload.candidates?.[0]?.content?.parts?.map(part => part.text ?? "").join("").trim();
      if (text) return text;
    }
  } catch {
    // Fall through to the normalized error.
  }
  throw new Error("O provedor não retornou uma transcrição válida. Grave novamente ou escreva seu comentário.");
}

export async function generateStructuredAIResponse(
  config: DecryptedAIProviderConfig,
  input: { systemPrompt: string; userInput: unknown; jsonSchema: unknown; schemaName: string; maxOutputTokens: number },
): Promise<string> {
  let response: Response;
  try {
    if (config.provider === "openai") {
      response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: config.analysisModel,
          store: false,
          max_output_tokens: input.maxOutputTokens,
          input: [
            { role: "system", content: [{ type: "input_text", text: input.systemPrompt }] },
            { role: "user", content: [{ type: "input_text", text: JSON.stringify(input.userInput) }] },
          ],
          text: {
            format: {
              type: "json_schema",
              name: input.schemaName,
              strict: true,
              schema: input.jsonSchema,
            },
          },
        }),
        signal: AbortSignal.timeout(35000),
      });
    } else {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.analysisModel)}:generateContent`,
        {
          method: "POST",
          headers: { "x-goog-api-key": config.apiKey, "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `${input.systemPrompt}\n\nRetorne apenas JSON válido que obedeça a este esquema JSON:\n${JSON.stringify(input.jsonSchema)}\n\nDados para análise:\n${JSON.stringify(input.userInput)}`,
              }],
            }],
            generationConfig: { responseMimeType: "application/json", maxOutputTokens: input.maxOutputTokens },
          }),
          signal: AbortSignal.timeout(35000),
        },
      );
    }
  } catch {
    throw new Error("Não foi possível conectar ao provedor de IA. Tente novamente.");
  }
  if (!response.ok) {
    console.error("[ai-provider] Analysis request failed", { provider: config.provider, status: response.status });
    throw new Error(providerFailureMessage(response.status));
  }
  try {
    if (config.provider === "openai") {
      const payload = await response.json() as {
        output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
      };
      for (const item of payload.output ?? []) {
        if (item.type !== "message") continue;
        for (const part of item.content ?? []) {
          if (part.type === "output_text" && part.text) return part.text;
        }
      }
    } else {
      const payload = await response.json() as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const text = payload.candidates?.[0]?.content?.parts?.map(part => part.text ?? "").join("").trim();
      if (text) return text;
    }
  } catch {
    // Fall through to the normalized error.
  }
  throw new Error("O provedor não retornou um resultado válido. Tente novamente.");
}

export async function getDecryptedAIProviderConfig(orgId: string): Promise<DecryptedAIProviderConfig | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("ai_provider_configs")
    .select("*")
    .eq("org_id", orgId)
    .maybeSingle();
  if (error) {
    console.error("[ai-provider] Configuration lookup failed", { code: error.code });
    throw new Error("Não foi possível carregar a configuração da IA.");
  }
  if (!data) return null;
  const apiKey = decryptProviderApiKey(data);
  return {
    provider: data.provider as AIProvider,
    apiKey,
    analysisModel: data.analysis_model,
    transcriptionModel: data.transcription_model,
  };
}
