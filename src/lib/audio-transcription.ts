export const MAX_AUDIO_RECORDING_SECONDS = 60;
export const MAX_AUDIO_FILE_BYTES = 8 * 1024 * 1024;

const audioExtensions: Record<string, string> = {
  "audio/webm": "webm",
  "audio/mp4": "mp4",
  "audio/m4a": "m4a",
  "audio/x-m4a": "m4a",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
  "audio/wave": "wav",
  "audio/x-wav": "wav",
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/flac": "flac",
};

export function normalizeAudioMimeType(mimeType: string): string {
  return mimeType.split(";")[0]?.trim().toLowerCase() ?? "";
}

export function audioExtensionForMime(mimeType: string): string | null {
  return audioExtensions[normalizeAudioMimeType(mimeType)] ?? null;
}

export function validateAudioMetadata(file: { size: number; type: string }): string | null {
  if (!Number.isFinite(file.size) || file.size <= 0) return "A gravação está vazia. Grave novamente.";
  if (file.size > MAX_AUDIO_FILE_BYTES) return "O áudio passou de 8 MB. Faça uma gravação mais curta e tente novamente.";
  if (!audioExtensionForMime(file.type)) return "Este formato de áudio não é compatível. Grave novamente no navegador ou escolha um arquivo MP3, M4A, WAV, OGG ou WebM.";
  return null;
}

export function formatAudioDuration(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remaining = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
}
