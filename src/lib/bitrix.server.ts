// Server-only Bitrix24 helpers. Do not expose webhook URLs to the browser.
const BITRIX24_CLOUD_HOST = /^(?:[a-z0-9-]+\.)*bitrix24\.(?:com(?:\.(?:br|tr|mx|au|ar|co|cl|pe|ve|za))?|ru|de|fr|es|it|pl|ua|kz|by|eu|cn|jp|in|tr|vn|id|my|th|tw|sg|mx|co|ar|cl|pe|ve|za)$/i;

export function normalizeWebhook(url: string) {
  const u = new URL(url.trim());
  if (u.protocol !== "https:") throw new Error("O webhook precisa usar HTTPS");
  if (!BITRIX24_CLOUD_HOST.test(u.hostname)) {
    throw new Error("Use o domínio oficial do Bitrix24 Cloud para conectar o portal.");
  }
  if (u.username || u.password || u.port) throw new Error("O webhook não pode conter credenciais na URL nem uma porta personalizada.");
  if (!/^\/rest\/\d+\/[A-Za-z0-9]+\/?$/.test(u.pathname)) {
    throw new Error("Formato esperado: https://seuportal.bitrix24.com.br/rest/ID/CODIGO/");
  }
  if (u.search || u.hash) throw new Error("Remova parâmetros adicionais da URL do webhook.");
  return u.origin + u.pathname.replace(/\/?$/, "/");
}

export async function bitrixCall<T = unknown>(webhook: string, method: string, params: Record<string, unknown> = {}): Promise<T> {
  // Re-validate on every call in case a legacy or corrupted secret exists in storage.
  const safeWebhook = normalizeWebhook(webhook);
  const res = await fetch(`${safeWebhook}${method}.json`, {
    method: "POST",
    redirect: "error",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const body = (await res.json().catch(() => ({}))) as { result?: T; error?: string; error_description?: string };
  if (!res.ok || body.error) {
    throw new Error(`Bitrix24 ${method} [${res.status}]: ${body.error_description || body.error || res.statusText}`);
  }
  return body.result as T;
}
