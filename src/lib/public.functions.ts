import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  isAllowedPublicScore,
  publicResponseSchema,
  publicSurveyTokenSchema,
  publicSlugResponseSchema,
  publicSurveyIdSchema,
} from "@/lib/public-survey-schema";

export const getPublicSurvey = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ token: publicSurveyTokenSchema }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: survey, error } = await supabaseAdmin
      .from("surveys")
      .select("type,name,question,comment_prompt,thank_you,csat_scale,status")
      .eq("public_token", data.token)
      .maybeSingle();

    if (error) throw new Error("Não foi possível carregar a pesquisa.");
    if (!survey || survey.status !== "active") return null;
    return survey;
  });

export const submitResponse = createServerFn({ method: "POST" })
  .inputValidator((input) => publicResponseSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: survey, error: surveyError } = await supabaseAdmin
      .from("surveys")
      .select("id,org_id,type,status,csat_scale")
      .eq("public_token", data.token)
      .maybeSingle();

    if (surveyError) throw new Error("Não foi possível validar a pesquisa.");
    if (!survey || survey.status !== "active") throw new Error("Pesquisa indisponível.");
    if (!isAllowedPublicScore(survey.type, data.score, survey.csat_scale)) {
      throw new Error(survey.type === "nps"
        ? "A nota NPS deve estar entre 0 e 10."
        : `A nota CSAT deve estar entre 1 e ${survey.csat_scale}.`);
    }

    // A public/reusable survey link deliberately has no CRM entity ID.
    // A future personalized invitation must resolve its CRM record server-side from an invitation token.
    const { error: insertError } = await supabaseAdmin.from("responses").insert({
      survey_id: survey.id,
      org_id: survey.org_id,
      survey_type: survey.type,
      score: data.score,
      comment: data.comment?.trim() || null,
      contact_name: data.name?.trim() || null,
      contact_email: data.email?.trim() || null,
      channel: data.channel,
    });

    if (insertError) throw new Error("Não foi possível registrar sua resposta. Tente novamente.");
    return { ok: true };
  });


export const getPublicSurveyById = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ publicId: publicSurveyIdSchema }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: survey, error } = await supabaseAdmin
      .from("surveys")
      .select("type,name,question,comment_prompt,thank_you,csat_scale,status")
      .eq("public_id", data.publicId)
      .maybeSingle();
    if (error) throw new Error("Não foi possível carregar a pesquisa.");
    if (!survey || survey.status !== "active") return null;
    return survey;
  });

export const submitPublicIdResponse = createServerFn({ method: "POST" })
  .inputValidator((input) => publicSlugResponseSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: survey, error: surveyError } = await supabaseAdmin
      .from("surveys")
      .select("id,org_id,type,status,csat_scale")
      .eq("public_id", data.publicId)
      .maybeSingle();

    if (surveyError) throw new Error("Não foi possível validar a pesquisa.");
    if (!survey || survey.status !== "active") throw new Error("Pesquisa indisponível.");
    if (!isAllowedPublicScore(survey.type, data.score, survey.csat_scale)) {
      throw new Error(survey.type === "nps"
        ? "A nota NPS deve estar entre 0 e 10."
        : `A nota CSAT deve estar entre 1 e ${survey.csat_scale}.`);
    }

    const { error: insertError } = await supabaseAdmin.from("responses").insert({
      survey_id: survey.id,
      org_id: survey.org_id,
      survey_type: survey.type,
      score: data.score,
      comment: data.comment?.trim() || null,
      contact_name: data.name?.trim() || null,
      contact_email: data.email?.trim() || null,
      channel: data.channel,
    });
    if (insertError) throw new Error("Não foi possível registrar sua resposta. Tente novamente.");
    return { ok: true };
  });
