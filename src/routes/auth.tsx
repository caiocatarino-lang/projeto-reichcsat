import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
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
          email: email.trim(), password,
          options: { emailRedirectTo: window.location.origin + "/dashboard", data: { company: company.trim() } },
        });
        if (error) throw error;
        if (!data.session) setSent(true);
        else void navigate({ to: "/dashboard", replace: true });
      }
    } catch (err) {
      const message = authErrorText(err);
      setAuthError(message);
      toast.error(message);
    } finally { setBusy(false); }
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

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8">
        <span className="font-display text-lg font-bold">REICH<span className="text-brand">CSAT</span></span>
        <h1 className="mt-6 text-2xl font-semibold">{mode === "in" ? "Entrar" : "Criar conta"}</h1>
        {authError && <div role="alert" aria-live="assertive" className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{authError}</div>}
        {diagnostic && <div role="status" aria-live="polite" className="mt-3 rounded-lg border bg-muted p-3 text-sm">{diagnostic}</div>}
        {sent ? (
          <p className="mt-4 text-sm text-muted-foreground">Enviamos um link de confirmação para {email}. Abra seu e-mail para ativar a conta.</p>
        ) : (
          <>
            <form onSubmit={submit} className="mt-6 space-y-4">
              {mode === "up" && (
                <div className="space-y-1.5"><Label htmlFor="c">Empresa</Label><Input id="c" required value={company} onChange={(e) => setCompany(e.target.value)} /></div>
              )}
              <div className="space-y-1.5"><Label htmlFor="e">E-mail</Label><Input id="e" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div className="space-y-1.5"><Label htmlFor="p">Senha</Label><Input id="p" type="password" minLength={mode === "up" ? 8 : undefined} required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              <Button type="submit" className="w-full" disabled={busy}>{mode === "in" ? "Entrar" : "Criar conta"}</Button>
            </form>
            <Button variant="secondary" className="mt-3 w-full" onClick={google} disabled={busy}>Continuar com Google</Button>
            <Button type="button" variant="ghost" className="mt-3 w-full text-xs" onClick={() => void diagnoseConnection()} disabled={checkingConnection}>
              {checkingConnection ? "Verificando conexão..." : "Diagnosticar conexão com Supabase"}
            </Button>
            <button className="mt-6 w-full text-center text-sm text-muted-foreground hover:text-foreground" onClick={() => { setAuthError(null); setMode(mode === "in" ? "up" : "in"); }}>
              {mode === "in" ? "Não tem conta? Criar agora" : "Já tem conta? Entrar"}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
