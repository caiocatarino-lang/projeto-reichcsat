import { z } from 'zod';
export const isAdmin = (role: string) => role === 'admin';
export const caseSchema = z.object({ id: z.string().uuid(), status: z.enum(['open','in_progress','resolved']), assignee: z.string().trim().max(120), notes: z.string().trim().max(5000) });
export const organizationSchema = z.object({ name: z.string().trim().min(1,'Informe o nome').max(160) });
export const profileSchema = z.object({ name: z.string().trim().max(120) });
export const memberSchema = z.object({ id: z.string().uuid(), role: z.enum(['admin','manager','agent']) });
export const filterSchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).catch(1),
  survey: z.string().uuid().optional().catch(undefined),
  type: z.enum(['nps','csat']).optional().catch(undefined),
  channel: z.enum(['whatsapp','sms','email','link']).optional().catch(undefined),
  sentiment: z.enum(['promoter','passive','detractor']).optional().catch(undefined),
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional().catch(undefined),
  min: z.coerce.number().int().min(0).max(10).optional().catch(undefined),
  max: z.coerce.number().int().min(0).max(10).optional().catch(undefined),
  period: z.enum(['7','30','90','all']).catch('30'),
  q: z.string().trim().max(100).catch(''),
  status: z.enum(['open','in_progress','resolved']).optional().catch(undefined),
});
export type ResponseFilters = z.infer<typeof filterSchema>;
export const pageSize = 25;
export function filterBounds(f: ResponseFilters, now = new Date()) {
  if (f.min !== undefined && f.max !== undefined && f.min > f.max) throw new Error('A nota mínima deve ser menor ou igual à máxima.');
  let since: string | null = null;
  let until: string | null = null;
  if (f.month) {
    const [year, month] = f.month.split('-').map(Number);
    since = new Date(Date.UTC(year, month - 1, 1)).toISOString();
    until = new Date(Date.UTC(year, month, 1)).toISOString();
  } else if (f.period !== 'all') {
    since = new Date(now.getTime() - Number(f.period) * 86400000).toISOString();
  }
  return {
    from: (f.page - 1) * pageSize,
    to: f.page * pageSize - 1,
    since,
    until,
    search: f.q.replace(/[^\p{L}\p{N}\s@._-]/gu, '').trim(),
  };
}
