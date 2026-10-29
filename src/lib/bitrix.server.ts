// Server-only Bitrix24 helpers (inbound webhook REST calls).
export function normalizeWebhook(url: string) {
  const u = new URL(url.trim());
  if (u.protocol !== "https:") throw new Error("O webhook precisa usar https");
  if (!/\/rest\/\d+\/[A-Za-z0-9]+\/?$/.test(u.pathname)) throw new Error("Formato esperado: https://seu.bitrix24.com.br/rest/ID/CODIGO/");
  return u.origin + u.pathname.replace(/\/?$/, "/");
}

export async function bitrixCall<T = unknown>(webhook: string, method: string, params: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(`${webhook}${method}.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const body = (await res.json().catch(() => ({}))) as { result?: T; error?: string; error_description?: string };
  if (!res.ok || body.error) {
    throw new Error(`Bitrix24 ${method} [${res.status}]: ${body.error_description || body.error || res.statusText}`);
  }
  return body.result as T;
}
