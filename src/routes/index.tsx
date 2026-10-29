import { useId } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowRight,
  BrainCircuit,
  ChartNoAxesColumnIncreasing,
  MessageSquareText,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearBrandGlow, updateBrandGlow } from "@/lib/brand-glow";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ReichCsat — A inteligência por trás da voz do cliente" },
      { name: "description", content: "Crie pesquisas NPS e CSAT, entenda a experiência dos seus clientes e transforme feedback em decisões melhores." },
      { property: "og:title", content: "ReichCsat — A inteligência por trás da voz do cliente" },
      { property: "og:description", content: "Pesquisas de satisfação, análise e acompanhamento da experiência do cliente." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function InfinityMark({ className = "" }: { className?: string }) {
  const gradientId = `reich-home-infinity-${useId().replace(/:/g, "")}`;
  return (
    <svg aria-hidden="true" viewBox="0 0 300 118" className={className} fill="none">
      <defs>
        <linearGradient id={gradientId} x1="12" y1="30" x2="286" y2="96" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0867FF" />
          <stop offset=".46" stopColor="#03D8FF" />
          <stop offset="1" stopColor="#09D6B9" />
        </linearGradient>
      </defs>
      <path
        d="M149 59C124 34 104 12 78 12 45 12 23 34 23 59s22 47 55 47c34 0 58-31 72-47 14-16 38-47 72-47 33 0 55 22 55 47s-22 47-55 47c-26 0-47-22-73-47Z"
        stroke={`url(#${gradientId})`}
        strokeWidth="13"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M149 59c-17-16-30-31-47-38M149 59c20 20 32 36 54 42"
        stroke={`url(#${gradientId})`}
        strokeWidth="5"
        strokeLinecap="round"
        opacity=".85"
      />
    </svg>
  );
}

const features = [
  {
    title: "Pesquisas NPS e CSAT",
    description: "Pergunte, escute e acompanhe a percepção dos seus clientes.",
    icon: MessageSquareText,
  },
  {
    title: "Análise da experiência",
    description: "Organize avaliações e identifique pontos de atenção.",
    icon: ChartNoAxesColumnIncreasing,
  },
  {
    title: "Insights para agir",
    description: "Use o feedback como apoio para decidir os próximos passos.",
    icon: BrainCircuit,
  },
];

function Landing() {
  return (
    <main className="min-h-screen bg-[#edf4fc] p-3 text-slate-900 sm:p-5 lg:p-8">
      <div className="relative isolate mx-auto grid min-h-[calc(100dvh-2rem)] w-full max-w-[1480px] grid-cols-1 overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-[0_25px_90px_rgba(24,83,145,0.16)] lg:min-h-[min(900px,calc(100dvh-4rem))] lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)]">
        <section className="relative isolate flex min-h-[660px] flex-col overflow-hidden bg-[#041b46] px-6 py-7 text-white sm:px-10 sm:py-10 lg:min-h-[790px] lg:px-12 lg:py-12 xl:px-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(ellipse at 10% 12%, rgba(0,190,255,.30), transparent 27%), radial-gradient(ellipse at 92% 91%, rgba(0,219,231,.28), transparent 32%), linear-gradient(145deg, #062758 0%, #03183e 56%, #042e68 100%)",
            }}
          />
          <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-8 -z-10 h-72 w-72 rounded-full border border-cyan-300/20" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-14 top-16 -z-10 h-56 w-56 rounded-full border border-blue-300/20" />
          <InfinityMark className="pointer-events-none absolute -right-12 top-36 -z-10 w-[min(65%,470px)] opacity-[.13] sm:top-24 lg:top-36" />

          <svg aria-hidden="true" viewBox="0 0 800 270" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[34%] w-full opacity-70">
            <defs>
              <linearGradient id="reich-home-wave-gradient" x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#0066FF" />
                <stop offset=".55" stopColor="#00B9F5" />
                <stop offset="1" stopColor="#00E1D4" />
              </linearGradient>
            </defs>
            <path d="M0 160 C110 110 150 215 270 168 S445 64 540 128 S685 220 800 50" stroke="url(#reich-home-wave-gradient)" strokeWidth="2" fill="none" opacity=".65" />
            <path d="M0 205 C120 122 190 248 310 196 S470 105 565 151 S690 236 800 102" stroke="url(#reich-home-wave-gradient)" strokeWidth="1.5" fill="none" opacity=".8" />
            <path d="M0 235 C100 175 185 264 315 220 S500 140 600 180 S720 240 800 145" stroke="url(#reich-home-wave-gradient)" strokeWidth="1" fill="none" opacity=".5" />
            {Array.from({ length: 28 }, (_, i) => (
              <circle key={i} cx={i * 29 + 8} cy={188 + Math.sin(i * 0.85) * 47} r={i % 4 === 0 ? 2.3 : 1.2} fill="#13D7FF" opacity={i % 3 === 0 ? 0.9 : 0.4} />
            ))}
          </svg>

          <header className="relative flex flex-wrap items-center justify-between gap-5">
            <Link to="/" className="flex items-center gap-3" aria-label="ReichCsat — página inicial">
              <InfinityMark className="h-11 w-[94px] shrink-0 sm:h-12 sm:w-[112px]" />
              <span className="leading-none">
                <span className="block font-display text-xl font-bold tracking-tight sm:text-2xl">REICH<span className="text-cyan-300">CSAT</span></span>
                <span className="mt-1.5 block text-[10px] tracking-[.12em] text-blue-100 sm:text-xs">A inteligência por trás da voz do cliente.</span>
              </span>
            </Link>
            <Button asChild variant="outline" className="rounded-xl border-white/30 bg-white/5 text-white hover:bg-white/15 hover:text-white">
              <Link to="/auth">Entrar</Link>
            </Button>
          </header>

          <div className="relative my-auto max-w-2xl py-12 sm:py-16 lg:py-14">
            <p className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.22em] text-cyan-200 sm:text-sm">
              <Sparkles className="size-4" /> Experiência do cliente em foco
            </p>
            <h1 className="max-w-[720px] font-display text-4xl font-semibold leading-[1.12] tracking-tight sm:text-5xl xl:text-[3.8rem]">
              Ouça cada cliente. <span className="bg-gradient-to-r from-sky-300 via-cyan-300 to-teal-200 bg-clip-text text-transparent">Decida melhor.</span>
            </h1>
            <p className="mt-6 max-w-xl text-sm leading-7 text-blue-100 sm:text-base sm:leading-8">
              Transforme feedback em decisões melhores com pesquisas NPS e CSAT, uma visão clara da satisfação e mais contexto para agir.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild size="lg" className="h-12 rounded-xl bg-gradient-to-r from-blue-700 via-sky-500 to-cyan-400 px-6 font-semibold text-white shadow-lg shadow-cyan-600/20 hover:brightness-105">
                <Link to="/auth">Começar agora <ArrowRight className="ml-1 size-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 rounded-xl border-white/30 bg-white/5 px-6 text-white hover:bg-white/15 hover:text-white">
                <a href="#recursos">Conhecer recursos <ArrowDown className="ml-1 size-4" /></a>
              </Button>
            </div>

            <div className="mt-10 grid max-w-lg grid-cols-3 divide-x divide-cyan-300/30 border-y border-cyan-300/20 py-5 sm:mt-12">
              <div className="px-3 first:pl-0 sm:px-5">
                <ChartNoAxesColumnIncreasing className="mb-2 size-6 text-cyan-300 sm:size-7" />
                <p className="text-sm font-semibold sm:text-base">NPS</p>
                <p className="mt-1 text-[10px] text-blue-200 sm:text-xs">Recomendação</p>
              </div>
              <div className="px-3 sm:px-5">
                <Star className="mb-2 size-6 text-cyan-300 sm:size-7" />
                <p className="text-sm font-semibold sm:text-base">CSAT</p>
                <p className="mt-1 text-[10px] text-blue-200 sm:text-xs">Satisfação</p>
              </div>
              <div className="px-3 sm:px-5">
                <BrainCircuit className="mb-2 size-6 text-cyan-300 sm:size-7" />
                <p className="text-sm font-semibold sm:text-base">Insights</p>
                <p className="mt-1 text-[10px] text-blue-200 sm:text-xs">Mais clareza</p>
              </div>
            </div>
          </div>

          <p className="relative hidden text-xs text-blue-200/80 sm:block">Ouça melhor. Decida com confiança. Evolua continuamente.</p>
        </section>

        <section className="relative flex flex-col overflow-hidden bg-gradient-to-br from-white via-[#fbfdff] to-[#f1f8ff] px-5 py-10 sm:px-9 sm:py-12 lg:px-10 lg:py-12 xl:px-14">
          <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full border border-cyan-300/35" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full border border-sky-300/40" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -right-20 h-72 w-72 rounded-full border border-blue-300/35" />

          <div className="relative mx-auto flex w-full max-w-[540px] flex-1 flex-col justify-center py-4">
            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-sky-100 bg-white/80 px-3 py-1.5 text-xs font-semibold text-blue-800 shadow-sm">
              <span className="size-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400" />
              Feedback que gera movimento
            </div>
            <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight text-[#091f46] sm:text-4xl">
              A voz do cliente merece <span className="bg-gradient-to-r from-blue-600 to-cyan-400 bg-clip-text text-transparent">ser ouvida.</span>
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
              Tenha uma forma organizada de coletar avaliações e enxergar onde a experiência pode evoluir.
            </p>

            <div className="mt-8 overflow-hidden rounded-2xl border border-sky-100 bg-white/90 p-5 shadow-[0_18px_55px_rgba(65,137,205,0.12)] sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[.16em] text-blue-700">ReichCsat</p>
                  <h3 className="mt-1 font-display text-lg font-semibold text-[#091f46]">Visão da experiência</h3>
                </div>
                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-blue-700">Visão ilustrativa</span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="brand-hover-glow rounded-xl border border-sky-100 bg-gradient-to-br from-white to-sky-50/70 p-4" onPointerMove={updateBrandGlow} onPointerLeave={clearBrandGlow}>
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#153465]"><ChartNoAxesColumnIncreasing className="size-4 text-blue-600" /> NPS</div>
                  <p className="mt-2 text-xs leading-5 text-slate-500">Entenda a disposição de recomendação dos clientes.</p>
                  <div className="mt-4 flex h-10 items-end gap-1.5" aria-hidden="true">
                    {[35, 52, 44, 70, 61, 88, 76].map((height, i) => <span key={i} className="flex-1 rounded-t-sm bg-gradient-to-t from-blue-700 to-sky-400" style={{ height: `${height}%`, opacity: 0.5 + i * 0.07 }} />)}
                  </div>
                </div>
                <div className="brand-hover-glow rounded-xl border border-cyan-100 bg-gradient-to-br from-white to-cyan-50/70 p-4" onPointerMove={updateBrandGlow} onPointerLeave={clearBrandGlow}>
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#153465]"><Star className="size-4 text-cyan-600" /> CSAT</div>
                  <p className="mt-2 text-xs leading-5 text-slate-500">Acompanhe a satisfação com produtos e serviços.</p>
                  <div className="mt-4 flex h-10 items-center gap-1.5" aria-hidden="true">
                    {[56, 72, 46, 85, 64, 92, 76].map((height, i) => <span key={i} className="flex-1 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400" style={{ height: `${Math.max(5, height / 8)}px`, opacity: 0.55 + i * 0.06 }} />)}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-start gap-3 rounded-xl bg-[#071f49] p-4 text-white">
                <div className="rounded-lg bg-cyan-300/15 p-2"><TrendingUp className="size-5 text-cyan-300" /></div>
                <div>
                  <p className="text-sm font-semibold">Do feedback à ação</p>
                  <p className="mt-1 text-xs leading-5 text-blue-100">Organize respostas, encontre oportunidades de melhoria e acompanhe as tratativas.</p>
                </div>
              </div>
            </div>

            <div id="recursos" className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {features.map(({ title, description, icon: Icon }) => (
                <article key={title} className="brand-hover-glow rounded-xl border border-sky-100/90 bg-white/75 p-4 shadow-sm shadow-sky-100/40" onPointerMove={updateBrandGlow} onPointerLeave={clearBrandGlow}>
                  <Icon className="mb-3 size-5 text-blue-600" aria-hidden="true" />
                  <h3 className="text-sm font-semibold text-[#102b54]">{title}</h3>
                  <p className="mt-2 text-xs leading-5 text-slate-600">{description}</p>
                </article>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-sky-100 pt-6">
              <p className="text-sm text-slate-600">Pronto para começar?</p>
              <Button asChild className="rounded-xl bg-gradient-to-r from-blue-700 to-cyan-400 font-semibold text-white shadow-md shadow-blue-600/15 hover:brightness-105">
                <Link to="/auth">Acessar plataforma <ArrowRight className="ml-1 size-4" /></Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
      <footer className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-2 px-2 py-5 text-xs text-slate-500">
        <span>© {new Date().getFullYear()} ReichCsat</span>
        <span>A inteligência por trás da voz do cliente.</span>
      </footer>
    </main>
  );
}
