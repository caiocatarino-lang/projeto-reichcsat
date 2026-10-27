import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function requireAdmin(supabase: any, userId: string) {
  const { data } = await supabase.from("memberships").select("org_id,role").eq("user_id", userId).limit(1).single();
  if (!data || data.role !== "admin") throw new Error("Apenas administradores podem alterar integrações");
  return data.org_id as string;
}

export const connectBitrix = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ webhook: z.string().url().max(500) }).parse(d))
  .handler(async ({ data, context }) => {
    const orgId = await requireAdmin(context.supabase, context.userId);
    const { normalizeWebhook, bitrixCall } = await import("./bitrix.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const webhook = normalizeWebhook(data.webhook);
    const portal = new URL(webhook).host;
    let error: string | null = null;
    try {
      await bitrixCall(webhook, "crm.lead.fields");
      await bitrixCall(webhook, "crm.deal.fields");
    } catch (e) { error = (e as Error).message; }
    const { data: integ, error: e1 } = await supabaseAdmin.from("integrations").upsert({
      org_id: orgId, provider: "bitrix24", portal, status: error ? "error" : "connected",
      last_error: error, updated_at: new Date().toISOString(),
    }, { onConflict: "org_id,provider" }).select("id").single();
    if (e1) throw new Error(e1.message);
    if (!error) await supabaseAdmin.from("integration_secrets").upsert({ integration_id: integ.id, webhook_url: webhook });
    await supabaseAdmin.from("sync_events").insert({ org_id: orgId, provider: "bitrix24", action: "validar conexão", ok: !error, detail: error ?? portal });
    if (error) throw new Error(`Não foi possível validar: ${error}`);
    return { portal };
  });

export const testBitrixEntity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ type: z.enum(["lead", "deal"]), id: z.string().regex(/^\d{1,12}$/) }).parse(d))
  .handler(async ({ data, context }) => {
    const orgId = await requireAdmin(context.supabase, context.userId);
    const { bitrixCall } = await import("./bitrix.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: integ } = await supabaseAdmin.from("integrations").select("id,integration_secrets(webhook_url)").eq("org_id", orgId).eq("provider", "bitrix24").single();
    const webhook = (integ?.integration_secrets as unknown as { webhook_url: string } | null)?.webhook_url;
    if (!webhook) throw new Error("Bitrix24 não conectado");
    try {
      const ent = await bitrixCall<Record<string, string>>(webhook, `crm.${data.type}.get`, { id: data.id });
      await supabaseAdmin.from("sync_events").insert({ org_id: orgId, provider: "bitrix24", action: `teste crm.${data.type}.get`, ok: true, detail: `#${data.id}` });
      await supabaseAdmin.from("integrations").update({ last_sync_at: new Date().toISOString(), last_error: null }).eq("id", integ!.id);
      return { title: ent.TITLE || [ent.NAME, ent.LAST_NAME].filter(Boolean).join(" "), assigned: ent.ASSIGNED_BY_ID, stage: ent.STAGE_ID || ent.STATUS_ID };
    } catch (e) {
      await supabaseAdmin.from("sync_events").insert({ org_id: orgId, provider: "bitrix24", action: `teste crm.${data.type}.get`, ok: false, detail: (e as Error).message });
      throw e;
    }
  });

export const updateBitrixOptions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ create_tasks: z.boolean(), post_timeline: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const orgId = await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("integrations").update(data).eq("org_id", orgId).eq("provider", "bitrix24");
    return { ok: true };
  });

export const disconnectBitrix = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const orgId = await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: integ } = await supabaseAdmin.from("integrations").select("id").eq("org_id", orgId).eq("provider", "bitrix24").maybeSingle();
    if (integ) {
      await supabaseAdmin.from("integration_secrets").delete().eq("integration_id", integ.id);
      await supabaseAdmin.from("integrations").update({ status: "disconnected", last_error: null }).eq("id", integ.id);
      await supabaseAdmin.from("sync_events").insert({ org_id: orgId, provider: "bitrix24", action: "desconectar", ok: true });
    }
    return { ok: true };
  });
