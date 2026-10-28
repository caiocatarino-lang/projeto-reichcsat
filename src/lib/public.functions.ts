import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { isValidSurveyScore, publicResponseSchema } from "./public-response-schema";

export const getPublicSurvey = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ token: z.string().min(8).max(64) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: s, error } = await supabaseAdmin
      .from("surveys")
      .select("type,name,question,comment_prompt,thank_you,csat_scale,status")
      .eq("public_token", data.token)
      .maybeSingle();
    if (error || !s || s.status !== "active") return null;
    return s;
  });

export const submitResponse = createServerFn({ method: "POST" })
  .inputValidator((d) => publicResponseSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: survey, error: surveyError } = await supabaseAdmin
      .from("surveys")
      .select("id,org_id,type,status,csat_scale")
      .eq("public_token", data.token)
      .maybeSingle();

    if (surveyError || !survey || survey.status !== "active") {
      throw new Error("Pesquisa indisponível");
    }

    if (!isValidSurveyScore(survey.type, data.score, survey.csat_scale)) {
      throw new Error(
        survey.type === "nps"
          ? "A nota NPS deve estar entre 0 e 10."
          : "A nota CSAT está fora da escala desta pesquisa.",
      );
    }

    // A survey-level token is not bound to an individual CRM record.
    // Never trust entity IDs supplied by a respondent. CRM writes must wait
    // for recipient-specific invitations validated on the server.
    const { data: response, error: insertError } = await supabaseAdmin
      .from("responses")
      .insert({
        survey_id: survey.id,
        org_id: survey.org_id,
        survey_type: survey.type,
        score: data.score,
        comment: data.comment || null,
        contact_name: data.name || null,
        contact_email: data.email || null,
        channel: "link",
      })
      .select("id")
      .single();

    if (insertError || !response) {
      console.error("[PublicSurvey] Failed to save response", insertError);
      throw new Error("Não foi possível registrar sua resposta. Tente novamente.");
    }

    return { ok: true, responseId: response.id };
  });
