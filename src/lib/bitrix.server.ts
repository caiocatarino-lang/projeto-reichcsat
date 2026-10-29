import { normalizeWebhook, bitrixMethods } from './bitrix-security';
export { normalizeWebhook } from './bitrix-security';
export async function bitrixCall<T = unknown>(webhook: string, method: string, params: Record<string, unknown> = {}): Promise<T> {
  const base = normalizeWebhook(webhook); // Revalidate stored credentials on every call.
  if (!bitrixMethods.includes(method)) throw new Error('Método Bitrix24 não permitido.');
  let res: Response;
  try { res = await fetch(`${base}${method}.json`, {method:'POST',redirect:'error',signal:AbortSignal.timeout(15000),headers:{'Content-Type':'application/json'},body:JSON.stringify(params)}); }
  catch { throw new Error('Não foi possível acessar o Bitrix24. Verifique o portal e as permissões.'); }
  const body = await res.json().catch(()=>null) as {result?:T;error?:string} | null;
  // Never return provider error descriptions: they may echo a token or URL.
  if (!res.ok || !body || body.error || body.result === undefined) throw new Error('O Bitrix24 recusou a operação. Verifique as permissões do webhook.');
  return body.result;
}
