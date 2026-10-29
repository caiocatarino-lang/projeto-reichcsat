import { useMemo, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { queryOptions, useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity, BarChart3, CalendarDays, CircleHelp, Eye, Filter, MessageSquareText,
  RefreshCw, Search, SlidersHorizontal, Sparkles, Target, TrendingDown, TrendingUp, Users,
} from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, Tooltip, XAxis, YAxis,
} from 'recharts';
import { getResponseAnalytics, getResponses } from '@/lib/operations.functions';
import { filterSchema } from '@/lib/operations-schema';
import { pageHead } from '@/lib/workspace';
import { WorkspaceError, WorkspacePending } from '@/components/workspace-states';
import { Choice, Pager, EmptyRecords, dateLabel } from '@/components/operations-ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const options=(filters:ReturnType<typeof filterSchema.parse>)=>queryOptions({
  queryKey:['responses',filters],
  queryFn:()=>getResponses({data:filters}),
});
const analyticsOptions=(filters:ReturnType<typeof filterSchema.parse>)=>queryOptions({
  queryKey:['response-analytics',filters],
  queryFn:()=>getResponseAnalytics({data:filters}),
});
const number=(value:number|null, suffix='')=>value===null?'—':`${value.toLocaleString('pt-BR')}${suffix}`;
export const Route=createFileRoute('/_authenticated/responses')({
  validateSearch:(s)=>filterSchema.parse(s),
  loaderDeps:({search})=>search,
  loader:({context,deps})=>Promise.all([
    context.queryClient.ensureQueryData(options(deps)),
    context.queryClient.ensureQueryData(analyticsOptions(deps)),
  ]),
  head:()=>pageHead('Respostas','Explore visualmente as avaliações, os canais e a evolução das respostas do ReichCsat.'),
  component:Page,
  pendingComponent:WorkspacePending,
  errorComponent:WorkspaceError,
  notFoundComponent:EmptyRecords,
});

function Page(){
  const filters=Route.useSearch();
  const navigate=useNavigate();
  const queryClient=useQueryClient();
  const {data}=useSuspenseQuery(options(filters));
  const {data:analytics}=useSuspenseQuery(analyticsOptions(filters));
  const [selected,setSelected]=useState<(typeof data.rows)[number]|null>(null);
  const [refreshing,setRefreshing]=useState(false);

  const monthOptions=useMemo(()=>Array.from({length:12},(_,index)=>{
    const date=new Date();
    date.setDate(1);
    date.setMonth(date.getMonth()-index);
    const value=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
    return [value,date.toLocaleDateString('pt-BR',{month:'long',year:'numeric'})] as [string,string];
  }).reverse(),[]);

  const update=(patch:Partial<typeof filters>)=>navigate({
    to:'/responses',
    search:{...filters,...patch,page:patch.page ?? 1},
  });
  const clearFilters=()=>navigate({
    to:'/responses',
    search:{page:1,period:'all',q:'',month:undefined,survey:undefined,type:undefined,channel:undefined,sentiment:undefined,min:undefined,max:undefined,status:undefined},
  });
  const isFiltered=Boolean(filters.survey||filters.type||filters.channel||filters.sentiment||filters.month||filters.min!==undefined||filters.max!==undefined||filters.q||(filters.period!=='30'));
  const sentimentData=[
    {name:'Promotores',value:analytics.nps.promoters,fill:'var(--color-promoters)'},
    {name:'Neutros',value:analytics.nps.passives,fill:'var(--color-passives)'},
    {name:'Detratores',value:analytics.nps.detractors,fill:'var(--color-detractors)'},
  ];
  const stats=[
    {label:'Respostas',value:number(analytics.total),description:'Total no recorte selecionado',icon:MessageSquareText,style:'from-blue-600/10 to-cyan-500/5',iconStyle:'text-primary'},
    {label:'NPS',value:number(analytics.nps.score),description:`${number(analytics.nps.total)} respostas NPS`,icon:Activity,style:'from-violet-500/10 to-blue-500/5',iconStyle:'text-violet-500'},
    {label:'Promotores',value:number(analytics.nps.promoters),description:'Notas 9 e 10',icon:TrendingUp,style:'from-emerald-500/10 to-teal-500/5',iconStyle:'text-emerald-600'},
    {label:'Detratores',value:number(analytics.nps.detractors),description:'Notas de 0 a 6',icon:TrendingDown,style:'from-rose-500/10 to-orange-500/5',iconStyle:'text-rose-600'},
  ];
  const chartConfig={
    count:{label:'Respostas',color:'var(--primary)'},
    promoters:{label:'Promotores',color:'var(--success)'},
    passives:{label:'Neutros',color:'var(--warning)'},
    detractors:{label:'Detratores',color:'var(--destructive)'},
    whatsapp:{label:'WhatsApp',color:'var(--color-whatsapp)'},
    email:{label:'E-mail',color:'var(--color-email)'},
    sms:{label:'SMS',color:'var(--color-sms)'},
    publicLink:{label:'Link público',color:'var(--color-publicLink)'},
  };

  async function refreshData(){
    setRefreshing(true);
    try{
      await Promise.all([
        queryClient.invalidateQueries({queryKey:['responses']}),
        queryClient.invalidateQueries({queryKey:['response-analytics']}),
      ]);
    } finally { setRefreshing(false); }
  }

  return <div className="space-y-7 pb-16">
    <header className="relative isolate overflow-hidden rounded-3xl border bg-gradient-to-br from-card via-card to-primary/5 p-5 shadow-sm sm:p-7">
      <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-14 -z-10 size-52 rounded-full border border-primary/10" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-1 -top-7 -z-10 size-36 rounded-full border border-cyan-400/20" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary"><Sparkles className="size-3.5"/>Central analítica</span>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Respostas dos clientes</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Visualize volumes, canais de envio e a distribuição de promotores e detratores. Passe o cursor sobre os gráficos para consultar quantidades exatas.</p>
        </div>
        <Button variant="outline" className="rounded-xl bg-background/80 shadow-sm" disabled={refreshing} onClick={()=>void refreshData()}><RefreshCw className={`mr-2 size-4 ${refreshing?'animate-spin':''}`}/>{refreshing?'Atualizando':'Atualizar dados'}</Button>
      </div>
    </header>

    <section aria-label="Filtros globais" className="sticky top-2 z-20 rounded-2xl border bg-background/95 p-4 shadow-lg shadow-black/5 backdrop-blur-xl sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2"><div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary"><SlidersHorizontal className="size-4"/></div><div><h2 className="text-sm font-semibold">Filtros do painel</h2><p className="text-xs text-muted-foreground">Os gráficos e a listagem usam o mesmo recorte.</p></div></div>
        {isFiltered&&<Button type="button" variant="ghost" size="sm" className="h-8 rounded-full" onClick={clearFilters}>Limpar filtros</Button>}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Choice label="Pesquisa / campanha" value={filters.survey ?? 'all'} onChange={v=>update({survey:v==='all'?undefined:v})} options={ [['all','Todas as pesquisas'],...data.surveys.map(s=>[s.id,s.name] as [string,string])]}/>
        <Choice label="Tipo de pesquisa" value={filters.type ?? 'all'} onChange={v=>update({type:v==='all'?undefined:v as 'nps'|'csat',sentiment:undefined})} options={ [['all','NPS e CSAT'],['nps','NPS'],['csat','CSAT']]}/>
        <Choice label="Período" value={filters.period} onChange={v=>update({period:v as typeof filters.period,month:undefined})} options={ [['7','Últimos 7 dias'],['30','Últimos 30 dias'],['90','Últimos 90 dias'],['all','Todo o período']]}/>
        <Choice label="Mês específico" value={filters.month ?? 'all'} onChange={v=>update({month:v==='all'?undefined:v,period:v==='all'?filters.period:'all'})} options={ [['all','Todos os meses'],...monthOptions]}/>
        <Choice label="Canal de envio" value={filters.channel ?? 'all'} onChange={v=>update({channel:v==='all'?undefined:v as 'whatsapp'|'sms'|'email'|'link'})} options={ [['all','Todos os canais'],['whatsapp','WhatsApp'],['email','E-mail'],['sms','SMS'],['link','Link público']]}/>
      </div>
      <div className="mt-4 flex flex-col gap-3 border-t pt-4 md:flex-row md:items-end">
        <div className="min-w-0 flex-1 space-y-2"><Label htmlFor="response-search">Contato ou comentário</Label><form className="flex gap-2" onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);update({q:String(f.get('q')??'')});}}><div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><Input key={filters.q} id="response-search" name="q" defaultValue={filters.q} placeholder="Buscar por nome, e-mail ou comentário" maxLength={100} className="rounded-xl pl-9"/></div><Button type="submit" variant="secondary" className="rounded-xl">Buscar</Button></form></div>
        <div className="grid grid-cols-2 gap-3 md:w-64"><div className="space-y-2"><Label htmlFor="response-min">Nota mínima</Label><Input key={`min-${filters.min}`} id="response-min" type="number" min={0} max={10} placeholder="0" value={filters.min ?? ''} onChange={e=>update({min:e.target.value===''?undefined:Number(e.target.value)})} className="rounded-xl"/></div><div className="space-y-2"><Label htmlFor="response-max">Nota máxima</Label><Input key={`max-${filters.max}`} id="response-max" type="number" min={0} max={10} placeholder="10" value={filters.max ?? ''} onChange={e=>update({max:e.target.value===''?undefined:Number(e.target.value)})} className="rounded-xl"/></div></div>
        <div className="min-w-0 md:w-56"><Choice label="Classificação NPS" value={filters.sentiment ?? 'all'} onChange={v=>update({sentiment:v==='all'?undefined:v as 'promoter'|'passive'|'detractor',type:v==='all'?filters.type:'nps',min:undefined,max:undefined})} options={ [['all','Todos os perfis'],['promoter','Promotores · 9–10'],['passive','Neutros · 7–8'],['detractor','Detratores · 0–6']]}/></div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><Filter className="size-3.5"/>{number(analytics.total)} respostas correspondem aos filtros atuais{filters.month? ` · ${monthOptions.find(m=>m[0]===filters.month)?.[1] ?? filters.month}`:''}{filters.sentiment? ` · ${filters.sentiment==='promoter'?'Promotores':filters.sentiment==='passive'?'Neutros':'Detratores'}`:''}</div>
    </section>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores de respostas">
      {stats.map(s=><article key={s.label} className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br ${s.style} p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10`}>
        <div className="flex items-start justify-between gap-3"><div className="text-sm font-medium text-muted-foreground">{s.label}</div><div className={`flex size-10 items-center justify-center rounded-xl border bg-background/80 shadow-sm transition duration-200 group-hover:scale-110 ${s.iconStyle}`}><s.icon className="size-5"/></div></div>
        <p className="mt-6 text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">{s.value}</p><p className="mt-2 text-xs text-muted-foreground">{s.description}</p>
      </article>)}
    </section>

    <section className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(310px,0.9fr)]">
      <article className="min-w-0 rounded-2xl border bg-card p-4 shadow-sm transition hover:shadow-lg sm:p-5">
        <div className="mb-4 flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><CalendarDays className="size-4 text-primary"/><h2 className="font-semibold">Volume de respostas por mês</h2></div><p className="mt-1 text-xs text-muted-foreground">Passe sobre cada coluna para ver o total exato.</p></div><span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">{number(analytics.total)} respostas</span></div>
        {analytics.byMonth.length?<ChartContainer className="h-64 w-full sm:h-72" config={chartConfig}><BarChart data={analytics.byMonth} margin={{top:8,right:8,left:-18,bottom:4}}><CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3"/><XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} minTickGap={18}/><YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40}/><ChartTooltip cursor={{fill:'var(--primary)',opacity:0.08}} content={<ChartTooltipContent formatter={(value)=>[`${Number(value).toLocaleString('pt-BR')} respostas`,'Quantidade']}/>} /><Bar dataKey="count" name="Respostas" fill="var(--color-count)" radius={[8,8,2,2]} maxBarSize={48} activeBar={{stroke:'var(--primary)',strokeWidth:2}}/></BarChart></ChartContainer>:<ChartEmpty message="Não há respostas para o período selecionado."/>}
      </article>

      <article className="min-w-0 rounded-2xl border bg-card p-4 shadow-sm transition hover:shadow-lg sm:p-5">
        <div className="mb-4 flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><Users className="size-4 text-primary"/><h2 className="font-semibold">Promotores, neutros e detratores</h2></div><p className="mt-1 text-xs text-muted-foreground">Distribuição das respostas NPS no recorte selecionado.</p></div><span className="rounded-full bg-muted px-2.5 py-1 text-xs">{number(analytics.nps.total)} NPS</span></div>
        {analytics.nps.total?<div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-[minmax(0,1fr)_130px]"><ChartContainer className="mx-auto h-56 w-full max-w-[330px]" config={chartConfig}><PieChart><ChartTooltip content={<ChartTooltipContent formatter={(value,name)=>[`${Number(value).toLocaleString('pt-BR')} respostas`,String(name)]}/>} /><Pie data={sentimentData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={82} paddingAngle={4} strokeWidth={0} activeShape={{outerRadius:88}}>{sentimentData.map(item=><Cell key={item.name} fill={item.fill}/>)}</Pie></PieChart></ChartContainer><div className="space-y-4">{sentimentData.map((item,index)=><div key={item.name} className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-2"><span className={`size-2.5 shrink-0 rounded-full ${index===0?'bg-emerald-500':index===1?'bg-amber-500':'bg-rose-500'}`}/><div className="min-w-0"><p className="text-xs font-medium">{item.name}</p><p className="text-[11px] text-muted-foreground">{analytics.nps.total?Math.round(item.value/analytics.nps.total*100):0}%</p></div></div><p className="text-sm font-semibold tabular-nums">{number(item.value)}</p></div>)}</div></div>:<ChartEmpty message="Selecione NPS para visualizar a distribuição por perfil."/>}
      </article>
    </section>

    <section className="grid gap-5 xl:grid-cols-2">
      <article className="min-w-0 rounded-2xl border bg-card p-4 shadow-sm transition hover:shadow-lg sm:p-5">
        <div className="mb-4 flex items-center gap-2"><MessageSquareText className="size-4 text-primary"/><div><h2 className="font-semibold">Respostas por canal</h2><p className="mt-1 text-xs text-muted-foreground">Volume por canal no filtro selecionado.</p></div></div>
        {analytics.byChannel.length?<ChartContainer className="h-64 w-full" config={chartConfig}><BarChart data={analytics.byChannel} layout="vertical" margin={{top:4,right:16,left:2,bottom:2}}><CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3"/><XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false}/><YAxis type="category" dataKey="channel" width={92} tickLine={false} axisLine={false} tickMargin={8} tick={{fontSize:11}}/><ChartTooltip cursor={{fill:'var(--primary)',opacity:0.08}} content={<ChartTooltipContent formatter={(value)=>[`${Number(value).toLocaleString('pt-BR')} respostas`,'Quantidade']}/>} /><Bar dataKey="count" name="Respostas" radius={[0,7,7,0]} maxBarSize={28} activeBar={{stroke:'var(--primary)',strokeWidth:2}}>{analytics.byChannel.map((item,index)=><Cell key={item.channel} fill={item.channel==='WhatsApp'?'var(--color-whatsapp)':item.channel==='E-mail'?'var(--color-email)':item.channel==='SMS'?'var(--color-sms)':'var(--color-publicLink)'}/>)}</Bar></BarChart></ChartContainer>:<ChartEmpty message="Nenhuma resposta registrada por canal neste recorte."/>}
      </article>

      <article className="min-w-0 rounded-2xl border bg-card p-4 shadow-sm transition hover:shadow-lg sm:p-5">
        <div className="mb-4 flex items-center gap-2"><Target className="size-4 text-primary"/><div><h2 className="font-semibold">Volume por pesquisa</h2><p className="mt-1 text-xs text-muted-foreground">Cada barra representa uma pesquisa, com a quantidade exata no hover. Campanhas ainda não são cadastradas como entidade separada.</p></div></div>
        {analytics.bySurvey.length?<ChartContainer className="h-64 w-full" config={chartConfig}><BarChart data={analytics.bySurvey.slice(0,10)} layout="vertical" margin={{top:4,right:18,left:2,bottom:2}}><CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3"/><XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false}/><YAxis type="category" dataKey="name" width={140} tickLine={false} axisLine={false} tickMargin={8} tick={{fontSize:10}} interval={0}/><ChartTooltip cursor={{fill:'var(--primary)',opacity:0.08}} content={<ChartTooltipContent formatter={(value)=>[`${Number(value).toLocaleString('pt-BR')} respostas`,'Quantidade']}/>} /><Bar dataKey="count" name="Respostas" fill="var(--color-count)" radius={[0,7,7,0]} maxBarSize={26} activeBar={{stroke:'var(--primary)',strokeWidth:2}}/></BarChart></ChartContainer>:<ChartEmpty message="Ainda não existem respostas agrupadas por pesquisa."/>}
      </article>
    </section>

    <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4 sm:p-5"><div><h2 className="font-semibold">Respostas recebidas</h2><p className="mt-1 text-xs text-muted-foreground">Lista paginada com os mesmos filtros e detalhes por resposta.</p></div><span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">{number(data.count)} registros</span></div>
      {data.rows.length===0?<EmptyRecords/>:<div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-muted/40 text-xs text-muted-foreground"><tr>{['Nota / pesquisa','Contato','Comentário','Canal / Bitrix','Data',''].map((t,i)=><th key={i} className="border-b px-4 py-3 font-medium">{t}</th>)}</tr></thead><tbody>{data.rows.map(r=><tr key={r.id} className="border-b transition-colors hover:bg-primary/[0.035]"><td className="px-4 py-4"><span className={r.is_negative?'font-semibold text-destructive':'font-semibold text-primary'}>{r.score} · {r.survey_type.toUpperCase()}</span><p className="mt-1 max-w-48 break-words text-xs text-muted-foreground">{r.surveys.name}</p></td><td className="max-w-48 break-words px-4">{r.contact_name || r.contact_email || 'Não informado'}</td><td className="max-w-64 px-4"><p className="line-clamp-2 break-words">{r.comment || 'Sem comentário'}</p></td><td className="px-4"><span className="rounded-full border px-2 py-1 text-xs">{r.channel}</span><p className="mt-1 text-xs text-muted-foreground">{r.bitrix_synced?'Sincronizada':r.bitrix_entity_id?'Não sincronizada':'Sem vínculo CRM'}</p></td><td className="whitespace-nowrap px-4 text-xs text-muted-foreground">{dateLabel(r.created_at)}</td><td className="pr-3"><Button size="icon" variant="ghost" className="rounded-xl" aria-label="Ver resposta" onClick={()=>setSelected(r)}><Eye/></Button></td></tr>)}</tbody></table></div>}
      <div className="px-4 pb-4 sm:px-5"><Pager page={filters.page} count={data.count} change={page=>update({page})}/></div>
    </section>

    {selected&&<Dialog open onOpenChange={o=>!o&&setSelected(null)}><DialogContent className="max-h-[85dvh] overflow-y-auto"><DialogHeader><DialogTitle>Resposta · {selected.survey_type.toUpperCase()} {selected.score}</DialogTitle><DialogDescription>{selected.surveys.name}</DialogDescription></DialogHeader><dl className="space-y-4 break-words">{[['Contato',selected.contact_name],['E-mail',selected.contact_email],['Comentário',selected.comment],['Responsável',selected.responsible],['Atendimento',selected.service_type],['Canal',selected.channel],['Recebida em',dateLabel(selected.created_at)],['CRM',selected.bitrix_entity_id?`${selected.bitrix_entity_type} #${selected.bitrix_entity_id}`:null],['Sincronização Bitrix',selected.bitrix_synced?'Sincronizada':'Não sincronizada']].map(([label,value])=><div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 whitespace-pre-wrap">{value || 'Não informado'}</dd></div>)}</dl></DialogContent></Dialog>}
  </div>;
}

function ChartEmpty({message}:{message:string}){
  return <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 px-5 text-center"><div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><CircleHelp className="size-5"/></div><p className="mt-3 text-sm text-muted-foreground">{message}</p></div>;
}
