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
  if (data.channel) query = query.eq('channel',data.channel);
  if (data.sentiment) {
    query = query.eq('survey_type','nps');
    if (data.sentiment === 'promoter') query = query.gte('score',9);
    else if (data.sentiment === 'passive') query = query.gte('score',7).lte('score',8);
    else query = query.lte('score',6);
  }
  if (data.min !== undefined) query = query.gte('score',data.min);
  if (data.max !== undefined) query = query.lte('score',data.max);
  if (b.since) query = query.gte('created_at',b.since);
  if (b.until) query = query.lt('created_at',b.until);
  if (b.search) query = query.or(`contact_name.ilike.%${b.search}%,contact_email.ilike.%${b.search}%,comment.ilike.%${b.search}%`);
  const [rows, surveys] = await Promise.all([query.order('created_at',{ascending:false}).order('id').range(b.from,b.to),context.supabase.from('surveys').select('id,name').eq('org_id',org_id).order('name').limit(500)]);
  if (rows.error || surveys.error) throw new Error('Não foi possível carregar as respostas.');
  return { rows: rows.data ?? [], count: rows.count ?? 0, surveys: surveys.data ?? [] };
});

export const getResponseAnalytics = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).inputValidator((d) => filterSchema.parse(d)).handler(async ({ data, context }) => {
  const { org_id } = await currentOrganization(context.supabase, context.userId);
  const b = filterBounds(data);
  const records = [];
  for (let offset = 0; ; offset += 1000) {
    let query = context.supabase.from('responses')
      .select('survey_id,survey_type,score,channel,created_at,contact_name,contact_email,comment,surveys!inner(name,org_id)')
      .eq('org_id',org_id).eq('surveys.org_id',org_id);
    if (data.survey) query = query.eq('survey_id',data.survey);
    if (data.type) query = query.eq('survey_type',data.type);
    if (data.channel) query = query.eq('channel',data.channel);
    if (data.sentiment) {
      query = query.eq('survey_type','nps');
      if (data.sentiment === 'promoter') query = query.gte('score',9);
      else if (data.sentiment === 'passive') query = query.gte('score',7).lte('score',8);
      else query = query.lte('score',6);
    }
    if (data.min !== undefined) query = query.gte('score',data.min);
    if (data.max !== undefined) query = query.lte('score',data.max);
    if (b.since) query = query.gte('created_at',b.since);
    if (b.until) query = query.lt('created_at',b.until);
    if (b.search) query = query.or(`contact_name.ilike.%${b.search}%,contact_email.ilike.%${b.search}%,comment.ilike.%${b.search}%`);
    const { data: page, error } = await query.order('created_at',{ascending:false}).order('id').range(offset,offset+999);
    if (error) throw new Error('Não foi possível gerar os indicadores das respostas.');
    records.push(...(page ?? []));
    if (!page || page.length < 1000) break;
  }

  const byMonth = new Map<string, number>();
  const byChannel = new Map<string, number>();
  const bySurvey = new Map<string, { name: string; count: number }>();
  const nps = { promoters: 0, passives: 0, detractors: 0, total: 0 };
  for (const row of records) {
    const month = row.created_at.slice(0,7);
    byMonth.set(month,(byMonth.get(month) ?? 0)+1);
    const channel = row.channel || 'link';
    byChannel.set(channel,(byChannel.get(channel) ?? 0)+1);
    const surveyRelation = row.surveys;
    const surveyName = Array.isArray(surveyRelation) ? surveyRelation[0]?.name : surveyRelation?.name;
    const key = `${row.survey_id}:${surveyName ?? 'Pesquisa'}`;
    const item = bySurvey.get(key) ?? { name: surveyName ?? 'Pesquisa sem nome', count: 0 };
    item.count += 1;
    bySurvey.set(key,item);
    if (row.survey_type === 'nps') {
      nps.total += 1;
      if (row.score >= 9) nps.promoters += 1;
      else if (row.score >= 7) nps.passives += 1;
      else nps.detractors += 1;
    }
  }

  const monthLabel = (value: string) => new Date(`${value}-01T12:00:00`).toLocaleDateString('pt-BR',{month:'short',year:'2-digit'});
  const channelLabels: Record<string,string> = { whatsapp:'WhatsApp', sms:'SMS', email:'E-mail', link:'Link público' };
  const byMonthData = Array.from(byMonth,([month,count])=>({month:monthLabel(month),key:month,count})).sort((a,b)=>a.key.localeCompare(b.key));
  const byChannelData = Array.from(byChannel,([channel,count])=>({channel:channelLabels[channel] ?? channel,count})).sort((a,b)=>b.count-a.count);
  const bySurveyData = Array.from(bySurvey.values()).sort((a,b)=>b.count-a.count);
  const npsScore = nps.total ? Math.round(((nps.promoters-nps.detractors)/nps.total)*1000)/10 : null;
  return {
    total: records.length,
    byMonth: byMonthData,
    byChannel: byChannelData,
    bySurvey: bySurveyData,
    nps: { ...nps, score: npsScore },
  };
});
export const getCases = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).inputValidator((d) => filterSchema.parse(d)).handler(async ({ data, context }) => {
  const { org_id } = await currentOrganization(context.supabase, context.userId);
  const b = filterBounds(data);
  let query = context.supabase.from('cases').select('*,responses!inner(score,survey_type,contact_name,contact_email,comment,channel,org_id)',{count:'exact'}).eq('org_id',org_id).eq('responses.org_id',org_id);
  if (data.status) query = query.eq('status',data.status);
  const { data: rows,error,count } = await query.order('created_at',{ascending:false}).order('id').range(b.from,b.to);
  if (error) throw new Error('Não foi possível carregar as tratativas.');
  return { rows: rows ?? [], count: count ?? 0, aiAvailable: Boolean(process.env['OPENAI_API_KEY']) };
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
