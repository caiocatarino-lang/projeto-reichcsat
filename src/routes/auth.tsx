import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useId, useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  BrainCircuit,
  ChartNoAxesColumnIncreasing,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Star,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function authErrorText(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  const message = raw.trim();
  const normalized = message.toLowerCase();
  if (normalized.includes("missing supabase environment variable") || normalized.includes("process is not defined")) {
    return "A configuração do Supabase está ausente neste ambiente. Confira a conexão do backend e as variáveis públicas.";
  }
  if (normalized.includes("invalid api key") || normalized.includes("api key is invalid") || normalized.includes("apikey")) {
    return "A chave pública do Supabase é inválida ou não corresponde ao projeto conectado.";
  }
  if (normalized.includes("failed to fetch") || normalized.includes("fetch failed") || normalized.includes("networkerror")) {
    return "Não foi possível alcançar o Supabase. Confira a URL do projeto e a conexão de rede.";
  }
  if (normalized.includes("invalid login") || normalized.includes("user not found")) {
    return "E-mail ou senha incorretos.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Confirme seu e-mail antes de entrar.";
  }
  if (normalized.includes("rate limit") || normalized.includes("too many requests")) {
    return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
  }
  return message.slice(0, 220) || "Não foi possível concluir a autenticação. Tente novamente.";
}

function InfinityMark({ className = "" }: { className?: string }) {
  const gradientId = `reich-infinity-gradient-${useId().replace(/:/g, "")}`;
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

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — ReichCsat" },
      { name: "description", content: "Acesse sua conta ReichCsat." },
      { property: "og:title", content: "Entrar — ReichCsat" },
      { property: "og:description", content: "Acesse sua conta ReichCsat." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [sent, setSent] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [diagnostic, setDiagnostic] = useState<string | null>(null);
  const [checkingConnection, setCheckingConnection] = useState(false);

  useEffect(() => {
    let active = true;
    let redirectTimer: ReturnType<typeof setTimeout> | undefined;
    let unsubscribe: (() => void) | undefined;

    const redirectToDashboard = () => {
      if (redirectTimer !== undefined) clearTimeout(redirectTimer);
      // Navigate only after Supabase releases its internal auth lock.
      redirectTimer = setTimeout(() => {
        redirectTimer = undefined;
        if (active) void navigate({ to: "/dashboard", replace: true });
      }, 0);
    };

    try {
      void supabase.auth.getSession().then(({ data, error }) => {
        if (!active) return;
        if (error) setAuthError(authErrorText(error));
        if (data.session) redirectToDashboard();
      }).catch((error) => {
        if (active) setAuthError(authErrorText(error));
      });

      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) redirectToDashboard();
      });
      unsubscribe = () => data.subscription.unsubscribe();
    } catch (error) {
      setAuthError(authErrorText(error));
    }

    return () => {
      active = false;
      if (redirectTimer !== undefined) clearTimeout(redirectTimer);
      unsubscribe?.();
    };
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    setDiagnostic(null);
    setBusy(true);
    try {
      if (mode === "in") {
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        if (!data.session) throw new Error("O Supabase não retornou uma sessão após o login.");
        void navigate({ to: "/dashboard", replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin + "/dashboard",
            data: { company: company.trim() },
          },
        });
        if (error) throw error;
        if (!data.session) setSent(true);
        else void navigate({ to: "/dashboard", replace: true });
      }
    } catch (err) {
      const message = authErrorText(err);
      setAuthError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function diagnoseConnection() {
    setCheckingConnection(true);
    setDiagnostic(null);
    try {
      const runtimeEnv = typeof process === "undefined" ? undefined : process.env;
      const url = import.meta.env["VITE_SUPABASE_URL"] || runtimeEnv?.["SUPABASE_URL"];
      const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] || runtimeEnv?.["SUPABASE_PUBLISHABLE_KEY"];
      if (!url || !key) {
        setDiagnostic("A URL ou a chave pública do Supabase não está configurada neste ambiente. Conecte o backend no Lovable.");
        return;
      }
      let baseUrl = url;
      while (baseUrl.endsWith("/")) baseUrl = baseUrl.slice(0, -1);
      const response = await fetch(`${baseUrl}/auth/v1/settings`, {
        method: "GET",
        headers: { apikey: key, Accept: "application/json" },
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) {
        setDiagnostic(`O endpoint Supabase Auth respondeu com HTTP ${response.status}. Confira se a URL e a chave pública pertencem ao mesmo projeto.`);
        return;
      }
      setDiagnostic("Conexão com o endpoint Supabase Auth confirmada. Se o login continuar falhando, confira as credenciais da conta e as configurações de Authentication.");
    } catch (error) {
      setDiagnostic(authErrorText(error));
    } finally {
      setCheckingConnection(false);
    }
  }

  async function google() {
    setAuthError(null);
    try {
      const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
      if (r.error) {
        const message = authErrorText(r.error);
        setAuthError(message);
        toast.error(message);
      }
    } catch (error) {
      const message = authErrorText(error);
      setAuthError(message);
      toast.error(message);
    }
  }

  function toggleMode() {
    setAuthError(null);
    setDiagnostic(null);
    setSent(false);
    setShowPassword(false);
    setMode((current) => current === "in" ? "up" : "in");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#eef4fc] p-3 text-slate-900 sm:p-5 lg:p-8">
      <div className="grid min-h-[min(900px,calc(100dvh_-_4rem))] w-full max-w-[1480px] grid-cols-1 overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-[0_25px_90px_rgba(24,83,145,0.16)] lg:grid-cols-[minmax(0,1.08fr)_minmax(440px,0.92fr)]">
        <aside className="relative isolate flex min-h-[290px] flex-col overflow-hidden bg-[#041b46] px-6 py-8 text-white sm:px-10 sm:py-10 lg:min-h-[760px] lg:px-12 lg:py-12 xl:px-16 xl:py-14">
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
          <InfinityMark className="pointer-events-none absolute -right-10 top-28 -z-10 w-[min(62%,450px)] opacity-[.12] sm:top-20 lg:top-28" />
          <svg aria-hidden="true" viewBox="0 0 800 270" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[34%] w-full opacity-70">
            <defs>
              <linearGradient id="reich-wave-gradient" x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#0066FF" />
                <stop offset=".55" stopColor="#00B9F5" />
                <stop offset="1" stopColor="#00E1D4" />
              </linearGradient>
            </defs>
            <path d="M0 160 C110 110 150 215 270 168 S445 64 540 128 S685 220 800 50" stroke="url(#reich-wave-gradient)" strokeWidth="2" fill="none" opacity=".65" />
            <path d="M0 205 C120 122 190 248 310 196 S470 105 565 151 S690 236 800 102" stroke="url(#reich-wave-gradient)" strokeWidth="1.5" fill="none" opacity=".8" />
            <path d="M0 235 C100 175 185 264 315 220 S500 140 600 180 S720 240 800 145" stroke="url(#reich-wave-gradient)" strokeWidth="1" fill="none" opacity=".5" />
            {Array.from({ length: 28 }, (_, i) => (
              <circle key={i} cx={i * 29 + 8} cy={188 + Math.sin(i * 0.85) * 47} r={i % 4 === 0 ? 2.3 : 1.2} fill="#13D7FF" opacity={i % 3 === 0 ? 0.9 : 0.4} />
            ))}
          </svg>

          <div className="relative flex items-center gap-3">
            <InfinityMark className="h-11 w-[94px] shrink-0 sm:h-12 sm:w-[112px]" />
            <div className="leading-none">
              <div className="font-display text-xl font-bold tracking-tight sm:text-2xl">REICH<span className="text-cyan-300">CSAT</span></div>
              <p className="mt-1.5 text-[10px] tracking-[.14em] text-blue-100 sm:text-xs">A inteligência por trás da voz do cliente.</p>
            </div>
          </div>

          <div className="relative my-8 max-w-xl sm:my-10 lg:my-auto lg:py-14">
            <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.24em] text-cyan-200 sm:text-sm">
              <Sparkles className="size-4" /> Experiência do cliente em foco
            </p>
            <h2 className="max-w-[680px] font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl xl:text-[3.15rem]">
              Transforme feedback em <span className="bg-gradient-to-r from-sky-300 via-cyan-300 to-teal-200 bg-clip-text text-transparent">decisões melhores.</span>
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-7 text-blue-100 sm:text-base sm:leading-8">
              Entenda o que seus clientes sentem, acompanhe a satisfação e identifique oportunidades de melhoria.
            </p>
            <div className="mt-7 grid max-w-lg grid-cols-3 divide-x divide-cyan-300/30 border-y border-cyan-300/20 py-4 sm:mt-9 sm:py-5">
              <div className="px-2 first:pl-0 sm:px-4">
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
        </aside>

        <section className="relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-white via-[#fbfdff] to-[#f1f8ff] px-5 py-8 sm:px-9 sm:py-10 lg:px-10 lg:py-12 xl:px-14">
          <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full border border-cyan-300/35" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full border border-sky-300/40" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -right-20 h-72 w-72 rounded-full border border-blue-300/35" />
          <div className="relative w-full max-w-[500px] rounded-[24px] border border-sky-100/90 bg-white/90 p-6 shadow-[0_18px_55px_rgba(65,137,205,0.12)] backdrop-blur-sm sm:p-8 lg:p-9">
            <header className="mb-7">
              <div className="mb-5 flex items-center gap-2 lg:hidden">
                <InfinityMark className="h-8 w-[72px]" />
                <span className="font-display text-base font-bold tracking-tight text-[#0a234e]">REICH<span className="text-cyan-500">CSAT</span></span>
              </div>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-[#091f46] sm:text-4xl">
                {mode === "in" ? <>Bem-vindo <span className="bg-gradient-to-r from-blue-600 to-cyan-400 bg-clip-text text-transparent">de volta</span></> : "Crie sua conta"}
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                {mode === "in"
                  ? "Acesse sua conta para acompanhar a experiência dos seus clientes."
                  : "Comece a transformar a voz dos seus clientes em decisões melhores."}
              </p>
            </header>

            {authError && <div id="auth-error" role="alert" aria-live="assertive" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{authError}</div>}
            {diagnostic && <div role="status" aria-live="polite" className="mb-4 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">{diagnostic}</div>}

            {sent ? (
              <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm leading-6 text-emerald-900">
                Enviamos um link de confirmação para <strong>{email}</strong>. Abra seu e-mail para ativar a conta e depois entre na plataforma.
              </div>
            ) : (
              <>
                <form onSubmit={submit} className="space-y-5">
                  {mode === "up" && (
                    <div className="space-y-2">
                      <Label htmlFor="c" className="text-sm font-semibold text-slate-800">Nome da empresa</Label>
                      <Input id="c" autoComplete="organization" required maxLength={160} value={company} onChange={(e) => setCompany(e.target.value)} className="h-12 rounded-xl border-slate-200 bg-white pl-4 text-slate-900 placeholder:text-slate-400 focus-visible:ring-sky-500" placeholder="Sua empresa" />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="e" className="text-sm font-semibold text-slate-800">E-mail corporativo</Label>
                    <div className="relative">
                      <Mail aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-slate-400" />
                      <Input id="e" type="email" autoComplete="email" inputMode="email" required value={email} onChange={(e) => setEmail(e.target.value)} aria-describedby={authError ? "auth-error" : undefined} className="h-12 rounded-xl border-slate-200 bg-white pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus-visible:ring-sky-500" placeholder="seu@empresa.com" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="p" className="text-sm font-semibold text-slate-800">Senha</Label>
                    <div className="relative">
                      <LockKeyhole aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-slate-400" />
                      <Input id="p" type={showPassword ? "text" : "password"} autoComplete={mode === "in" ? "current-password" : "new-password"} minLength={mode === "up" ? 8 : undefined} required value={password} onChange={(e) => setPassword(e.target.value)} aria-describedby={authError ? "auth-error" : undefined} className="h-12 rounded-xl border-slate-200 bg-white pl-11 pr-12 text-slate-900 placeholder:text-slate-400 focus-visible:ring-sky-500" placeholder={mode === "in" ? "Digite sua senha" : "Crie uma senha segura"} />
                      <button type="button" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} onClick={() => setShowPassword((visible) => !visible)} className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500">
                        {showPassword ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
                      </button>
                    </div>
                    {mode === "up" && <p className="text-xs text-slate-500">Use pelo menos 8 caracteres.</p>}
                  </div>
                  {mode === "in" && <div className="-mt-2 flex justify-end"><span className="text-xs text-slate-500">Problemas para acessar? Verifique seu e-mail e senha.</span></div>}
                  <Button type="submit" className="h-12 w-full rounded-xl bg-gradient-to-r from-blue-700 via-sky-500 to-cyan-400 text-sm font-semibold text-white shadow-lg shadow-cyan-600/20 transition hover:brightness-105" disabled={busy}>
                    {busy ? "Aguarde..." : mode === "in" ? "Entrar na plataforma" : "Criar conta"}
                    {!busy && <ArrowRight className="ml-1 size-4" />}
                  </Button>
                </form>

                <div className="my-7 flex items-center gap-4 text-xs text-slate-500">
                  <span className="h-px flex-1 bg-slate-200" />
                  <span>ou continue com</span>
                  <span className="h-px flex-1 bg-slate-200" />
                </div>
                <Button type="button" variant="outline" className="h-12 w-full rounded-xl border-slate-200 bg-white text-sm font-semibold text-slate-800 shadow-none hover:bg-slate-50" onClick={google} disabled={busy}>
                  <span aria-hidden="true" className="mr-1 inline-flex size-5 items-center justify-center rounded-full font-bold text-base" style={{ background: "conic-gradient(from -45deg, #4285F4 0deg 90deg, #34A853 90deg 180deg, #FBBC05 180deg 255deg, #EA4335 255deg 360deg)", color: "transparent", WebkitBackgroundClip: "text", backgroundClip: "text" }}>G</span>
                  Continuar com Google
                </Button>

                <Button type="button" variant="ghost" className="mt-3 h-9 w-full text-xs text-slate-500 hover:bg-sky-50 hover:text-sky-800" onClick={() => void diagnoseConnection()} disabled={checkingConnection}>
                  {checkingConnection ? "Verificando conexão..." : "Diagnosticar conexão com Supabase"}
                </Button>

                <p className="mt-5 text-center text-sm leading-6 text-slate-600">
                  {mode === "in" ? "Ainda não tem uma conta?" : "Já possui uma conta?"}{" "}
                  <button type="button" className="font-semibold text-blue-700 underline-offset-4 transition hover:text-cyan-700 hover:underline" onClick={toggleMode}>
                    {mode === "in" ? "Criar conta" : "Entrar"}
                  </button>
                </p>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
