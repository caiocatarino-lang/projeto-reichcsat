import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
export async function currentOrganization(client: SupabaseClient<Database>, userId: string, admin = false) {
  const { data, error } = await client.from('memberships').select('org_id,role').eq('user_id', userId).order('created_at').order('id').limit(1).single();
  if (error || !data) throw new Error('Não foi possível carregar sua organização.');
  if (admin && data.role !== 'admin') throw new Error('Apenas administradores podem realizar esta operação.');
  return data;
}
export function verifyWrite(error: { message: string } | null, result: unknown) {
  if (error || !result) throw new Error('Não foi possível salvar. Recarregue e tente novamente.');
}
