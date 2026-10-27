import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const membershipQuery = queryOptions({
  queryKey: ["membership"],
  queryFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw new Error("Sessão expirada");
    const { data, error } = await supabase
      .from("memberships")
      .select("org_id, role, email, organizations(name)")
      .eq("user_id", u.user.id)
      .limit(1)
      .single();
    if (error) throw error;
    return data;
  },
});

export function useMembership() {
  return useQuery(membershipQuery);
}

export const roleLabel: Record<string, string> = { admin: "Administrador", manager: "Gestor", agent: "Atendente" };
export const caseStatusLabel: Record<string, string> = { open: "Aberta", in_progress: "Em andamento", resolved: "Resolvida" };
