import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { caseSchema, filterBounds, filterSchema, memberSchema, organizationSchema, profileSchema } from './operations-schema';
import { currentOrganization, verifyWrite } from './organization.server';

export const getResponses = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).inputValidator((d) => filterSchema.parse(d)).handler(async ({ data, context }) => {
  const { org_id } = await currentOrganization(context.supabase, context.userId);
  const b = filterBounds(data);
  let query = context.supabase.from('responses').select('*,surveys!inner(name,org_id)', { count: 'exact' }).eq('org_id',org_id).eq('surveys.org_id',org_id);
  if (data.survey) query = query.eq('survey_id',data.survey);
  if (data.type) query = query.eq('survey_type',data.type);
  if (data.min !== undefined) query = query.gte('score',data.min);
  if (data.max !== undefined) query = query.lte('score',data.max);
  if (b.since) query = query.gte('created_at',b.since);
  if (b.search) query = query.or(`contact_name.ilike.%${b.search}%,contact_email.ilike.%${b.search}%,comment.ilike.%${b.search}%`);
  const [rows, surveys] = await Promise.all([query.order('created_at',{ascending:false}).order('id').range(b.from,b.to),context.supabase.from('surveys').select('id,name').eq('org_id',org_id).order('name').limit(500)]);
  if (rows.error || surveys.error) throw new Error('Não foi possível carregar as respostas.');
  return { rows: rows.data ?? [], count: rows.count ?? 0, surveys: surveys.data ?? [] };
});
export const getCases = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).inputValidator((d) => filterSchema.parse(d)).handler(async ({ data, context }) => {
  const { org_id } = await currentOrganization(context.supabase, context.userId);
  const b = filterBounds(data);
  let query = context.supabase.from('cases').select('*,responses!inner(score,survey_type,contact_name,contact_email,comment,channel,org_id)',{count:'exact'}).eq('org_id',org_id).eq('responses.org_id',org_id);
  if (data.status) query = query.eq('status',data.status);
  const { data: rows,error,count } = await query.order('created_at',{ascending:false}).order('id').range(b.from,b.to);
  if (error) throw new Error('Não foi possível carregar as tratativas.');
  return { rows: rows ?? [], count: count ?? 0 };
});
export const saveCase = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((d) => caseSchema.parse(d)).handler(async ({data,context}) => {
  const {org_id} = await currentOrganization(context.supabase,context.userId);
  const {id,...fields} = data;
  const result = await context.supabase.from('cases').update({...fields,assignee:fields.assignee || null,notes:fields.notes || null,updated_at:new Date().toISOString()}).eq('id',id).eq('org_id',org_id).select('id').single();
  verifyWrite(result.error,result.data); return result.data;
});
export const getSettings = createServerFn({method:'GET'}).middleware([requireSupabaseAuth]).handler(async ({context}) => {
  const m = await currentOrganization(context.supabase,context.userId);
  const [org,members,user] = await Promise.all([context.supabase.from('organizations').select('id,name').eq('id',m.org_id).single(),context.supabase.from('memberships').select('id,user_id,role,email,created_at').eq('org_id',m.org_id).order('created_at').limit(500),context.supabase.auth.getUser()]);
  if (org.error || members.error || user.error || !user.data.user) throw new Error('Não foi possível carregar as configurações.');
  return {organization:org.data,members:members.data ?? [],role:m.role,userId:context.userId,email:user.data.user.email ?? '',name:typeof user.data.user.user_metadata['full_name'] === 'string' ? user.data.user.user_metadata['full_name'] : ''};
});
export const saveOrganization = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((d)=>organizationSchema.parse(d)).handler(async ({data,context})=>{
  const m=await currentOrganization(context.supabase,context.userId,true);
  const result=await context.supabase.from('organizations').update(data).eq('id',m.org_id).select('id').single();verifyWrite(result.error,result.data);return result.data;
});
export const saveProfile = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((d)=>profileSchema.parse(d)).handler(async ({data,context})=>{
  const result=await context.supabase.auth.updateUser({data:{full_name:data.name}});verifyWrite(result.error,result.data.user);return {ok:true};
});
export const saveMember = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((d)=>memberSchema.parse(d)).handler(async ({data,context})=>{
  const m=await currentOrganization(context.supabase,context.userId,true);
  const target=await context.supabase.from('memberships').select('user_id').eq('id',data.id).eq('org_id',m.org_id).single();
  verifyWrite(target.error,target.data);
  if(target.data?.user_id===context.userId) throw new Error('Você não pode alterar seu próprio papel.');
  const result=await context.supabase.from('memberships').update({role:data.role}).eq('id',data.id).eq('org_id',m.org_id).select('id').single();verifyWrite(result.error,result.data);return result.data;
});
