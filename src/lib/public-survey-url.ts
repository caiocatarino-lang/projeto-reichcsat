export type PublicSurveyChannel = "link" | "whatsapp" | "sms" | "email";

const PUBLIC_ID_PATTERN = "[a-f0-9]{16}";

export function slugifySurveyName(name: string): string {
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64)
    .replace(/-+$/g, "");

  return slug || "pesquisa";
}

/** Human-readable path + public ID, with no query-string parameters. */
export function makePublicSurveyPath(
  name: string,
  publicId: string,
  channel: PublicSurveyChannel = "link",
): string {
  if (!new RegExp(`^${PUBLIC_ID_PATTERN}$`).test(publicId)) {
    throw new Error("Identificador público inválido.");
  }
  const base = `${slugifySurveyName(name)}-${publicId}`;
  return `/pesquisa/${base}${channel === "link" ? "" : `-${channel}`}`;
}

export function parsePublicSurveySlug(value: string): {
  publicId: string;
  channel: PublicSurveyChannel;
} | null {
  const match = new RegExp(`^.+-(${PUBLIC_ID_PATTERN})(?:-(whatsapp|sms|email))?$`).exec(value);
  if (!match || !match[1]) return null;
  return {
    publicId: match[1],
    channel: (match[2] as PublicSurveyChannel | undefined) ?? "link",
  };
}
