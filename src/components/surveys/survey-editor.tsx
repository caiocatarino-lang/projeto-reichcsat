import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Eye, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { saveSurvey } from "@/lib/workspace.functions";
import { surveySchema, type SurveyInput } from "@/lib/survey-schema";
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
  function field<K extends keyof SurveyInput>(key: K, value: SurveyInput[K]) { setForm((f) => ({ ...f, [key]: value })); }
  return <Dialog open onOpenChange={(open) => { if (!open && !mutation.isPending) close(); }}><DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto"><DialogHeader><DialogTitle>{initial.id ? "Editar pesquisa" : "Nova pesquisa"}</DialogTitle><DialogDescription>{preview ? "Prévia · nenhuma resposta será registrada" : "Pesquisa NPS / CSAT"}</DialogDescription></DialogHeader>
    {preview ? <SurveyPreview survey={form} /> : <form id="survey-form" className="space-y-4" onSubmit={(e) => { e.preventDefault(); const parsed = surveySchema.safeParse(form); if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Verifique os campos"); return; } setError(""); mutation.mutate(parsed.data); }}>
      <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="survey-name">Nome da pesquisa</Label><Input id="survey-name" required maxLength={160} value={form.name} onChange={(e) => field("name", e.target.value)} /></div>
      <div className="space-y-2"><Label>Tipo</Label><Select value={form.type} disabled={locked} onValueChange={(v: "nps" | "csat") => { setForm((f) => ({ ...f, type: v, question: v === "nps" ? "De 0 a 10, quanto você recomendaria nossa empresa?" : "Como você avalia o atendimento recebido?" })); }}><SelectTrigger aria-label="Tipo de pesquisa"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="nps">NPS · Recomendação</SelectItem><SelectItem value="csat">CSAT · Satisfação</SelectItem></SelectContent></Select></div></div>
      <div className="space-y-2"><Label htmlFor="survey-question">Pergunta</Label><Textarea id="survey-question" required maxLength={500} value={form.question} onChange={(e) => field("question", e.target.value)} /></div>
      {form.type === "csat" && <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="survey-scale">Escala máxima</Label><Input id="survey-scale" type="number" min={2} max={10} disabled={locked} value={form.csat_scale} onChange={(e) => field("csat_scale", Number(e.target.value))} /></div><div className="space-y-2"><Label htmlFor="survey-threshold">Satisfeito a partir de</Label><Input id="survey-threshold" type="number" min={1} max={form.csat_scale} disabled={locked} value={form.csat_threshold} onChange={(e) => field("csat_threshold", Number(e.target.value))} /></div></div>}
      <div className="space-y-2"><Label htmlFor="survey-service">Tipo de atendimento</Label><Input id="survey-service" maxLength={120} value={form.service_type} onChange={(e) => field("service_type", e.target.value)} /></div>
      <div className="space-y-2"><Label htmlFor="survey-comment">Convite ao comentário</Label><Input id="survey-comment" required maxLength={500} value={form.comment_prompt} onChange={(e) => field("comment_prompt", e.target.value)} /></div>
      <div className="space-y-2"><Label htmlFor="survey-thanks">Mensagem de agradecimento</Label><Textarea id="survey-thanks" required maxLength={500} value={form.thank_you} onChange={(e) => field("thank_you", e.target.value)} /></div>
    </form>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex flex-wrap justify-end gap-2 border-t pt-4"><Button variant="outline" onClick={() => setPreview(!preview)}><Eye />{preview ? "Voltar à edição" : "Prévia"}</Button><Button type="submit" form="survey-form" disabled={mutation.isPending || preview}><Save />{mutation.isPending ? "Salvando…" : "Salvar pesquisa"}</Button></div>
  </DialogContent></Dialog>;
}
