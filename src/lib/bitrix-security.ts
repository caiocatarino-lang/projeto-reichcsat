// Deliberately limited to these Bitrix24 Cloud regions; self-hosted portals are unsupported.
const cloudDomains = ['bitrix24.com','bitrix24.com.br','bitrix24.eu','bitrix24.de','bitrix24.es','bitrix24.fr','bitrix24.it','bitrix24.pl','bitrix24.in','bitrix24.uk','bitrix24.ru'];
export function normalizeWebhook(value: string) {
  let url: URL;
  try { url = new URL(value.trim()); } catch { throw new Error('Webhook inválido.'); }
  const official = cloudDomains.some((domain) => url.hostname.endsWith(`.${domain}`) && /^[a-z0-9][a-z0-9-]*$/.test(url.hostname.slice(0,-domain.length-1)));
  if (url.protocol !== 'https:' || url.port || url.username || url.password || url.search || url.hash || !official || !/^\/rest\/[1-9]\d*\/[A-Za-z0-9]+\/?$/.test(url.pathname)) {
    throw new Error('Use um webhook HTTPS de um portal oficial Bitrix24 Cloud, sem parâmetros extras.');
  }
  return url.origin + url.pathname.replace(/\/?$/, '/');
}
export const bitrixMethods = ['crm.lead.fields','crm.deal.fields','crm.lead.get','crm.deal.get','user.get','crm.timeline.comment.add','tasks.task.add'];
