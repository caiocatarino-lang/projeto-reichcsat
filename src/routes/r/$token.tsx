import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getPublicSurvey, submitResponse } from "@/lib/public.functions";

export const Route = createFileRoute("/r/$token")({
  loader: async ({ params }) => getPublicSurvey({ data: { token: params.token } }),
  head: () => ({
    meta: [
      { title: "Pesquisa de satisfação — ReichCsat" },
      { name: "description", content: "Responda à pesquisa de satisfação." },
    ],
  }),
  component: PublicSurveyPage,
});

function PublicSurveyPage() {
  const survey = Route.useLoaderData();
  const { token } = Route.useParams();
  const sendResponse = useServerFn(submitResponse);
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (score === null || busy) return;
    setBusy(true);
    setError("");
    try {
      await sendResponse({
        data: {
          token,
          score,
          comment: comment.trim() || undefined,
          name: name.trim() || undefined,
          email: email.trim() || undefined,
        },
      });
      setSubmitted(true);
    } catch {
      setError("Não foi possível registrar sua resposta. Atualize a página e tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  if (!survey) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
        <section className="w-full max-w-lg rounded-2xl border bg-card p-8 text-center">
          <p className="text-lg font-semibold">Pesquisa indisponível</p>
          <p className="mt-2 text-sm text-muted-foreground">Este link pode ter expirado ou a pesquisa não está mais ativa.</p>
        </section>
      </main>
    );
  }

  const scoreValues = Array.from(
    { length: survey.type === "nps" ? 11 : survey.csat_scale },
    (_, index) => survey.type === "nps" ? index : index + 1,
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <section className="w-full max-w-2xl rounded-2xl border bg-card p-6 shadow-sm sm:p-10">
        <header className="border-b pb-5">
          <p className="font-display text-lg font-bold tracking-tight">REICH<span className="text-brand">CSAT</span></p>
          {survey.name && <p className="mt-4 text-sm text-muted-foreground">{survey.name}</p>}
        </header>

        {submitted ? (
          <div className="py-12 text-center" role="status">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">✓</div>
            <h1 className="mt-5 text-2xl font-semibold">Obrigado pela sua resposta</h1>
            <p className="mt-3 text-muted-foreground">{survey.thank_you}</p>
          </div>
        ) : (
          <form className="space-y-7 py-6" onSubmit={submit}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">{survey.type.toUpperCase()}</p>
              <h1 className="mt-3 text-2xl font-semibold leading-snug">{survey.question}</h1>
            </div>

            <fieldset>
              <legend className="sr-only">Selecione sua nota</legend>
              <div
                className={survey.type === "nps" ? "grid grid-cols-6 gap-2 sm:grid-cols-11" : "grid gap-2"}
                style={survey.type === "csat" ? { gridTemplateColumns: "repeat(" + survey.csat_scale + ", minmax(0, 1fr))" } : undefined}
              >
                {scoreValues.map((value) => (
                  <Button
                    key={value}
                    type="button"
                    variant={score === value ? "default" : "outline"}
                    aria-pressed={score === value}
                    className="min-w-0 px-0"
                    onClick={() => setScore(value)}
                  >
                    {value}
                  </Button>
                ))}
              </div>
              <div className="mt-2 flex justify-between gap-4 text-xs text-muted-foreground">
                <span>{survey.type === "nps" ? "Nada provável" : "Muito insatisfeito"}</span>
                <span className="text-right">{survey.type === "nps" ? "Extremamente provável" : "Muito satisfeito"}</span>
              </div>
            </fieldset>

            <div className="space-y-2">
              <Label htmlFor="public-comment">{survey.comment_prompt}</Label>
              <Textarea id="public-comment" value={comment} maxLength={2000} onChange={(event) => setComment(event.target.value)} placeholder="Escreva seu comentário (opcional)" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="public-name">Nome (opcional)</Label>
                <Input id="public-name" autoComplete="name" maxLength={120} value={name} onChange={(event) => setName(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="public-email">E-mail (opcional)</Label>
                <Input id="public-email" type="email" autoComplete="email" maxLength={200} value={email} onChange={(event) => setEmail(event.target.value)} />
              </div>
            </div>

            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" type="submit" disabled={score === null || busy}>
              {busy ? "Enviando resposta…" : "Enviar resposta"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">Sua resposta será registrada para análise de satisfação.</p>
          </form>
        )}
      </section>
    </main>
  );
}
