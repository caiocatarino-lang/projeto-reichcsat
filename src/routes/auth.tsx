import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) navigate({ to: "/dashboard", replace: true }); });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => { if (s) navigate({ to: "/dashboard", replace: true }); });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email, password, options: { emailRedirectTo: window.location.origin + "/dashboard", data: { company } },
        });
        if (error) throw error;
        if (!data.session) setSent(true);
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally { setBusy(false); }
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) toast.error(r.error.message);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8">
        <span className="font-display text-lg font-bold">REICH<span className="text-brand">CSAT</span></span>
        <h1 className="mt-6 text-2xl font-semibold">{mode === "in" ? "Entrar" : "Criar conta"}</h1>
        {sent ? (
          <p className="mt-4 text-sm text-muted-foreground">Enviamos um link de confirmação para {email}. Abra seu e-mail para ativar a conta.</p>
        ) : (
          <>
            <form onSubmit={submit} className="mt-6 space-y-4">
              {mode === "up" && (
                <div className="space-y-1.5"><Label htmlFor="c">Empresa</Label><Input id="c" required value={company} onChange={(e) => setCompany(e.target.value)} /></div>
              )}
              <div className="space-y-1.5"><Label htmlFor="e">E-mail</Label><Input id="e" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div className="space-y-1.5"><Label htmlFor="p">Senha</Label><Input id="p" type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              <Button type="submit" className="w-full" disabled={busy}>{mode === "in" ? "Entrar" : "Criar conta"}</Button>
            </form>
            <Button variant="secondary" className="mt-3 w-full" onClick={google}>Continuar com Google</Button>
            <button className="mt-6 w-full text-center text-sm text-muted-foreground hover:text-foreground" onClick={() => setMode(mode === "in" ? "up" : "in")}>
              {mode === "in" ? "Não tem conta? Criar agora" : "Já tem conta? Entrar"}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
