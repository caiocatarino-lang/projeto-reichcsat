import { useState } from 'react';
import { createFileRoute,useNavigate } from '@tanstack/react-router';
import { queryOptions,useSuspenseQuery,useMutation,useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import {
  AlertTriangle, ArrowRight, BrainCircuit, CheckCircle2, ClipboardCheck, Clock3,
  FileText, HeartHandshake, MessageCircle, Pencil, RefreshCw, Save, Sparkles,
  UserRound, WandSparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { getCases,saveCase } from '@/lib/operations.functions';
import { generateCaseBriefing } from '@/lib/case-ai.functions';
import { caseAiBriefingSchema } from '@/lib/case-ai-schema';
import { caseSchema,filterSchema } from '@/lib/operations-schema';
import { caseStatusLabel } from '@/lib/org';
import { pageHead } from '@/lib/workspace';
import { Choice,Pager,EmptyRecords,dateLabel } from '@/components/operations-ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription } from '@/components/ui/dialog';

const options=(f:ReturnType<typeof filterSchema.parse>)=>queryOptions({queryKey:['cases',f],queryFn:()=>getCases({data:f})});
export const Route=createFileRoute('/_authenticated/cases')({
  validateSearch:s=>filterSchema.parse(s),
  loaderDeps:({search})=>search,
  loader:({context,deps})=>context.queryClient.ensureQueryData(options(deps)),
  head:()=>pageHead('Tratativas','Recupere clientes insatisfeitos com briefings e recomendações de IA.'),
  component:Page,
});
type Row=Awaited<ReturnType<typeof getCases>>['rows'][number];
type Briefing=ReturnType<typeof caseAiBriefingSchema.parse>;

const sentimentLabel:Record<Briefing['sentiment'],string>={
  frustrated:'Frustrado',
  angry:'Irritado',
  disappointed:'Decepcionado',
  confused:'Confuso',
  neutral:'Neutro',
  unclear:'Não identificado',
};
const approachLabel:Record<Briefing['approach'],string>={
  empathetic:'Empático',
  objective:'Objetivo',
  technical:'Técnico',
  proactive:'Proativo',
};
function parseBriefing(value:unknown):Briefing|null{
  const result=caseAiBriefingSchema.safeParse(value);
  return result.success?result.data:null;
}
function severity(row:Row){
  if(row.responses.survey_type==='nps'){
    if(row.responses.score<=3)return {label:'Prioridade alta',style:'border-rose-200 bg-rose-50 text-rose-700'};
    if(row.responses.score<=6)return {label:'Atenção',style:'border-amber-200 bg-amber-50 text-amber-700'};
    return {label:'Revisar',style:'border-slate-200 bg-slate-50 text-slate-700'};
  }
  if(row.responses.score<=2)return {label:'Prioridade alta',style:'border-rose-200 bg-rose-50 text-rose-700'};
  return {label:'Atenção',style:'border-amber-200 bg-amber-50 text-amber-700'};
}

function Page(){
  const f=Route.useSearch();
  const navigate=useNavigate();
  const queryClient=useQueryClient();
  const {data}=useSuspenseQuery(options(f));
  const [selected,setSelected]=useState<Row|null>(null);
  const generate=useServerFn(generateCaseBriefing);
  const aiMutation=useMutation({
    mutationFn:(caseId:string)=>generate({data:{caseId}}),
    onSuccess:async()=>{
      toast.success('Briefing de recuperação gerado e salvo.');
      await queryClient.invalidateQueries({queryKey:['cases']});
    },
    onError:(error)=>toast.error(error.message||'Não foi possível gerar o briefing.'),
  });
  const updateStatus=(value:string)=>navigate({to:'/cases',search:{...f,status:value==='all'?undefined:value as typeof f.status,page:1}});
  const openCases=data.rows.filter(c=>c.status!=='resolved').length;
  const unassigned=data.rows.filter(c=>!c.assignee).length;
  const briefed=data.rows.filter(c=>parseBriefing(c.ai_briefing)).length;
  const stats=[
    {label:'Casos encontrados',value:data.count,description:'Total no filtro atual',icon:FileText,style:'text-primary bg-primary/10'},
    {label:'Aguardando recuperação',value:openCases,description:'Nesta página',icon:Clock3,style:'text-amber-600 bg-amber-500/10'},
    {label:'Sem responsável',value:unassigned,description:'Nesta página',icon:UserRound,style:'text-rose-600 bg-rose-500/10'},
    {label:'Com briefing de IA',value:briefed,description:'Nesta página',icon:BrainCircuit,style:'text-emerald-600 bg-emerald-500/10'},
  ];
  const refresh=()=>queryClient.invalidateQueries({queryKey:['cases']});

  return <div className="space-y-7 pb-12">
    <header className="relative isolate overflow-hidden rounded-3xl border bg-gradient-to-br from-card via-card to-primary/5 p-5 shadow-sm sm:p-7">
      <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-12 -z-10 size-52 rounded-full border border-primary/10"/>
      <div aria-hidden="true" className="pointer-events-none absolute -right-1 -top-6 -z-10 size-36 rounded-full border border-cyan-400/20"/>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary"><HeartHandshake className="size-3.5"/>Customer Recovery</span>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Tratativas inteligentes</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Transforme avaliações negativas em próximos passos claros: entenda o problema, prepare a conversa e acompanhe a recuperação do cliente.</p>
        </div>
        <Button variant="outline" className="rounded-xl bg-background/80 shadow-sm" onClick={()=>void refresh()}><RefreshCw className="mr-2 size-4"/>Atualizar</Button>
      </div>
    </header>

    {!data.aiAvailable&&<div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
      <div className="mt-0.5 rounded-xl bg-amber-100 p-2"><BrainCircuit className="size-5 text-amber-700"/></div>
      <div className="min-w-0">
        <p className="text-sm font-semibold">A conexão com a IA precisa ser configurada</p>
        <p className="mt-1 text-sm leading-6 text-amber-900/80">A interface está pronta, mas o provedor ainda não está conectado neste ambiente. Para gerar briefings reais, configure a chave <code className="rounded bg-amber-100 px-1 py-0.5">OPENAI_API_KEY</code> como segredo de servidor no Lovable Cloud. A chave não deve ficar no código do navegador.</p>
      </div>
    </div>}

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumo das tratativas">
      {stats.map(s=><article key={s.label} className="group rounded-2xl border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg sm:p-5">
        <div className="flex items-start justify-between gap-3"><p className="text-sm font-medium text-muted-foreground">{s.label}</p><span className={`flex size-10 items-center justify-center rounded-xl ${s.style}`}><s.icon className="size-5"/></span></div>
        <p className="mt-5 text-3xl font-semibold tabular-nums">{s.value.toLocaleString('pt-BR')}</p><p className="mt-1 text-xs text-muted-foreground">{s.description}</p>
      </article>)}
    </section>

    <section className="sticky top-2 z-20 rounded-2xl border bg-background/95 p-4 shadow-lg shadow-black/5 backdrop-blur-xl sm:p-5">
      <div className="mb-3 flex items-center gap-2"><div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary"><ClipboardCheck className="size-4"/></div><div><h2 className="text-sm font-semibold">Fila de recuperação</h2><p className="text-xs text-muted-foreground">Priorize por nota, acompanhe o responsável e abra o briefing.</p></div></div>
      <div className="max-w-xs"><Choice label="Status da tratativa" value={f.status??'all'} options={ [['all','Todos os status'],...Object.entries(caseStatusLabel)]} onChange={updateStatus}/></div>
    </section>

    {!data.rows.length?<div className="rounded-2xl border bg-card"><EmptyRecords cases/></div>:<div className="grid min-w-0 gap-4 2xl:grid-cols-2">
      {data.rows.map(c=>{
        const briefing=parseBriefing(c.ai_briefing);
        const level=severity(c);
        const pending=aiMutation.isPending&&aiMutation.variables===c.id;
        return <article key={c.id} className="min-w-0 overflow-hidden rounded-2xl border bg-card shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/5">
          <div className="flex flex-wrap items-start gap-4 border-b bg-gradient-to-br from-card to-primary/[0.035] p-4 sm:p-5">
            <div className={`flex size-14 shrink-0 flex-col items-center justify-center rounded-2xl border text-center ${level.style}`}>
              <span className="text-xl font-bold leading-tight">{c.responses.score}</span><span className="text-[10px] font-semibold">{c.responses.survey_type.toUpperCase()}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${level.style}`}>{level.label}</span><span className="rounded-full border bg-background px-2.5 py-1 text-[11px] text-muted-foreground">{caseStatusLabel[c.status]}</span></div>
              <h2 className="mt-3 break-words text-base font-semibold">{c.responses.contact_name||c.responses.contact_email||'Cliente sem identificação'}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{dateLabel(c.created_at)} · Canal: {c.responses.channel||'link'} · Responsável: {c.assignee||'Não atribuído'}</p>
            </div>
            <Button type="button" variant="outline" size="icon" className="rounded-xl" aria-label="Editar tratativa" title="Editar tratativa" onClick={()=>setSelected(c)}><Pencil className="size-4"/></Button>
          </div>

          <div className="space-y-4 p-4 sm:p-5">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><MessageCircle className="size-3.5"/>Relato original</div>
              <blockquote className="rounded-xl border-l-2 border-primary/40 bg-muted/35 px-4 py-3 text-sm leading-6 text-foreground/85">{c.responses.comment?.trim()?c.responses.comment:'O cliente não deixou comentário textual. Será necessário perguntar e confirmar o motivo da nota.'}</blockquote>
            </div>

            {briefing?<div className="rounded-2xl border border-cyan-300/30 bg-gradient-to-br from-sky-50/70 via-card to-cyan-50/40 p-4 dark:from-sky-950/20 dark:to-cyan-950/10 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2"><span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-700 to-cyan-400 text-white shadow-md shadow-cyan-600/20"><Sparkles className="size-4"/></span><div><h3 className="font-semibold">Briefing de recuperação</h3><p className="text-xs text-muted-foreground">{c.ai_generated_at ? 'Gerado em '+dateLabel(c.ai_generated_at) : 'Gerado por IA'}</p></div></div>
                <Button type="button" size="sm" variant="outline" className="rounded-xl" disabled={aiMutation.isPending} onClick={()=>aiMutation.mutate(c.id)}><WandSparkles className="mr-1.5 size-3.5"/>Refazer briefing</Button>
              </div>
              <p className="mt-4 text-sm leading-6">{briefing.summary}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border bg-background/75 p-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Problema principal</p><p className="mt-1.5 text-sm leading-5">{briefing.main_issue}</p></div>
                <div className="rounded-xl border bg-background/75 p-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Necessidade provável</p><p className="mt-1.5 text-sm leading-5">{briefing.customer_need}</p></div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2"><span className="rounded-full border bg-background px-3 py-1 text-xs">Sinal do texto: {sentimentLabel[briefing.sentiment]}</span><span className="rounded-full border bg-background px-3 py-1 text-xs">Urgência: {briefing.urgency==='high'?'Alta':briefing.urgency==='medium'?'Média':'Baixa'}</span><span className="rounded-full border bg-background px-3 py-1 text-xs">Abordagem: {approachLabel[briefing.approach]}</span></div>
              <div className="mt-4 rounded-xl border border-primary/15 bg-primary/[0.04] p-4"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary"><MessageCircle className="size-3.5"/>Sugestão de abertura</p><p className="mt-2 text-sm leading-6">“{briefing.suggested_opening}”</p></div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div><p className="mb-2 flex items-center gap-2 text-sm font-semibold"><CheckCircle2 className="size-4 text-emerald-600"/>Próximos passos</p><ul className="space-y-2">{briefing.recommended_actions.map((action,i)=><li key={i} className="flex gap-2 text-sm leading-5"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-500"/><span>{action}</span></li>)}</ul></div>
                <div><p className="mb-2 flex items-center gap-2 text-sm font-semibold"><AlertTriangle className="size-4 text-amber-600"/>Evitar na conversa</p><ul className="space-y-2">{briefing.avoid.map((item,i)=><li key={i} className="flex gap-2 text-sm leading-5"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-500"/><span>{item}</span></li>)}</ul></div>
              </div>
              {briefing.evidence_quote&&<p className="mt-4 border-t pt-3 text-xs italic text-muted-foreground">Referência no comentário: “{briefing.evidence_quote}”</p>}
              <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-4 text-muted-foreground"><BrainCircuit className="mt-0.5 size-3.5 shrink-0"/>Análise sugerida pela IA; confirme os fatos com o cliente antes de tomar decisões.</p>
            </div>:<div className="rounded-2xl border border-dashed p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><BrainCircuit className="size-5"/></span><div><h3 className="font-semibold">Briefing ainda não gerado</h3><p className="mt-1 max-w-lg text-sm leading-5 text-muted-foreground">Resuma a reclamação, identifique a necessidade e prepare uma abertura de conversa com recomendações práticas.</p></div></div>
                <Button type="button" className="shrink-0 rounded-xl bg-gradient-to-r from-blue-700 via-sky-500 to-cyan-400 text-white shadow-md shadow-cyan-600/15 hover:brightness-105" disabled={pending} onClick={()=>aiMutation.mutate(c.id)}><WandSparkles className="mr-2 size-4"/>{pending?'Analisando…':'Gerar briefing com IA'}<ArrowRight className="ml-1 size-4"/></Button>
              </div>
            </div>}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <p className="text-xs text-muted-foreground">Notas internas: {c.notes?.trim()?'Registradas':'Nenhuma nota registrada'}</p>
              <Button type="button" variant="ghost" size="sm" className="rounded-xl" onClick={()=>setSelected(c)}>Atualizar status e responsável <ArrowRight className="ml-1 size-3.5"/></Button>
            </div>
          </div>
        </article>;
      })}
    </div>}

    <Pager page={f.page} count={data.count} change={page=>navigate({to:'/cases',search:{...f,page}})}/>
    {selected&&<Editor row={selected} close={()=>setSelected(null)}/>}
  </div>;
}

function Editor({row,close}:{row:Row;close:()=>void}){
  const [form,setForm]=useState({id:row.id,status:row.status,assignee:row.assignee ?? '',notes:row.notes ?? ''});
  const [error,setError]=useState('');
  const qc=useQueryClient();
  const save=useServerFn(saveCase);
  const mutation=useMutation({
    mutationFn:(d:typeof form)=>save({data:d}),
    onSuccess:async()=>{
      await qc.invalidateQueries({queryKey:['cases']});
      await qc.invalidateQueries({queryKey:['workspace']});
      toast.success('Tratativa atualizada.');
      close();
    },
    onError:e=>setError(e.message),
  });
  return <Dialog open onOpenChange={o=>!o&& !mutation.isPending&&close()}><DialogContent className="max-h-[85dvh] overflow-y-auto rounded-2xl"><DialogHeader><DialogTitle>Editar tratativa</DialogTitle><DialogDescription>{row.responses.survey_type.toUpperCase()} · Nota {row.responses.score}</DialogDescription></DialogHeader>
    <p className="whitespace-pre-wrap break-words rounded-xl bg-muted/40 p-3 text-sm">{row.responses.comment || 'Sem comentário textual.'}</p>
    <form className="space-y-4" onSubmit={e=>{e.preventDefault();const parsed=caseSchema.safeParse(form);if(!parsed.success){setError(parsed.error.issues[0]?.message ?? 'Verifique os campos');return;}setError('');mutation.mutate(parsed.data);}}>
      <div className="space-y-2"><Label>Status da tratativa</Label><Choice label="Status" value={form.status} options={Object.entries(caseStatusLabel)} onChange={v=>setForm({...form,status:v as typeof form.status})}/></div>
      <div className="space-y-2"><Label htmlFor="assignee">Responsável pela recuperação</Label><Input id="assignee" maxLength={120} value={form.assignee} onChange={e=>setForm({...form,assignee:e.target.value})} placeholder="Nome do colaborador"/></div>
      <div className="space-y-2"><Label htmlFor="case-notes">Notas internas / retorno combinado</Label><Textarea id="case-notes" maxLength={5000} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} rows={4} placeholder="Registre o que foi apurado e o próximo compromisso com o cliente."/></div>
      {error&&<p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      <Button disabled={mutation.isPending} className="w-full rounded-xl"><Save className="mr-2 size-4"/>{mutation.isPending?'Salvando…':'Salvar tratativa'}</Button>
    </form>
  </DialogContent></Dialog>;
}
