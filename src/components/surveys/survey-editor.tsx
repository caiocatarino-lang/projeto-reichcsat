import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Eye, Mail, MessageCircle, Save, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { saveSurvey } from "@/lib/workspace.functions";
import { surveySchema, type DeliveryChannels, type SurveyInput } from "@/lib/survey-schema";
import { toast } from "sonner";

export function SurveyPreview({ survey }: { survey: SurveyInput }) {
  const [score, setScore] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  return <div className="py-6">
    <p className="text-xs font-semibold uppercase text-primary">{survey.type.toUpperCase()}</p>
    <h3 className="mt-4 break-words text-xl font-semibold">{answered ? survey.thank_you : survey.question}</h3>
    {!answered && <><div className="mt-6 grid grid-cols-6 gap-2 sm:grid-cols-11">
      {Array.from({ length: survey.type === "nps" ? 11 : survey.csat_scale }, (_, i) => survey.type === "nps" ? i : i + 1).map((n) => <Button key={n} variant={score === n ? "default" : "outline"} className="px-0" onClick={() => setScore(n)}>{n}</Button>)}
    </div><div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>{survey.type === "nps" ? "Nada provável" : "Muito insatisfeito"}</span><span>{survey.type === "nps" ? "Muito provável" : "Muito satisfeito"}</span></div>
    <Label htmlFor="preview-comment" className="mt-6 block">{survey.comment_prompt}</Label><Textarea id="preview-comment" className="mt-2" />
    <Button className="mt-4" disabled={score === null} onClick={() => setAnswered(true)}>Enviar resposta de prévia</Button></>}
    {answered && <Button variant="ghost" className="mt-4" onClick={() => { setAnswered(false); setScore(null); }}>Voltar à prévia</Button>}
  </div>;
}

export function SurveyEditor({ initial, locked, close }: { initial: SurveyInput; locked: boolean; close: () => void }) {
  const [form, setForm] = useState(initial);
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState("");
  const qc = useQueryClient();
  const save = useServerFn(saveSurvey);
  const mutation = useMutation({ mutationFn: (data: SurveyInput) => save({ data }), onSuccess: async () => { await qc.invalidateQueries({ queryKey: ["workspace"] }); toast.success("Pesquisa salva"); close(); }, onError: (e) => setError(e.message) });

  function field<K extends keyof SurveyInput>(key: K, value: SurveyInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }
  function updateWhatsApp(patch: Partial<DeliveryChannels["whatsapp"]>) {
    setForm((current) => ({ ...current, delivery_channels: { ...current.delivery_channels, whatsapp: { ...current.delivery_channels.whatsapp, ...patch } } }));
  }
  function updateSms(patch: Partial<DeliveryChannels["sms"]>) {
    setForm((current) => ({ ...current, delivery_channels: { ...current.delivery_channels, sms: { ...current.delivery_channels.sms, ...patch } } }));
  }
  function updateEmail(patch: Partial<DeliveryChannels["email"]>) {
    setForm((current) => ({ ...current, delivery_channels: { ...current.delivery_channels, email: { ...current.delivery_channels.email, ...patch } } }));
  }

  return <Dialog open onOpenChange={(open) => { if (!open && !mutation.isPending) close(); }}><DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto"><DialogHeader><DialogTitle>{initial.id ? "Editar pesquisa" : "Nova pesquisa"}</DialogTitle><DialogDescription>{preview ? "Prévia · nenhuma resposta será registrada" : "Pesquisa NPS / CSAT"}</DialogDescription></DialogHeader>
    {preview ? <SurveyPreview survey={form} /> : <form id="survey-form" className="space-y-4" onSubmit={(e) => { e.preventDefault(); const parsed = surveySchema.safeParse(form); if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Verifique os campos"); return; } setError(""); mutation.mutate(parsed.data); }}>
      <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="survey-name">Nome da pesquisa</Label><Input id="survey-name" required maxLength={160} value={form.name} onChange={(e) => field("name", e.target.value)} /></div>
      <div className="space-y-2"><Label>Tipo</Label><Select value={form.type} disabled={locked} onValueChange={(v: "nps" | "csat") => { setForm((f) => ({ ...f, type: v, question: v === "nps" ? "De 0 a 10, quanto você recomendaria nossa empresa?" : "Como você avalia o atendimento recebido?" })); }}><SelectTrigger aria-label="Tipo de pesquisa"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="nps">NPS · Recomendação</SelectItem><SelectItem value="csat">CSAT · Satisfação</SelectItem></SelectContent></Select></div></div>
      <div className="space-y-2"><Label htmlFor="survey-question">Pergunta</Label><Textarea id="survey-question" required maxLength={500} value={form.question} onChange={(e) => field("question", e.target.value)} /></div>
      {form.type === "csat" && <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="survey-scale">Escala máxima</Label><Select disabled={locked} value={String(form.csat_scale)} onValueChange={(v) => field("csat_scale", v === "10" ? 10 : 5)}><SelectTrigger id="survey-scale"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="5">5</SelectItem><SelectItem value="10">10</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label htmlFor="survey-threshold">Satisfeito a partir de</Label><Input id="survey-threshold" type="number" min={1} max={form.csat_scale} disabled={locked} value={form.csat_threshold} onChange={(e) => field("csat_threshold", Number(e.target.value))} /></div></div>}
      <div className="space-y-2"><Label htmlFor="survey-service">Tipo de atendimento</Label><Input id="survey-service" maxLength={120} value={form.service_type} onChange={(e) => field("service_type", e.target.value)} /></div>
      <div className="space-y-2"><Label htmlFor="survey-comment">Convite ao comentário</Label><Input id="survey-comment" required maxLength={500} value={form.comment_prompt} onChange={(e) => field("comment_prompt", e.target.value)} /></div>
      <div className="space-y-2"><Label htmlFor="survey-thanks">Mensagem de agradecimento</Label><Textarea id="survey-thanks" required maxLength={500} value={form.thank_you} onChange={(e) => field("thank_you", e.target.value)} /></div>

      <section className="space-y-4 border-t pt-5">
        <div>
          <h3 className="text-base font-semibold">Canais de envio e mensagens</h3>
          <p className="mt-1 text-sm text-muted-foreground">Escolha os canais para esta pesquisa e personalize um modelo de mensagem para cada um.</p>
        </div>

        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex items-start gap-3">
            <Checkbox id="channel-whatsapp" checked={form.delivery_channels.whatsapp.enabled} onCheckedChange={(checked) => updateWhatsApp({ enabled: checked === true })} />
            <MessageCircle className="mt-0.5 size-5 text-primary" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <Label htmlFor="channel-whatsapp">WhatsApp</Label>
              <p className="text-sm text-muted-foreground">Texto curto e próximo, ideal para uma abordagem rápida.</p>
            </div>
          </div>
          <Label htmlFor="whatsapp-message">Mensagem modelo</Label>
          <Textarea id="whatsapp-message" maxLength={500} value={form.delivery_channels.whatsapp.message} onChange={(e) => updateWhatsApp({ message: e.target.value })} />
          <p className="text-xs text-muted-foreground">{form.delivery_channels.whatsapp.message.length}/500 caracteres. Use uma mensagem objetiva e um link direto para a pesquisa.</p>
        </div>

        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex items-start gap-3">
            <Checkbox id="channel-sms" checked={form.delivery_channels.sms.enabled} onCheckedChange={(checked) => updateSms({ enabled: checked === true })} />
            <Smartphone className="mt-0.5 size-5 text-primary" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <Label htmlFor="channel-sms">SMS</Label>
              <p className="text-sm text-muted-foreground">Mensagem bem simples para caber em um texto curto.</p>
            </div>
          </div>
          <Label htmlFor="sms-message">Mensagem modelo</Label>
          <Textarea id="sms-message" maxLength={320} value={form.delivery_channels.sms.message} onChange={(e) => updateSms({ message: e.target.value })} />
          <p className="text-xs text-muted-foreground">{form.delivery_channels.sms.message.length}/320 caracteres. O tamanho final pode variar conforme o link gerado.</p>
        </div>

        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex items-start gap-3">
            <Checkbox id="channel-email" checked={form.delivery_channels.email.enabled} onCheckedChange={(checked) => updateEmail({ enabled: checked === true })} />
            <Mail className="mt-0.5 size-5 text-primary" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <Label htmlFor="channel-email">E-mail</Label>
              <p className="text-sm text-muted-foreground">Texto mais completo, com contexto e agradecimento.</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-subject">Assunto</Label>
            <Input id="email-subject" maxLength={180} value={form.delivery_channels.email.subject} onChange={(e) => updateEmail({ subject: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-message">Mensagem modelo</Label>
            <Textarea id="email-message" maxLength={3000} rows={7} value={form.delivery_channels.email.message} onChange={(e) => updateEmail({ message: e.target.value })} />
            <p className="text-xs text-muted-foreground">{form.delivery_channels.email.message.length}/3.000 caracteres.</p>
          </div>
        </div>

        <div className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Personalização dos textos</p>
          <p className="mt-1">Os modelos incluem marcadores como <code>{"{{nome}}"}</code>, <code>{"{{empresa}}"}</code> e <code>{"{{link_pesquisa}}"}</code> para indicar onde dados poderão entrar futuramente.</p>
          <p className="mt-2">Nesta etapa, os textos ficam salvos na configuração da pesquisa. O envio automático pelos canais e a substituição dos marcadores ainda dependem da integração de disparo.</p>
        </div>
      </section>
    </form>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex flex-wrap justify-end gap-2 border-t pt-4"><Button variant="outline" onClick={() => setPreview(!preview)}><Eye />{preview ? "Voltar à edição" : "Prévia"}</Button><Button type="submit" form="survey-form" disabled={mutation.isPending || preview}><Save />{mutation.isPending ? "Salvando…" : "Salvar pesquisa"}</Button></div>
  </DialogContent></Dialog>;
}
