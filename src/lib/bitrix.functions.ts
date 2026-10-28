import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function requireAdmin(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase.from("memberships")
    .select("org_id,role")
    .eq("user_id", userId)
    .order("created_at")
    .limit(1)
    .single();
  if (error || !data || data.role !== "admin") throw new Error("Apenas administradores podem alterar integrações.");
  return data.org_id as string;
}

export const getBitrixStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: membership, error: membershipError } = await context.supabase.from("memberships")
      .select("org_id")
      .eq("user_id", context.userId)
      .order("created_at")
      .limit(1)
      .single();
    if (membershipError || !membership) throw new Error("Não foi possível validar sua organização.");

    const { data, error } = await context.supabase.from("integrations")
      .select("status,portal,last_sync_at,last_error,create_tasks,post_timeline")
      .eq("org_id", membership.org_id)
      .eq("provider", "bitrix24")
      .maybeSingle();
    if (error) throw new Error("Não foi possível consultar o estado da integração.");
    return data;
  });

export const connectBitrix = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ webhook: z.string().url().max(500) }).parse(d))
  .handler(async ({ data, context }) => {
    const orgId = await requireAdmin(context.supabase, context.userId);
    const { normalizeWebhook, bitrixCall } = await import("./bitrix.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const webhook = normalizeWebhook(data.webhook);
    const portal = new URL(webhook).host;
    let validationError: string | null = null;

    try {
      await bitrixCall(webhook, "crm.lead.fields");
      await bitrixCall(webhook, "crm.deal.fields");
    } catch (error) {
      validationError = error instanceof Error ? error.message : "Falha ao validar o webhook.";
    }

    const { data: integration, error: integrationError } = await supabaseAdmin.from("integrations").upsert({
      org_id: orgId,
      provider: "bitrix24",
      portal,
      status: validationError ? "error" : "connected",
      last_error: validationError,
      updated_at: new Date().toISOString(),
    }, { onConflict: "org_id,provider" }).select("id").single();

    if (integrationError || !integration) {
      console.error("[Bitrix24] Failed to save integration status", integrationError);
      throw new Error("Não foi possível salvar a configuração da integração.");
    }

    if (!validationError) {
      const { error: secretError } = await supabaseAdmin.from("integration_secrets").upsert({
        integration_id: integration.id,
        webhook_url: webhook,
      });
      if (secretError) {
        await supabaseAdmin.from("integrations").update({
          status: "error",
          last_error: "Não foi possível armazenar a credencial no servidor.",
          updated_at: new Date().toISOString(),
        }).eq("id", integration.id);
        console.error("[Bitrix24] Failed to store webhook securely", secretError);
        throw new Error("A conexão foi validada, mas não foi possível armazenar o webhook com segurança.");
      }
    }

    const { error: logError } = await supabaseAdmin.from("sync_events").insert({
      org_id: orgId,
      provider: "bitrix24",
      action: "validar conexão",
      ok: !validationError,
      detail: validationError ?? portal,
    });
    if (logError) console.error("[Bitrix24] Failed to record connection event", logError);

    if (validationError) throw new Error("Não foi possível validar o webhook: " + validationError);
    return { portal };
  });

export const testBitrixEntity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ type: z.enum(["lead", "deal"]), id: z.string().regex(/^\d{1,12}$/) }).parse(d))
  .handler(async ({ data, context }) => {
    const orgId = await requireAdmin(context.supabase, context.userId);
    const { bitrixCall } = await import("./bitrix.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: integration, error: integrationError } = await supabaseAdmin.from("integrations")
      .select("id,integration_secrets(webhook_url)")
      .eq("org_id", orgId)
      .eq("provider", "bitrix24")
      .eq("status", "connected")
      .maybeSingle();
    if (integrationError) throw new Error("Não foi possível consultar a integração.");
    const secret = integration?.integration_secrets as unknown as { webhook_url: string } | null;
    if (!integration || !secret?.webhook_url) throw new Error("Bitrix24 não conectado.");

    try {
      const entity = await bitrixCall<Record<string, string>>(secret.webhook_url, "crm." + data.type + ".get", { id: data.id });
      const { error: updateError } = await supabaseAdmin.from("integrations").update({
        last_sync_at: new Date().toISOString(),
        last_error: null,
      }).eq("id", integration.id);
      if (updateError) console.error("[Bitrix24] Failed to update last success timestamp", updateError);
      const { error: logError } = await supabaseAdmin.from("sync_events").insert({
        org_id: orgId,
        provider: "bitrix24",
        action: "teste crm." + data.type + ".get",
        ok: true,
        detail: "#" + data.id,
      });
      if (logError) console.error("[Bitrix24] Failed to log entity test", logError);
      return {
        title: entity["TITLE"] || [entity["NAME"], entity["LAST_NAME"]].filter(Boolean).join(" "),
        assigned: entity["ASSIGNED_BY_ID"],
        stage: entity["STAGE_ID"] || entity["STATUS_ID"],
      };
    } catch (error) {
      await supabaseAdmin.from("sync_events").insert({
        org_id: orgId,
        provider: "bitrix24",
        action: "teste crm." + data.type + ".get",
        ok: false,
        detail: error instanceof Error ? error.message : "Erro desconhecido",
      });
      throw error;
    }
  });

export const updateBitrixOptions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ create_tasks: z.boolean(), post_timeline: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const orgId = await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: updated, error } = await supabaseAdmin.from("integrations")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("org_id", orgId)
      .eq("provider", "bitrix24")
      .select("id")
      .maybeSingle();
    if (error || !updated) throw new Error("Não foi possível salvar as opções da integração.");
    return { ok: true };
  });

export const disconnectBitrix = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const orgId = await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: integration, error: readError } = await supabaseAdmin.from("integrations")
      .select("id")
      .eq("org_id", orgId)
      .eq("provider", "bitrix24")
      .maybeSingle();
    if (readError) throw new Error("Não foi possível consultar a integração.");
    if (!integration) return { ok: true };

    const { error: secretError } = await supabaseAdmin.from("integration_secrets")
      .delete().eq("integration_id", integration.id);
    if (secretError) throw new Error("Não foi possível remover a credencial da integração.");

    const { error: updateError } = await supabaseAdmin.from("integrations").update({
      status: "disconnected",
      last_error: null,
      updated_at: new Date().toISOString(),
    }).eq("id", integration.id);
    if (updateError) throw new Error("Não foi possível desconectar a integração.");

    const { error: logError } = await supabaseAdmin.from("sync_events").insert({
      org_id: orgId,
      provider: "bitrix24",
      action: "desconectar",
      ok: true,
    });
    if (logError) console.error("[Bitrix24] Failed to log disconnection", logError);
    return { ok: true };
  });
