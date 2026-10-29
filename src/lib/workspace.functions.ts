import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { surveySaveErrorMessage } from "@/lib/survey-save-errors";
import { canManageSurveys, surveySchema } from "./survey-schema";

export const getWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: membership, error: membershipError } = await context.supabase.from("memberships")
      .select("org_id,role,organizations(name)").eq("user_id", context.userId).order("created_at").order("id").limit(1).single();
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
      const { data, error } = await context.supabase.from("cases").select("response_id,status").eq("org_id", orgId)
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
      .eq("user_id", context.userId).order("created_at").order("id").limit(1).single();
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
    // Generate the readable public identifier in the server action. This avoids relying
    // on a database trigger for the mandatory public_id value during survey creation.
    const publicId = randomBytes(8).toString("hex");
    const { data: result, error: insertError } = await context.supabase.from("surveys")
      .insert({
        ...payload,
        org_id: membership.org_id,
        created_by: context.userId,
        status: "draft",
        public_id: publicId,
      })
      .select("id,public_id")
      .single();
    if (insertError) {
      // Never log survey content, user email, or other personal data.
      console.error("[saveSurvey] insert failed", {
        code: insertError.code,
      });
      throw new Error(surveySaveErrorMessage(insertError.code));
    }
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