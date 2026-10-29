export type PublicSurveyChannel = "link" | "whatsapp" | "sms" | "email";

const TOKEN_PATTERN = "[a-f0-9]{24}";

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

/**
 * The readable title and opaque public token share one path segment.
 * Channel variants use a trailing path suffix, never a query string.
 */
export function makePublicSurveyPath(
  name: string,
  token: string,
  channel: PublicSurveyChannel = "link",
): string {
  if (!new RegExp(`^${TOKEN_PATTERN}$`).test(token)) {
    throw new Error("Token público inválido.");
  }

  const base = `${slugifySurveyName(name)}-${token}`;
  return `/pesquisa/${base}${channel === "link" ? "" : `-${channel}`}`;
}

export function parsePublicSurveySlug(value: string): {
  token: string;
  channel: PublicSurveyChannel;
} | null {
  const match = new RegExp(`^.+-(${TOKEN_PATTERN})(?:-(whatsapp|sms|email))?$`).exec(value);
  if (!match) return null;

  return {
    token: match[1],
    channel: (match[2] as PublicSurveyChannel | undefined) ?? "link",
  };
}
