import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { currentOrganization, verifyWrite } from './organization.server';
import { normalizeWebhook } from './bitrix-security';

export const getBitrix = createServerFn({method:'GET'}).middleware([requireSupabaseAuth]).handler(async ({context})=>{
  const m=await currentOrganization(context.supabase,context.userId);
  const [integration,events]=await Promise.all([context.supabase.from('integrations').select('id,status,portal,create_tasks,post_timeline,last_sync_at,updated_at').eq('org_id',m.org_id).eq('provider','bitrix24').maybeSingle(),context.supabase.from('sync_events').select('id,action,ok,created_at').eq('org_id',m.org_id).eq('provider','bitrix24').order('created_at',{ascending:false}).limit(30)]);
  if(integration.error || events.error) throw new Error('Não foi possível carregar a integração.');
  let state=integration.data?.status === 'error' ? 'error' : 'disconnected';
  if(integration.data && integration.data.status !== 'disconnected' && m.role === 'admin') {
    const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
    const secret=await supabaseAdmin.from('integration_secrets').select('webhook_url').eq('integration_id',integration.data.id).maybeSingle();
    if(secret.error) throw new Error('Não foi possível verificar a configuração.');
    try { if(!secret.data) state='incomplete'; else {normalizeWebhook(secret.data.webhook_url);state=integration.data.status === 'connected' ? 'connected' : 'error';} } catch {state='incomplete';}
  } else if(integration.data?.status === 'connected') state='connected';
  return {integration:integration.data,events:events.data ?? [],role:m.role,state};
});
export const connectBitrix=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((d)=>z.object({webhook:z.string().max(500).transform(normalizeWebhook)}).parse(d)).handler(async ({data,context})=>{
  const m=await currentOrganization(context.supabase,context.userId,true);
  const {bitrixCall}=await import('./bitrix.server');
  const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
  // Persist non-connected state first; no failed attempt can leave a stale connected flag.
  const result=await supabaseAdmin.from('integrations').upsert({org_id:m.org_id,provider:'bitrix24',portal:new URL(data.webhook).hostname,status:'error',last_error:null,updated_at:new Date().toISOString()},{onConflict:'org_id,provider'}).select('id').single();
  verifyWrite(result.error,result.data); if(!result.data) throw new Error('Não foi possível salvar a integração.');
  const id=result.data.id;
  let validated=false;
  try {await bitrixCall(data.webhook,'crm.lead.fields');await bitrixCall(data.webhook,'crm.deal.fields');validated=true;} catch {validated=false;}
  const event=await supabaseAdmin.from('sync_events').insert({org_id:m.org_id,provider:'bitrix24',action:'validar conexão',ok:validated}).select('id').single();verifyWrite(event.error,event.data);
  if(!validated) throw new Error('Conexão não validada. Verifique o portal e as permissões CRM.');
  const secret=await supabaseAdmin.from('integration_secrets').upsert({integration_id:id,webhook_url:data.webhook}).select('integration_id').single();verifyWrite(secret.error,secret.data);
  const update=await supabaseAdmin.from('integrations').update({status:'connected',updated_at:new Date().toISOString()}).eq('id',id).eq('org_id',m.org_id).select('id').single();verifyWrite(update.error,update.data);
  return {ok:true};
});
export const testBitrixEntity=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((d)=>z.object({type:z.enum(['lead','deal']),id:z.string().regex(/^[1-9]\d{0,11}$/)}).parse(d)).handler(async ({data,context})=>{
  const m=await currentOrganization(context.supabase,context.userId,true);
  const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
  const {bitrixCall}=await import('./bitrix.server');
  const integration=await supabaseAdmin.from('integrations').select('id,status').eq('org_id',m.org_id).eq('provider','bitrix24').single();verifyWrite(integration.error,integration.data);
  if(!integration.data || integration.data.status!=='connected') throw new Error('Bitrix24 não conectado.');
  const secret=await supabaseAdmin.from('integration_secrets').select('webhook_url').eq('integration_id',integration.data.id).single();verifyWrite(secret.error,secret.data);
  if(!secret.data) throw new Error('Configuração incompleta.');
  let entity:Record<string,string>|null=null;
  try {entity=await bitrixCall<Record<string,string>>(secret.data.webhook_url,`crm.${data.type}.get`,{id:data.id});} catch {entity=null;}
  const event=await supabaseAdmin.from('sync_events').insert({org_id:m.org_id,provider:'bitrix24',action:`teste crm.${data.type}.get`,ok:!!entity}).select('id').single();verifyWrite(event.error,event.data);
  const update=await supabaseAdmin.from('integrations').update({last_sync_at:entity ? new Date().toISOString() : null,last_error:entity ? null : 'Teste CRM falhou.'}).eq('id',integration.data.id).eq('org_id',m.org_id).select('id').single();verifyWrite(update.error,update.data);
  if(!entity) throw new Error('Teste CRM falhou. Verifique o ID e as permissões.');
  return {title:entity['TITLE'] || [entity['NAME'],entity['LAST_NAME']].filter(Boolean).join(' '),assigned:entity['ASSIGNED_BY_ID'] ?? null,stage:entity['STAGE_ID'] || entity['STATUS_ID'] || null};
});
export const updateBitrixOptions=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((d)=>z.object({create_tasks:z.boolean(),post_timeline:z.boolean()}).parse(d)).handler(async ({data,context})=>{
  const m=await currentOrganization(context.supabase,context.userId,true);
  const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
  const result=await supabaseAdmin.from('integrations').update(data).eq('org_id',m.org_id).eq('provider','bitrix24').eq('status','connected').select('id').single();verifyWrite(result.error,result.data);return {ok:true};
});
export const disconnectBitrix=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).handler(async ({context})=>{
  const m=await currentOrganization(context.supabase,context.userId,true);
  const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
  const integration=await supabaseAdmin.from('integrations').select('id').eq('org_id',m.org_id).eq('provider','bitrix24').single();verifyWrite(integration.error,integration.data);
  if(!integration.data) throw new Error('Integração não encontrada.');
  const update=await supabaseAdmin.from('integrations').update({status:'disconnected',last_error:null,updated_at:new Date().toISOString()}).eq('id',integration.data.id).eq('org_id',m.org_id).select('id').single();verifyWrite(update.error,update.data);
  const deleted=await supabaseAdmin.from('integration_secrets').delete().eq('integration_id',integration.data.id);if(deleted.error) throw new Error('Conexão desativada, mas não foi possível remover a credencial. Tente novamente.');
  const event=await supabaseAdmin.from('sync_events').insert({org_id:m.org_id,provider:'bitrix24',action:'desconectar',ok:true}).select('id').single();verifyWrite(event.error,event.data);return {ok:true};
});
