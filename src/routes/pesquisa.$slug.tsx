import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, CheckCircle2, LockKeyhole, Mail, MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getPublicSurveyById, submitPublicIdResponse } from "@/lib/public.functions";
import { parsePublicSurveySlug } from "@/lib/public-survey-url";

const BR24_INSTAGRAM_URL = "https://www.instagram.com/br24io/";
const BR24_INSTAGRAM_LABEL = "Instagram da BR24";

export const Route = createFileRoute("/pesquisa/$slug")({
  loader: async ({ params }) => {
    const parsed = parsePublicSurveySlug(params.slug);
    if (!parsed) return { survey: null, publicId: "", channel: "link" as const };
    const survey = await getPublicSurveyById({ data: { publicId: parsed.publicId } });
    return { survey, publicId: parsed.publicId, channel: parsed.channel };
  },
  head: () => ({
    meta: [
      { title: "Pesquisa de experiência — ReichCsat" },
      { name: "description", content: "Compartilhe sua opinião sobre a experiência de atendimento." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PublicSurveyPage,
});

function PublicSurveyPage() {
  const { survey, publicId, channel } = Route.useLoaderData();
  const submitPublicResponse = useServerFn(submitPublicIdResponse);
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!submitted) return;
    const timer = window.setTimeout(() => {
      window.location.replace(BR24_INSTAGRAM_URL);
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [submitted]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (score === null || busy) return;
    setBusy(true);
    setError("");
    try {
      await submitPublicResponse({
        data: {
          publicId,
          score,
          comment: comment.trim() || undefined,
          name: name.trim() || undefined,
          email: email.trim() || undefined,
          channel,
        },
      });
      setSubmitted(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível registrar sua resposta. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  if (!survey) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#edf4fc] p-4 text-slate-900">
        <section className="w-full max-w-lg rounded-3xl border border-sky-100 bg-white p-8 text-center shadow-[0_18px_55px_rgba(65,137,205,0.12)] sm:p-10">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 to-cyan-400 text-white shadow-lg shadow-blue-600/20">
            <LockKeyhole className="size-7" />
          </div>
          <h1 className="mt-6 font-display text-2xl font-semibold text-[#091f46]">Pesquisa indisponível</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">Este link pode estar incorreto, expirado ou a pesquisa ainda não foi ativada. Entre em contato com a empresa que enviou o convite.</p>
          <p className="mt-8 text-xs font-semibold tracking-wide text-slate-400">REICH<span className="text-cyan-500">CSAT</span></p>
        </section>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#edf4fc] p-4 text-slate-900">
        <section className="w-full max-w-lg rounded-3xl border border-sky-100 bg-white p-8 text-center shadow-[0_18px_55px_rgba(65,137,205,0.12)] sm:p-10">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 to-cyan-400 text-white shadow-lg shadow-blue-600/20">
            <CheckCircle2 className="size-7" />
          </div>
          <h1 className="mt-6 font-display text-2xl font-semibold text-[#091f46]">Obrigado pela sua resposta!</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">{survey.thank_you}</p>
          <p className="mt-3 text-sm text-slate-500">Você será direcionado para o Instagram da BR24 em alguns segundos.</p>
          <a href={BR24_INSTAGRAM_URL} className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 via-sky-500 to-cyan-400 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-600/20 hover:brightness-105">
            {BR24_INSTAGRAM_LABEL} <ArrowRight className="size-4" />
          </a>
          <p className="mt-8 text-xs font-semibold tracking-wide text-slate-400">REICH<span className="text-cyan-500">CSAT</span></p>
        </section>
      </main>
    );
  }

  const ratings = Array.from(
    { length: survey.type === "nps" ? 11 : survey.csat_scale },
    (_, index) => survey.type === "nps" ? index : index + 1,
  );

  return (
    <main className="min-h-screen bg-[#edf4fc] p-3 text-slate-900 sm:p-6">
      <div className="mx-auto grid min-h-[calc(100dvh-1.5rem)] w-full max-w-6xl overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-[0_25px_90px_rgba(24,83,145,0.16)] lg:min-h-[calc(100dvh-3rem)] lg:grid-cols-[minmax(260px,0.72fr)_minmax(0,1.28fr)]">
        <aside className="relative isolate flex flex-col overflow-hidden bg-[#041b46] px-6 py-7 text-white sm:px-9 sm:py-10">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10" style={{ background: "radial-gradient(ellipse at 10% 12%, rgba(0,190,255,.3), transparent 27%), radial-gradient(ellipse at 92% 91%, rgba(0,219,231,.28), transparent 32%), linear-gradient(145deg, #062758 0%, #03183e 56%, #042e68 100%)" }} />
          <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-10 -z-10 size-64 rounded-full border border-cyan-300/20" />
          <div className="flex items-center gap-3">
            <svg aria-hidden="true" viewBox="0 0 100 42" className="h-10 w-20 shrink-0" fill="none">
              <defs><linearGradient id="public-brand-gradient" x1="0" y1="0" x2="100" y2="42" gradientUnits="userSpaceOnUse"><stop stopColor="#0867FF" /><stop offset=".5" stopColor="#03D8FF" /><stop offset="1" stopColor="#09D6B9" /></linearGradient></defs>
              <path d="M50 21C41 12 34 5 26 5 14 5 6 12 6 21s8 16 20 16c12 0 18-11 24-16C56 16 63 5 75 5c12 0 19 7 19 16s-7 16-19 16c-9 0-17-8-25-16Z" stroke="url(#public-brand-gradient)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div>
              <p className="font-display text-lg font-bold tracking-tight">REICH<span className="text-cyan-300">CSAT</span></p>
              <p className="mt-0.5 text-[10px] text-blue-100">A inteligência por trás da voz do cliente.</p>
            </div>
          </div>
          <div className="my-auto py-10">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[.2em] text-cyan-200"><Sparkles className="size-4" /> Sua opinião importa</span>
            <h2 className="mt-5 font-display text-3xl font-semibold leading-tight sm:text-4xl">Ajude-nos a <span className="bg-gradient-to-r from-sky-300 via-cyan-300 to-teal-200 bg-clip-text text-transparent">melhorar.</span></h2>
            <p className="mt-4 text-sm leading-7 text-blue-100">Sua avaliação nos ajuda a entender a experiência e identificar oportunidades de evolução.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-blue-200"><MessageCircle className="size-4 text-cyan-300" /> Resposta rápida</div>
        </aside>

        <section className="flex items-center justify-center bg-gradient-to-br from-white via-[#fbfdff] to-[#f1f8ff] px-5 py-8 sm:px-9 sm:py-12">
          <div className="w-full max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-blue-700">{survey.type.toUpperCase()} · Pesquisa de experiência</p>
            <h1 className="mt-3 font-display text-2xl font-semibold leading-tight text-[#091f46] sm:text-3xl">{survey.name}</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">{survey.question}</p>
            {error && <div role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</div>}

            <form onSubmit={submit} className="mt-7 space-y-6">
              <fieldset>
                <legend className="mb-3 text-sm font-semibold text-slate-800">
                  {survey.type === "nps" ? "De 0 a 10, qual nota você daria?" : `Escolha uma nota de 1 a ${survey.csat_scale}`}
                </legend>
                <div className={`grid gap-2 ${survey.type === "nps" ? "grid-cols-6 sm:grid-cols-11" : survey.csat_scale === 10 ? "grid-cols-5 sm:grid-cols-10" : "grid-cols-5"}`}>
                  {ratings.map((rating) => (
                    <button key={rating} type="button" aria-pressed={score === rating} onClick={() => setScore(rating)}
                      className={`brand-hover-glow flex h-11 items-center justify-center rounded-xl border text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${score === rating ? "border-cyan-400 bg-gradient-to-br from-blue-700 to-cyan-500 text-white shadow-md shadow-cyan-600/20" : "border-sky-100 bg-white text-[#17335f] hover:border-sky-300"}`}>{rating}</button>
                  ))}
                </div>
                <div className="mt-3 flex justify-between gap-4 text-xs text-slate-500"><span>{survey.type === "nps" ? "Nada provável" : "Muito insatisfeito"}</span><span>{survey.type === "nps" ? "Muito provável" : "Muito satisfeito"}</span></div>
              </fieldset>

              <div className="space-y-2">
                <Label htmlFor="response-comment" className="text-sm font-semibold text-slate-800">{survey.comment_prompt}</Label>
                <Textarea id="response-comment" value={comment} maxLength={2000} onChange={(event) => setComment(event.target.value)} rows={3} placeholder="Seu comentário (opcional)" className="resize-y rounded-xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-sky-500" />
              </div>

              <details className="rounded-xl border border-sky-100 bg-white/70 p-4">
                <summary className="cursor-pointer text-sm font-semibold text-[#17335f]">Desejo me identificar (opcional)</summary>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label htmlFor="respondent-name">Nome</Label><Input id="respondent-name" autoComplete="name" maxLength={120} value={name} onChange={(event) => setName(event.target.value)} placeholder="Seu nome" className="rounded-xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400" /></div>
                  <div className="space-y-2"><Label htmlFor="respondent-email">E-mail</Label><div className="relative"><Mail aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input id="respondent-email" type="email" autoComplete="email" maxLength={200} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@empresa.com" className="rounded-xl border-slate-200 bg-white pl-9 text-slate-900 placeholder:text-slate-400" /></div></div>
                </div>
              </details>

              <Button type="submit" disabled={busy || score === null} className="h-12 w-full rounded-xl bg-gradient-to-r from-blue-700 via-sky-500 to-cyan-400 font-semibold text-white shadow-lg shadow-cyan-600/20 hover:brightness-105">
                {busy ? "Enviando resposta..." : "Enviar resposta"} {!busy && <ArrowRight className="ml-1 size-4" />}
              </Button>
              <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-400"><LockKeyhole className="size-3.5" /> Suas informações são usadas para registrar esta avaliação.</p>
            </form>
          </div>
        </section>
      </div>
      <p className="mx-auto mt-4 max-w-6xl text-center text-xs text-slate-500">Pesquisa disponibilizada por meio do ReichCsat · Canal indicado: {channel}</p>
    </main>
  );
}
