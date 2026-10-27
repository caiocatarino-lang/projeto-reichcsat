import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import logo from "@/assets/reichcsat-logo.webp.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ReichCsat — NPS e CSAT integrados ao Bitrix24" },
      { name: "description", content: "Crie pesquisas NPS e CSAT, registre respostas no Bitrix24 e trate avaliações negativas automaticamente." },
      { property: "og:title", content: "ReichCsat — NPS e CSAT integrados ao Bitrix24" },
      { property: "og:description", content: "A inteligência por trás da voz do cliente." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const points = [
  ["Pesquisas NPS e CSAT", "Crie, personalize e publique em minutos, com link próprio para cada cliente."],
  ["Bitrix24 conectado", "Cada nota vai para a linha do tempo do lead ou negócio, sem trabalho manual."],
  ["Recuperação automática", "Detratores viram tarefas para o responsável e entram na fila de tratativas."],
];

function Landing() {
  return (
    <main className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="font-display text-lg font-bold tracking-tight">REICH<span className="text-brand">CSAT</span></span>
        <Button asChild variant="secondary"><Link to="/auth">Entrar</Link></Button>
      </header>
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <img src={logo.url} alt="ReichCsat — A inteligência por trás da voz do cliente" className="w-full rounded-2xl border border-border" />
        <div className="mt-12 grid gap-10 md:grid-cols-[1.2fr_1fr] md:items-end">
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
            Ouça cada cliente. <span className="text-brand">Aja antes que ele vá embora.</span>
          </h1>
          <div className="space-y-4">
            <p className="text-muted-foreground">Pesquisas de satisfação ligadas ao seu CRM, com painel por período, responsável e tipo de atendimento.</p>
            <Button asChild size="lg"><Link to="/auth">Começar agora</Link></Button>
          </div>
        </div>
        <div className="mt-16 grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-3">
          {points.map(([t, d]) => (
            <div key={t} className="bg-card p-6">
              <h3 className="font-semibold">{t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
