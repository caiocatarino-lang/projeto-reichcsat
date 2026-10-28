import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AlertTriangle, CheckCircle2, Plug, RefreshCw, Unplug } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { pageHead } from "@/lib/workspace";
import { useMembership } from "@/lib/org";
import {
  connectBitrix, disconnectBitrix, getBitrixStatus, testBitrixEntity, updateBitrixOptions,
} from "@/lib/bitrix.functions";
import { WorkspaceError, WorkspacePending } from "@/components/workspace-states";

type EntityType = "lead" | "deal";

export const Route = createFileRoute("/_authenticated/integrations")({
  head: () => pageHead("Integrações", "Configure e diagnostique a conexão do ReichCsat com o Bitrix24."),
  component: Page,
  errorComponent: WorkspaceError,
  pendingComponent: WorkspacePending,
});

function Page() {
  const queryClient = useQueryClient();
  const membership = useMembership();
  const isAdmin = membership.data?.role === "admin";
  const [webhook, setWebhook] = useState("");
  const [entityType, setEntityType] = useState<EntityType>("deal");
  const [entityId, setEntityId] = useState("");
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [testResult, setTestResult] = useState<{ title: string; assigned?: string; stage?: string } | null>(null);

  const statusQuery = useQuery({
    queryKey: ["bitrix-status"],
    queryFn: () => getBitrixStatus(),
    retry: false,
  });

  const connectFn = useServerFn(connectBitrix);
  const disconnectFn = useServerFn(disconnectBitrix);
  const testFn = useServerFn(testBitrixEntity);
  const optionsFn = useServerFn(updateBitrixOptions);

  const refreshStatus = async () => {
    await queryClient.invalidateQueries({ queryKey: ["bitrix-status"] });
  };

  const connectMutation = useMutation({
    mutationFn: (value: string) => connectFn({ data: { webhook: value.trim() } }),
    onSuccess: async (result) => {
      setWebhook("");
      await refreshStatus();
      toast.success("Conexão validada com " + result.portal);
    },
    onError: (error) => toast.error(error.message || "Não foi possível conectar ao Bitrix24."),
  });

  const disconnectMutation = useMutation({
    mutationFn: () => disconnectFn(),
    onSuccess: async () => {
      setConfirmDisconnect(false);
      setTestResult(null);
      await refreshStatus();
      toast.success("Bitrix24 desconectado");
    },
    onError: (error) => toast.error(error.message || "Não foi possível desconectar o Bitrix24."),
  });

  const testMutation = useMutation({
    mutationFn: () => testFn({ data: { type: entityType, id: entityId.trim() } }),
    onSuccess: (result) => {
      setTestResult(result);
      toast.success("Registro encontrado no Bitrix24");
    },
    onError: (error) => {
      setTestResult(null);
      toast.error(error.message || "Não foi possível consultar o registro.");
    },
  });

  const optionsMutation = useMutation({
    mutationFn: (value: { create_tasks: boolean; post_timeline: boolean }) => optionsFn({ data: value }),
    onSuccess: refreshStatus,
    onError: (error) => toast.error(error.message || "Não foi possível salvar as opções."),
  });

  const status = statusQuery.data;
  const connected = status?.status === "connected";
  const loading = statusQuery.isLoading || membership.isLoading;

  if (loading) return <div className="space-y-4"><WorkspacePending /></div>;

  return (
    <div className="space-y-7">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">ReichCsat / Conectividade</p>
        <h1 className="mt-2 text-3xl font-semibold">Integrações</h1>
        <p className="mt-2 text-sm text-muted-foreground">Conecte o Bitrix24, teste o acesso ao CRM e configure ações futuras de sincronização.</p>
      </header>

      <section className="rounded-xl border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Plug className="size-5" /></div>
            <div>
              <h2 className="text-lg font-semibold">Bitrix24</h2>
              <p className="mt-1 text-sm text-muted-foreground">Conexão por webhook de entrada do portal.</p>
            </div>
          </div>
          <span className={connected ? "inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-sm text-emerald-600" : "inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground"}>
            <span className={connected ? "size-2 rounded-full bg-emerald-500" : "size-2 rounded-full bg-muted-foreground"} />
            {connected ? "Conectado" : status?.status === "error" ? "Erro na conexão" : "Não conectado"}
          </span>
        </div>

        {status?.portal && <div className="mt-5 rounded-lg border bg-muted/30 p-3 text-sm"><span className="text-muted-foreground">Portal:</span> <span className="font-medium">{status.portal}</span></div>}
        {status?.last_sync_at && <p className="mt-3 text-xs text-muted-foreground">Último teste bem-sucedido: {new Date(status.last_sync_at).toLocaleString("pt-BR")}</p>}
        {status?.last_error && <p role="alert" className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{status.last_error}</p>}
        {statusQuery.error && <p role="alert" className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">Não foi possível consultar o estado da integração.</p>}

        <form className="mt-6 space-y-3" onSubmit={(event) => { event.preventDefault(); connectMutation.mutate(webhook); }}>
          <div className="space-y-2">
            <Label htmlFor="bitrix-webhook">Webhook de entrada do Bitrix24</Label>
            <Input
              id="bitrix-webhook"
              type="url"
              inputMode="url"
              autoComplete="off"
              placeholder="https://seuportal.bitrix24.com.br/rest/ID/CODIGO/"
              value={webhook}
              onChange={(event) => setWebhook(event.target.value)}
              disabled={!isAdmin || connectMutation.isPending}
              required
            />
            <p className="text-xs text-muted-foreground">A URL será processada no servidor e não será exibida de volta. Use um webhook com as permissões mínimas necessárias.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={!isAdmin || connectMutation.isPending || !webhook.trim()}>
              {connectMutation.isPending ? <RefreshCw className="mr-2 size-4 animate-spin" /> : <Plug className="mr-2 size-4" />}
              {connected ? "Validar e atualizar conexão" : "Conectar Bitrix24"}
            </Button>
            {connected && <Button type="button" variant="outline" onClick={() => setConfirmDisconnect(true)} disabled={!isAdmin || disconnectMutation.isPending}><Unplug className="mr-2 size-4" />Desconectar</Button>}
          </div>
          {!isAdmin && <p className="text-sm text-muted-foreground">Somente o administrador da organização pode alterar a integração.</p>}
        </form>
      </section>

      <section className="rounded-xl border bg-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Diagnóstico do CRM</h2>
        <p className="mt-1 text-sm text-muted-foreground">Consulte um lead ou negócio para confirmar que o webhook possui acesso de leitura.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-[160px_1fr_auto] sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="bitrix-entity-type">Tipo de registro</Label>
            <Select value={entityType} onValueChange={(value: EntityType) => { setEntityType(value); setTestResult(null); }}>
              <SelectTrigger id="bitrix-entity-type"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="deal">Negócio</SelectItem><SelectItem value="lead">Lead</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bitrix-entity-id">ID do registro</Label>
            <Input id="bitrix-entity-id" inputMode="numeric" pattern="[0-9]+" value={entityId} onChange={(event) => { setEntityId(event.target.value); setTestResult(null); }} placeholder="Ex.: 1234" />
          </div>
          <Button onClick={() => testMutation.mutate()} disabled={!isAdmin || !connected || !/^\d{1,12}$/.test(entityId.trim()) || testMutation.isPending}>
            {testMutation.isPending ? "Consultando…" : "Testar registro"}
          </Button>
        </div>
        {testResult && <div role="status" className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm">
          <p className="flex items-center gap-2 font-semibold text-emerald-600"><CheckCircle2 className="size-4" />Registro localizado</p>
          <p className="mt-2">{testResult.title || "Registro sem título"}</p>
          {testResult.assigned && <p className="mt-1 text-muted-foreground">Responsável Bitrix24 ID: {testResult.assigned}</p>}
          {testResult.stage && <p className="mt-1 text-muted-foreground">Etapa/status: {testResult.stage}</p>}
        </div>}
      </section>

      <section className="rounded-xl border bg-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Comportamento da integração</h2>
        <p className="mt-1 text-sm text-muted-foreground">Preferências que poderão ser utilizadas pelos fluxos de integração depois de vinculados a convites individuais.</p>
        <div className="mt-5 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div><Label htmlFor="bitrix-timeline">Registrar avaliação na linha do tempo</Label><p className="mt-1 text-xs text-muted-foreground">Preparar comentários no registro do CRM.</p></div>
            <Switch id="bitrix-timeline" checked={status?.post_timeline ?? true} disabled={!isAdmin || !connected || optionsMutation.isPending} onCheckedChange={(checked) => optionsMutation.mutate({ create_tasks: status?.create_tasks ?? true, post_timeline: checked })} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div><Label htmlFor="bitrix-tasks">Criar tarefa para avaliações negativas</Label><p className="mt-1 text-xs text-muted-foreground">Preparar tarefas de recuperação para o responsável do CRM.</p></div>
            <Switch id="bitrix-tasks" checked={status?.create_tasks ?? true} disabled={!isAdmin || !connected || optionsMutation.isPending} onCheckedChange={(checked) => optionsMutation.mutate({ create_tasks: checked, post_timeline: status?.post_timeline ?? true })} />
          </div>
        </div>
        <div className="mt-5 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <p>O vínculo automático entre uma resposta pública e um lead/negócio ainda depende da implementação de convites individualizados validados no servidor. Até lá, esta tela permite validar a conexão, mas não afirma que respostas públicas estejam sendo sincronizadas com o CRM.</p>
        </div>
      </section>

      <AlertDialog open={confirmDisconnect} onOpenChange={setConfirmDisconnect}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desconectar o Bitrix24?</AlertDialogTitle>
            <AlertDialogDescription>A credencial armazenada será removida e os novos fluxos deixarão de usar esta conexão. Os registros de respostas existentes serão preservados.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={disconnectMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={disconnectMutation.isPending} onClick={(event) => { event.preventDefault(); disconnectMutation.mutate(); }}>
              {disconnectMutation.isPending ? "Desconectando…" : "Desconectar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
