import { createHash } from "node:crypto";
import { parsePublicSurveySlug } from "@/lib/public-survey-url";
import { audioExtensionForMime, MAX_AUDIO_FILE_BYTES, validateAudioMetadata } from "@/lib/audio-transcription";
import { getDecryptedAIProviderConfig, transcribeAudioWithProvider } from "@/lib/ai-provider.server";

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_REQUESTS = 5;
const MAX_MULTIPART_BYTES = MAX_AUDIO_FILE_BYTES + 1024 * 1024;
const attempts = new Map<string, { count: number; expiresAt: number }>();

function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, {
    status,
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}

function consumeRateLimit(request: Request, publicId: string): boolean {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const clientIp = forwarded
    || request.headers.get("cf-connecting-ip")?.trim()
    || request.headers.get("x-real-ip")?.trim()
    || "ip-unavailable";
  const key = createHash("sha256").update(`${publicId}:${clientIp}`).digest("hex");
  const now = Date.now();

  if (attempts.size > 4000) {
    for (const [storedKey, record] of attempts) {
      if (record.expiresAt <= now) attempts.delete(storedKey);
    }
  }

  const current = attempts.get(key);
  if (!current || current.expiresAt <= now) {
    attempts.set(key, { count: 1, expiresAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  if (current.count >= RATE_LIMIT_REQUESTS) return true;
  current.count += 1;
  return false;
}

/**
 * Transcribes an ephemeral public-survey recording. The file is never saved in
 * Supabase or object storage; only the returned transcript is added to the form.
 */
export async function transcribePublicSurveyAudio(request: Request, slug: string): Promise<Response> {
  const requestOrigin = request.headers.get("origin");
  if (requestOrigin) {
    try {
      if (new URL(requestOrigin).origin !== new URL(request.url).origin) {
        return jsonError("Solicitação inválida. Reabra o link original da pesquisa.", 403);
      }
    } catch {
      return jsonError("Origem da solicitação inválida.", 403);
    }
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_MULTIPART_BYTES) {
    return jsonError("O áudio ultrapassou o limite permitido de 8 MB. Grave um áudio mais curto.", 413);
  }
  if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("multipart/form-data")) {
    return jsonError("Envie uma gravação de áudio válida.", 415);
  }

  const parsed = parsePublicSurveySlug(slug);
  if (!parsed) return jsonError("Link de pesquisa inválido.", 400);

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: survey, error: surveyError } = await supabaseAdmin
    .from("surveys")
    .select("id,org_id")
    .eq("public_id", parsed.publicId)
    .eq("status", "active")
    .maybeSingle();

  if (surveyError) {
    console.error("[public-audio-transcription] Survey lookup failed", { code: surveyError.code });
    return jsonError("Não foi possível validar a pesquisa. Tente novamente.", 500);
  }
  if (!survey) return jsonError("Esta pesquisa não está ativa para receber áudio.", 404);

  const aiConfig = await getDecryptedAIProviderConfig(survey.org_id);
  if (!aiConfig) {
    return jsonError("A transcrição por áudio ainda não está configurada para esta organização. Digite seu comentário normalmente.", 503);
  }
  if (consumeRateLimit(request, parsed.publicId)) {
    return jsonError("Você atingiu o limite temporário de transcrições. Aguarde alguns minutos e tente novamente.", 429);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError("Não foi possível ler a gravação. Grave novamente e tente outra vez.", 400);
  }

  const value = form.get("audio");
  if (typeof File === "undefined" || !(value instanceof File)) {
    return jsonError("A gravação não foi recebida. Grave novamente e tente outra vez.", 400);
  }

  const metadataError = validateAudioMetadata(value);
  if (metadataError) return jsonError(metadataError, 413);
  const extension = audioExtensionForMime(value.type);
  if (!extension) return jsonError("Formato de áudio não suportado.", 415);

  let transcript: string;
  try {
    transcript = await transcribeAudioWithProvider(aiConfig, {
      bytes: await value.arrayBuffer(),
      mimeType: value.type,
      fileName: `comentario-cliente.${extension}`,
    });
  } catch (cause) {
    const message = cause instanceof Error
      ? cause.message
      : "Não foi possível transcrever o áudio. Grave novamente ou escreva seu comentário.";
    const status = message.includes("limite de uso") ? 429 : message.includes("configuração") ? 503 : 502;
    return jsonError(message, status);
  }

  const text = transcript.trim().slice(0, 6000);
  return Response.json({ text }, {
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}
