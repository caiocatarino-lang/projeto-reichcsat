import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Plug, Unplug, Save, Search, CheckCircle2, XCircle, BrainCircuit, Eye, EyeOff,
  ShieldCheck, KeyRound, ExternalLink, BookOpen, RefreshCw, AudioLines, MessageSquareText,
} from "lucide-react";
import { toast } from "sonner";
import {
  getBitrix, connectBitrix, disconnectBitrix, testBitrixEntity, updateBitrixOptions,
} from "@/lib/bitrix.functions";
import {
  getAIProviderConfig, saveAIProviderConfig, testAIProviderConnection, disconnectAIProvider,
} from "@/lib/ai-integration.functions";
import { normalizeWebhook } from "@/lib/bitrix-security";
import { pageHead } from "@/lib/workspace";
import { Choice, dateLabel } from "@/components/operations-ui";
import { WorkspaceError, WorkspacePending } from "@/components/workspace-states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const bitrixOptions = queryOptions({ queryKey: ["bitrix"], queryFn: () => getBitrix() });
const aiOptions = queryOptions({ queryKey: ["ai-provider"], queryFn: () => getAIProviderConfig() });

export const Route = createFileRoute("/_authenticated/integrations")({
  loader: async ({ context }) => Promise.all([
    context.queryClient.ensureQueryData(bitrixOptions),
    context.queryClient.ensureQueryData(aiOptions),
  ]),
  head: () => pageHead("Integrações", "Configure e valide IA e Bitrix24 com instruções passo a passo."),
  component: Page,
  pendingComponent: WorkspacePending,
  errorComponent: WorkspaceError,
  notFoundComponent: () => <p>Integração não encontrada.</p>,
});

function Page() {
  const { data: bitrix } = useSuspenseQuery(bitrixOptions);
  const { data: ai } = useSuspenseQuery(aiOptions);
  return (
    <div className="space-y-8 pb-12">
      <header className="relative isolate overflow-hidden rounded-3xl border bg-gradient-to-br from-card via-card to-primary/5 p-5 shadow-sm sm:p-7">
        <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-12 -z-10 size-52 rounded-full border border-primary/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-1 -top-6 -z-10 size-36 rounded-full border border-cyan-400/20" />
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Central de conexões</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Integrações</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Configure os serviços que alimentam a inteligência do REICHCSAT e a integração com o CRM. As credenciais são tratadas no servidor e nunca são devolvidas à interface.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${ai.isConfigured ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "bg-background text-muted-foreground"}`}><BrainCircuit className="size-3.5"/>{ai.isConfigured ? "IA configurada" : "IA não configurada"}</span>
          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${bitrix.state === "connected" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "bg-background text-muted-foreground"}`}><Plug className="size-3.5"/>{bitrix.state === "connected" ? "Bitrix24 conectado" : "Bitrix24 pendente"}</span>
        </div>
      </header>

      <AIIntegration data={ai} />

      <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-gradient-to-br from-card to-primary/[0.035] p-4 sm:p-5">
          <div className="flex items-center gap-3"><div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Plug className="size-5"/></div><div><h2 className="text-lg font-semibold">Bitrix24 Cloud</h2><p className="text-sm text-muted-foreground">Sincronização de respostas com o CRM</p></div></div>
          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${bitrix.state === "connected" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : bitrix.state === "error" ? "border-rose-200 bg-rose-50 text-rose-700" : "bg-background text-muted-foreground"}`}>{bitrix.state === "connected" ? <CheckCircle2 className="size-3.5"/> : <XCircle className="size-3.5"/>}{({ connected: "Conectado", disconnected: "Não conectado", error: "Erro de conexão", incomplete: "Configuração incompleta" } as Record<string,string>)[bitrix.state]}</span>
        </div>
        <div className="p-4 sm:p-6">
          {bitrix.integration?.portal && <p className="mb-2 break-words text-sm">Portal: <strong>{bitrix.integration.portal}</strong></p>}
          {bitrix.integration?.last_sync_at && <p className="mb-4 text-xs text-muted-foreground">Última atividade: {dateLabel(bitrix.integration.last_sync_at)}</p>}
          {bitrix.role === "admin" ? <BitrixControls key={bitrix.integration?.updated_at ?? "none"} data={bitrix} /> : <p className="text-sm text-muted-foreground">Somente administradores podem alterar a integração.</p>}
          <details className="mt-6 rounded-xl border bg-muted/15 p-4">
            <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold"><BookOpen className="size-4 text-primary"/>Tutorial: conectar o Bitrix24</summary>
            <div className="mt-4 space-y-4 text-sm leading-6 text-muted-foreground">
              <ol className="list-decimal space-y-2 pl-5">
                <li>Entre no Bitrix24 com um usuário administrador e abra a área de desenvolvedores ou integrações.</li>
                <li>Crie um <strong className="text-foreground">webhook de entrada</strong> e selecione as permissões <strong className="text-foreground">CRM</strong>; marque <strong className="text-foreground">Tarefas</strong> se quiser que notas negativas gerem tarefas automaticamente.</li>
                <li>Copie a URL completa do webhook e cole no campo “Webhook de entrada” acima. Ela contém uma credencial privada; não a envie por e-mail ou em conversas públicas.</li>
                <li>Clique em <strong className="text-foreground">Validar e conectar</strong>. O REICHCSAT consulta os campos de Leads e Negócios; se a validação passar, a conexão será salva.</li>
                <li>Ative “Registrar respostas na timeline CRM” e/ou “Criar tarefas para respostas negativas” conforme o processo da empresa e salve as opções.</li>
                <li>Use “Testar entidade CRM” com o ID de um Lead ou Negócio que o webhook tenha permissão para consultar.</li>
              </ol>
              <div className="flex flex-wrap gap-3 border-t pt-3">
                <a href="https://apidocs.bitrix24.com/local-integrations/local-webhooks.html" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">Documentação oficial de webhooks <ExternalLink className="size-3.5"/></a>
                <a href="https://apidocs.bitrix24.com/api-reference/crm/timeline/comments/crm-timeline-comment-add.html" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">Comentários na timeline <ExternalLink className="size-3.5"/></a>
                <a href="https://apidocs.bitrix24.com/api-reference/tasks/tasks-task-add.html" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">API de tarefas <ExternalLink className="size-3.5"/></a>
              </div>
            </div>
          </details>
          <section className="mt-6 border-t pt-5">
            <div className="mb-3 flex items-center gap-2"><RefreshCw className="size-4 text-primary"/><h3 className="font-semibold">Histórico recente do Bitrix24</h3></div>
            {!bitrix.events.length ? <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">Nenhuma tentativa de sincronização registrada.</p> : <ul className="divide-y">{bitrix.events.map((event) => <li key={event.id} className="flex flex-wrap items-center gap-3 py-3">{event.ok ? <CheckCircle2 className="size-4 text-emerald-600"/> : <XCircle className="size-4 text-destructive"/>}<span className="min-w-0 flex-1 break-words text-sm">{event.action}</span><span className="text-xs text-muted-foreground">{event.ok ? "Concluído" : "Falhou"} · {dateLabel(event.created_at)}</span></li>)}</ul>}
          </section>
        </div>
      </section>
    </div>
  );
}

type AIData = Awaited<ReturnType<typeof getAIProviderConfig>>;
type BitrixData = Awaited<ReturnType<typeof getBitrix>>;
type Provider = "openai" | "gemini";
type AIValidationResult = Awaited<ReturnType<typeof testAIProviderConnection>>;

function AIIntegration({ data }: { data: AIData }) {
  const queryClient = useQueryClient();
  const [provider, setProvider] = useState<Provider>(data.provider as Provider);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [analysisModel, setAnalysisModel] = useState(data.analysisModel);
  const [transcriptionModel, setTranscriptionModel] = useState(data.transcriptionModel);
  const [error, setError] = useState("");
  const [validation, setValidation] = useState<AIValidationResult | null>(null);
  const save = useServerFn(saveAIProviderConfig);
  const test = useServerFn(testAIProviderConnection);
  const disconnect = useServerFn(disconnectAIProvider);

  const saveMutation = useMutation({
    mutationFn: () => save({ data: { provider, apiKey: apiKey.trim(), analysisModel, transcriptionModel } }),
    onSuccess: async (result) => {
      setApiKey("");
      setError("");
      setValidation({ analysis: true, transcription: true, message: result.message, provider: result.provider, analysisModel: result.analysisModel, transcriptionModel: result.transcriptionModel, lastValidatedAt: result.lastValidatedAt });
      toast.success(result.message);
      await queryClient.invalidateQueries({ queryKey: ["ai-provider"] });
    },
    onError: (cause) => setError(cause instanceof Error ? cause.message : "Não foi possível salvar a conexão de IA."),
  });
  const testMutation = useMutation({
    mutationFn: () => test({ data: {} }),
    onSuccess: (result) => {
      setValidation(result);
      if (result.analysis && result.transcription) toast.success(result.message);
      else toast.error(result.message);
      void queryClient.invalidateQueries({ queryKey: ["ai-provider"] });
    },
    onError: (cause) => setError(cause instanceof Error ? cause.message : "Não foi possível testar a conexão."),
  });
  const disconnectMutation = useMutation({
    mutationFn: () => disconnect({ data: {} }),
    onSuccess: async () => {
      setApiKey("");
      setValidation(null);
      setError("");
      toast.success("Configuração de IA removida.");
      await queryClient.invalidateQueries({ queryKey: ["ai-provider"] });
    },
    onError: (cause) => setError(cause instanceof Error ? cause.message : "Não foi possível remover a conexão."),
  });
  const busy = saveMutation.isPending || testMutation.isPending || disconnectMutation.isPending;
  const canSave = Boolean(apiKey.trim()) || (data.hasApiKey && provider === data.provider);
  const setProviderAndDefaults = (value: string) => {
    const next = value as Provider;
    setProvider(next);
    setValidation(null);
    setAnalysisModel(next === "openai" ? "gpt-6-luna" : "gemini-3.8-flash");
    setTranscriptionModel(next === "openai" ? "gpt-transcribe" : "gemini-3.8-flash");
  };

  return <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-gradient-to-br from-card to-cyan-500/[0.06] p-4 sm:p-5">
      <div className="flex items-center gap-3"><div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-700 to-cyan-400 text-white shadow-md shadow-cyan-600/15"><BrainCircuit className="size-5"/></div><div><h2 className="text-lg font-semibold">Inteligência artificial</h2><p className="text-sm text-muted-foreground">Transcrição de áudio e análise de comentários</p></div></div>
      <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${data.isConfigured ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "bg-background text-muted-foreground"}`}>{data.isConfigured ? <CheckCircle2 className="size-3.5"/> : <XCircle className="size-3.5"/>}{data.isConfigured ? "Credencial salva" : "Configuração necessária"}</span>
    </div>
    <div className="space-y-6 p-4 sm:p-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-start gap-3 rounded-xl border bg-muted/15 p-3"><AudioLines className="mt-0.5 size-5 shrink-0 text-primary"/><div><p className="text-sm font-semibold">Transcrição de voz</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Converte áudio gravado na pesquisa pública em comentário editável. O áudio não é armazenado pelo REICHCSAT.</p></div></div>
        <div className="flex items-start gap-3 rounded-xl border bg-muted/15 p-3"><MessageSquareText className="mt-0.5 size-5 shrink-0 text-primary"/><div><p className="text-sm font-semibold">Análise de comentários</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Gera o briefing de recuperação com problema principal, necessidade, abordagem sugerida e próximos passos.</p></div></div>
      </div>

      {data.role !== "admin" ? <p className="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">Somente administradores podem configurar credenciais de IA. Status: {data.isConfigured ? "conexão configurada" : "sem conexão configurada"}.</p> : <>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2"><Label>Provedor de IA</Label><Choice label="Provedor" value={provider} onChange={setProviderAndDefaults} options={ [["openai","OpenAI"],["gemini","Google Gemini"]]}/><p className="text-xs text-muted-foreground">Ambos os provedores podem realizar análise textual e transcrição de áudio.</p></div>
          <div className="space-y-2"><Label htmlFor="ai-api-key">Chave de API</Label><div className="flex gap-2"><Input id="ai-api-key" type={showKey ? "text" : "password"} autoComplete="new-password" spellCheck={false} maxLength={500} value={apiKey} onChange={event=>setApiKey(event.target.value)} placeholder={data.hasApiKey && provider === data.provider ? "Chave salva — deixe vazio para manter" : "Cole sua chave de API"} className="min-w-0 font-mono"/><Button type="button" variant="outline" size="icon" aria-label={showKey ? "Ocultar chave" : "Mostrar chave"} onClick={()=>setShowKey(v=>!v)}>{showKey ? <EyeOff className="size-4"/> : <Eye className="size-4"/>}</Button></div><p className="text-xs text-muted-foreground">{data.hasApiKey && provider === data.provider ? "Por segurança, a chave existente nunca é exibida. Informe outra apenas para substituí-la." : "A chave será testada antes de ser salva e nunca será retornada ao navegador."}</p></div>
          <div className="space-y-2"><Label htmlFor="ai-analysis-model">Modelo para análise de texto</Label><Input id="ai-analysis-model" value={analysisModel} maxLength={100} onChange={event=>{setAnalysisModel(event.target.value);setValidation(null);}}/><p className="text-xs text-muted-foreground">OpenAI: gpt-6-luna · Gemini: gemini-3.8-flash (padrões atuais).</p></div>
          <div className="space-y-2"><Label htmlFor="ai-transcription-model">Modelo para transcrição de áudio</Label><Input id="ai-transcription-model" value={transcriptionModel} maxLength={100} onChange={event=>{setTranscriptionModel(event.target.value);setValidation(null);}}/><p className="text-xs text-muted-foreground">OpenAI: gpt-transcribe · Gemini: gemini-3.8-flash para entrada multimodal.</p></div>
        </div>
        <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:flex-wrap sm:items-center">
          <Button type="button" disabled={busy || !canSave || !analysisModel.trim() || !transcriptionModel.trim()} className="rounded-xl bg-gradient-to-r from-blue-700 via-sky-500 to-cyan-400 text-white hover:brightness-105" onClick={()=>{setError("");setValidation(null);saveMutation.mutate();}}><ShieldCheck className="mr-2 size-4"/>{saveMutation.isPending ? "Validando e salvando…" : "Validar e salvar conexão"}</Button>
          <Button type="button" variant="outline" disabled={busy || !data.isConfigured} className="rounded-xl" onClick={()=>{setError("");testMutation.mutate();}}><RefreshCw className={`mr-2 size-4 ${testMutation.isPending ? "animate-spin" : ""}`}/>{testMutation.isPending ? "Testando…" : "Testar conexão salva"}</Button>
          {data.isConfigured && <Button type="button" variant="ghost" disabled={busy} className="rounded-xl text-destructive" onClick={()=>{if(window.confirm("Remover a chave criptografada desta organização? Transcrição e análises por IA serão desativadas."))disconnectMutation.mutate();}}><Unplug className="mr-2 size-4"/>Desconectar IA</Button>}
        </div>
        {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
        {validation && <div role="status" className={`rounded-xl border p-4 ${validation.analysis && validation.transcription ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}><p className="flex items-center gap-2 font-semibold text-sm">{validation.analysis && validation.transcription ? <CheckCircle2 className="size-4"/> : <XCircle className="size-4"/>}{validation.message}</p><div className="mt-3 grid gap-2 sm:grid-cols-2"><p className="flex items-center gap-2 text-xs"><span className={validation.analysis ? "text-emerald-700" : "text-rose-700"}>{validation.analysis ? "✓" : "×"}</span>Modelo de análise: {validation.analysisModel}</p><p className="flex items-center gap-2 text-xs"><span className={validation.transcription ? "text-emerald-700" : "text-rose-700"}>{validation.transcription ? "✓" : "×"}</span>Modelo de transcrição: {validation.transcriptionModel}</p></div></div>}
        {data.lastValidatedAt && <p className="text-xs text-muted-foreground">Última validação aprovada: {dateLabel(data.lastValidatedAt)}.</p>}
      </>}

      <details className="rounded-xl border bg-muted/15 p-4">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold"><BookOpen className="size-4 text-primary"/>Tutorial: conectar a IA</summary>
        <div className="mt-4 space-y-5 text-sm leading-6 text-muted-foreground">
          <div><h3 className="font-semibold text-foreground">Opção A — OpenAI</h3><ol className="mt-2 list-decimal space-y-1.5 pl-5"><li>Acesse a plataforma da OpenAI e abra a área de chaves de API.</li><li>Crie uma chave de API para um projeto que tenha faturamento e acesso aos modelos habilitados.</li><li>Selecione “OpenAI”, mantenha os modelos sugeridos ou informe modelos aos quais sua conta tenha acesso.</li><li>Cole a chave e clique em “Validar e salvar conexão”. O REICHCSAT testa a análise textual e verifica a disponibilidade do modelo de transcrição antes de salvar.</li><li>Depois, teste a conexão salva e faça uma gravação curta em uma pesquisa ativa.</li></ol><a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 font-medium text-primary hover:underline">Abrir chaves de API da OpenAI <ExternalLink className="size-3.5"/></a></div>
          <div className="border-t pt-4"><h3 className="font-semibold text-foreground">Opção B — Google Gemini</h3><ol className="mt-2 list-decimal space-y-1.5 pl-5"><li>Abra o Google AI Studio e crie/seleciona uma credencial de API vinculada a um projeto Google Cloud com a API Gemini habilitada.</li><li>Confira se a chave tem as restrições apropriadas e se o projeto tem cota e faturamento necessários para os modelos escolhidos.</li><li>Selecione “Google Gemini”, confira os identificadores dos modelos e cole a chave de API.</li><li>Clique em “Validar e salvar conexão”. A validação faz uma chamada textual e verifica o modelo configurado para áudio.</li><li>Use “Testar conexão salva” para repetir a verificação depois de qualquer alteração na conta do provedor.</li></ol><a href="https://ai.google.dev/gemini-api/docs/api-key" target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 font-medium text-primary hover:underline">Guia oficial de chaves Gemini <ExternalLink className="size-3.5"/></a></div>
          <div className="flex items-start gap-2 border-t pt-4 text-xs"><KeyRound className="mt-0.5 size-4 shrink-0 text-primary"/><p>A chave é criptografada no servidor usando AES-256-GCM e fica vinculada à organização. Não é devolvida em consultas e não deve ser colocada em arquivos públicos, variáveis VITE_* ou mensagens. Chamadas de IA podem gerar custo e consumo de cota na conta do provedor.</p></div>
        </div>
      </details>
    </div>
  </section>;
}

function BitrixControls({ data }: { data: BitrixData }) {
  const [webhook,setWebhook]=useState("");
  const [error,setError]=useState("");
  const [type,setType]=useState<"lead"|"deal">("lead");
  const [id,setId]=useState("");
  const [result,setResult]=useState<Awaited<ReturnType<typeof testBitrixEntity>>|null>(null);
  const [tasks,setTasks]=useState(data.integration?.create_tasks ?? false);
  const [timeline,setTimeline]=useState(data.integration?.post_timeline ?? false);
  const qc=useQueryClient();
  const connect=useServerFn(connectBitrix);
  const disconnect=useServerFn(disconnectBitrix);
  const test=useServerFn(testBitrixEntity);
  const save=useServerFn(updateBitrixOptions);
  const mutation=useMutation({
    mutationFn:async(action:"connect"|"disconnect"|"test"|"save")=>{
      setResult(null);
      if(action==="connect"){await connect({data:{webhook:normalizeWebhook(webhook)}});setWebhook("");}
      if(action==="disconnect")await disconnect();
      if(action==="test"){
        if(!/^[1-9]\d{0,11}$/.test(id))throw new Error("Informe um ID CRM numérico válido.");
        setResult(await test({data:{type,id}}));
      }
      if(action==="save")await save({data:{create_tasks:tasks,post_timeline:timeline}});
    },
    onSuccess:()=>toast.success("Operação confirmada"),
    onError:e=>setError(e.message),
    onSettled:()=>qc.invalidateQueries({queryKey:["bitrix"]}),
  });
  const act=(action:"connect"|"disconnect"|"test"|"save")=>{setError("");mutation.mutate(action);};

  return <div className="space-y-6">
    {data.state!=="connected"&&<form className="max-w-2xl space-y-3" onSubmit={e=>{e.preventDefault();act("connect");}}>
      <Label htmlFor="bitrix-webhook">Webhook de entrada</Label>
      <Input id="bitrix-webhook" type="password" autoComplete="off" maxLength={500} value={webhook} onChange={e=>setWebhook(e.target.value)} placeholder="https://seuportal.bitrix24.com/rest/…" required/>
      <p className="text-xs text-muted-foreground">Informe a URL completa do webhook HTTPS do Bitrix24 Cloud. A credencial é armazenada em tabela protegida; o formulário nunca a exibe novamente.</p>
      <Button disabled={mutation.isPending}><Plug className="mr-2 size-4"/>{mutation.isPending?"Validando…":"Validar e conectar"}</Button>
    </form>}
    {data.state==="connected"&&<>
      <section className="space-y-4 rounded-xl border p-4">
        <h3 className="font-semibold">Sincronização das respostas</h3>
        <label className="flex items-start gap-3 text-sm"><Checkbox checked={tasks} onCheckedChange={v=>setTasks(v===true)}/><span><strong>Criar tarefas para respostas negativas</strong><span className="mt-0.5 block text-xs text-muted-foreground">O webhook precisa ter permissão para criar tarefas no Bitrix24.</span></span></label>
        <label className="flex items-start gap-3 text-sm"><Checkbox checked={timeline} onCheckedChange={v=>setTimeline(v===true)}/><span><strong>Registrar respostas na timeline CRM</strong><span className="mt-0.5 block text-xs text-muted-foreground">Adiciona a nota, o comentário e os detalhes da pesquisa ao registro vinculado.</span></span></label>
        <Button variant="outline" disabled={mutation.isPending} onClick={()=>act("save")}><Save className="mr-2 size-4"/>Salvar opções</Button>
      </section>
      <form className="max-w-2xl space-y-4 rounded-xl border p-4" onSubmit={e=>{e.preventDefault();act("test");}}>
        <h3 className="font-semibold">Testar entidade CRM</h3>
        <div className="grid gap-4 sm:grid-cols-2"><Choice label="Entidade" value={type} onChange={v=>setType(v as typeof type)} options={ [["lead","Lead"],["deal","Negócio"]]}/><div className="space-y-2"><Label htmlFor="crm-id">ID CRM</Label><Input id="crm-id" inputMode="numeric" maxLength={12} value={id} onChange={e=>setId(e.target.value)} required/></div></div>
        <Button variant="outline" disabled={mutation.isPending}><Search className="mr-2 size-4"/>Testar acesso</Button>
        {result&&<p role="status" className="break-words text-sm text-emerald-700">{result.title||"Entidade encontrada"} · Responsável: {result.assigned||"Não informado"} · Etapa: {result.stage||"Não informada"}</p>}
      </form>
    </>}
    {error&&<p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    {data.integration&&<div className="border-t pt-5"><Button variant="destructive" disabled={mutation.isPending} onClick={()=>{if(window.confirm("Desconectar o Bitrix24 e remover a credencial?"))act("disconnect");}}><Unplug className="mr-2 size-4"/>Desconectar e remover credencial</Button></div>}
  </div>;
}
