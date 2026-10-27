import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getPublicSurvey = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ token: z.string().min(8).max(64) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: s } = await supabaseAdmin
      .from("surveys")
      .select("type,name,question,comment_prompt,thank_you,csat_scale,status,organizations(name)")
      .eq("public_token", data.token)
      .maybeSingle();
    if (!s || s.status !== "active") return null;
    return s;
  });

const submitSchema = z.object({
  token: z.string().min(8).max(64),
  score: z.number().int().min(0).max(10),
  comment: z.string().max(2000).optional(),
  name: z.string().max(120).optional(),
  email: z.string().email().max(200).optional().or(z.literal("")),
  entityType: z.enum(["lead", "deal", "contact"]).optional(),
  entityId: z.string().regex(/^\d{1,12}$/).optional(),
  channel: z.enum(["link", "email", "whatsapp", "sms"]).optional(),
});

export const submitResponse = createServerFn({ method: "POST" })
  .inputValidator((d) => submitSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { bitrixCall } = await import("./bitrix.server");
    const { data: s } = await supabaseAdmin
      .from("surveys").select("id,org_id,name,type,status").eq("public_token", data.token).maybeSingle();
    if (!s || s.status !== "active") throw new Error("Pesquisa indisponível");

    // Bitrix context (optional)
    const { data: integ } = await supabaseAdmin
      .from("integrations").select("id,status,create_tasks,post_timeline,integration_secrets(webhook_url)")
      .eq("org_id", s.org_id).eq("provider", "bitrix24").maybeSingle();
    const secret = integ?.integration_secrets as unknown as { webhook_url: string } | null;
    const webhook = integ?.status === "connected" ? secret?.webhook_url : undefined;

    let responsible: string | undefined;
    let assignedId: string | undefined;
    let contactName = data.name || undefined;
    const log = async (action: string, ok: boolean, detail?: string) => {
      await supabaseAdmin.from("sync_events").insert({ org_id: s.org_id, provider: "bitrix24", action, ok, detail: detail ?? null });
    };

    if (webhook && data.entityType && data.entityId && data.entityType !== "contact") {
      try {
        const ent = await bitrixCall<Record<string, string>>(webhook, `crm.${data.entityType}.get`, { id: data.entityId });
        assignedId = ent["ASSIGNED_BY_ID"];
        contactName ||= ent["TITLE"] || [ent["NAME"], ent["LAST_NAME"]].filter(Boolean).join(" ") || undefined;
        if (assignedId) {
          const users = await bitrixCall<Array<{ NAME?: string; LAST_NAME?: string }>>(webhook, "user.get", { ID: assignedId });
          const u = users?.[0];
          responsible = u ? [u.NAME, u.LAST_NAME].filter(Boolean).join(" ") || `Usuário #${assignedId}` : `Usuário #${assignedId}`;
        }
        await log(`crm.${data.entityType}.get`, true, `#${data.entityId}`);
      } catch (e) {
        await log(`crm.${data.entityType}.get`, false, (e as Error).message);
      }
    }

    const { data: r, error } = await supabaseAdmin.from("responses").insert({
      survey_id: s.id, org_id: s.org_id, survey_type: s.type, score: data.score,
      comment: data.comment || null, contact_name: contactName || null, contact_email: data.email || null,
      responsible: responsible || null, channel: data.channel || "link",
      bitrix_entity_type: data.entityType || null, bitrix_entity_id: data.entityId || null,
    }).select("id,is_negative").single();
    if (error) throw new Error(error.message);

    if (webhook && data.entityType && data.entityId) {
      const label = s.type === "nps" ? "NPS" : "CSAT";
      let synced = false;
      if (integ?.post_timeline) {
        try {
          await bitrixCall(webhook, "crm.timeline.comment.add", {
            fields: { ENTITY_ID: Number(data.entityId), ENTITY_TYPE: data.entityType,
              COMMENT: `ReichCsat · ${s.name}\n${label}: ${data.score}${data.comment ? `\nComentário: ${data.comment}` : ""}` },
          });
          synced = true;
          await log("crm.timeline.comment.add", true, `#${data.entityId}`);
        } catch (e) { await log("crm.timeline.comment.add", false, (e as Error).message); }
      }
      if (r.is_negative && integ?.create_tasks && assignedId) {
        try {
          const prefix = { lead: "L", deal: "D", contact: "C" }[data.entityType];
          await bitrixCall(webhook, "tasks.task.add", {
            fields: { TITLE: `Recuperar cliente: ${label} ${data.score}${contactName ? ` · ${contactName}` : ""}`,
              RESPONSIBLE_ID: Number(assignedId), DESCRIPTION: data.comment || "Avaliação negativa sem comentário.",
              UF_CRM_TASK: [`${prefix}_${data.entityId}`] },
          });
          await log("tasks.task.add", true, `Responsável #${assignedId}`);
        } catch (e) { await log("tasks.task.add", false, (e as Error).message); }
      }
      if (synced) await supabaseAdmin.from("responses").update({ bitrix_synced: true }).eq("id", r.id);
      await supabaseAdmin.from("integrations").update({ last_sync_at: new Date().toISOString() }).eq("id", integ!.id);
    }
    return { ok: true };
  });
