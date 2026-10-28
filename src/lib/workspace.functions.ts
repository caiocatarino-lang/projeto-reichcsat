import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { canManageSurveys, surveySchema } from "./survey-schema";

export const getWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: membership, error: membershipError } = await context.supabase.from("memberships")
      .select("org_id,role,organizations(name)").eq("user_id", context.userId).order("created_at").limit(1).single();
    if (membershipError || !membership) throw new Error("Não foi possível carregar sua organização.");
    const orgId = membership.org_id;
    // Page through tables to avoid the Data API's default 1,000-row cap.
    const surveys = [];
    const responses = [];
    const cases = [];
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await context.supabase.from("surveys").select("*").eq("org_id", orgId)
        .order("created_at").order("id").range(offset, offset + 999);
      if (error) throw new Error("Não foi possível carregar as pesquisas.");
      surveys.push(...(data ?? []));
      if (!data || data.length < 1000) break;
    }
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await context.supabase.from("responses").select("*").eq("org_id", orgId)
        .order("created_at", { ascending: false }).order("id").range(offset, offset + 999);
      if (error) throw new Error("Não foi possível carregar as respostas.");
      responses.push(...(data ?? []));
      if (!data || data.length < 1000) break;
    }
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await context.supabase.from("cases").select("id,response_id,status,assignee,notes,created_at,updated_at").eq("org_id", orgId)
        .order("id").range(offset, offset + 999);
      if (error) throw new Error("Não foi possível carregar as tratativas.");
      cases.push(...(data ?? []));
      if (!data || data.length < 1000) break;
    }
    return { membership, surveys, responses, cases };
  });

export const saveSurvey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => surveySchema.parse(input))
  .handler(async ({ context, data }) => {
    const { data: membership, error } = await context.supabase.from("memberships").select("org_id,role")
      .eq("user_id", context.userId).order("created_at").limit(1).single();
    if (error || !membership || !canManageSurveys(membership.role)) throw new Error("Sem permissão para alterar pesquisas.");
    const { id, ...fields } = data;
    const payload = { ...fields, service_type: fields.service_type || null, updated_at: new Date().toISOString() };
    if (id) {
      const { data: existing, error: readError } = await context.supabase.from("surveys").select("type,csat_scale,csat_threshold")
        .eq("id", id).eq("org_id", membership.org_id).single();
      if (readError || !existing) throw new Error("Pesquisa não encontrada.");
      const { count, error: countError } = await context.supabase.from("responses").select("id", { count: "exact", head: true }).eq("survey_id", id);
      if (countError) throw new Error("Não foi possível verificar as respostas.");
      if (count && (existing.type !== fields.type || existing.csat_scale !== fields.csat_scale || existing.csat_threshold !== fields.csat_threshold)) {
        throw new Error("Pesquisas com respostas mantêm seu tipo e escala. Duplique para criar uma nova versão.");
      }
      const { data: result, error: updateError } = await context.supabase.from("surveys").update(payload)
        .eq("id", id).eq("org_id", membership.org_id).select("id").single();
      if (updateError) throw new Error("Não foi possível salvar a pesquisa.");
      return result;
    }
    const { data: result, error: insertError } = await context.supabase.from("surveys")
      .insert({ ...payload, org_id: membership.org_id, created_by: context.userId, status: "draft" }).select("id").single();
    if (insertError) throw new Error("Não foi possível criar a pesquisa.");
    return result;
  });

export const setSurveyStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid(), status: z.enum(["draft", "active", "archived"]) }).parse(input))
  .handler(async ({ context, data }) => {
    // RLS enforces organization membership and manager/admin writes.
    const { data: result, error } = await context.supabase.from("surveys")
      .update({ status: data.status, updated_at: new Date().toISOString() }).eq("id", data.id).select("id").single();
    if (error) throw new Error("Não foi possível alterar o status. Verifique sua permissão.");
    return result;
  });
export const updateCase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    id: z.string().uuid(),
    status: z.enum(["open", "in_progress", "resolved"]),
    notes: z.string().trim().max(4000),
  }).parse(input))
  .handler(async ({ context, data }) => {
    const { data: membership, error: membershipError } = await context.supabase
      .from("memberships")
      .select("org_id")
      .eq("user_id", context.userId)
      .order("created_at")
      .limit(1)
      .single();

    if (membershipError || !membership) throw new Error("Não foi possível validar sua organização.");

    const { data: updated, error } = await context.supabase
      .from("cases")
      .update({
        status: data.status,
        notes: data.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id)
      .eq("org_id", membership.org_id)
      .select("id")
      .single();

    if (error || !updated) throw new Error("Não foi possível atualizar a tratativa. Verifique suas permissões.");
    return updated;
  });

export const updateOrganizationName = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    name: z.string().trim().min(1, "Informe o nome da organização.").max(120),
  }).parse(input))
  .handler(async ({ context, data }) => {
    const { data: membership, error: membershipError } = await context.supabase
      .from("memberships")
      .select("org_id,role")
      .eq("user_id", context.userId)
      .order("created_at")
      .limit(1)
      .single();

    if (membershipError || !membership) throw new Error("Não foi possível validar sua organização.");
    if (membership.role !== "admin") throw new Error("Somente administradores podem alterar o nome da organização.");

    const { data: updated, error } = await context.supabase
      .from("organizations")
      .update({ name: data.name })
      .eq("id", membership.org_id)
      .select("id")
      .single();

    if (error || !updated) throw new Error("Não foi possível salvar o nome da organização.");
    return { ok: true };
  });
