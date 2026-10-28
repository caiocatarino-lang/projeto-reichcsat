import { createFileRoute, Link, Outlet, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { BarChart3, ClipboardList, MessageSquareText, LifeBuoy, Plug, Settings, LogOut, BookOpen, UsersRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMembership, roleLabel } from "@/lib/org";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
  },
  component: Shell,
});

const nav = [
  { to: "/dashboard", label: "Painel", icon: BarChart3 },
  { to: "/surveys", label: "Pesquisas", icon: ClipboardList },
  { to: "/responses", label: "Respostas", icon: MessageSquareText },
  { to: "/clients", label: "Clientes", icon: UsersRound },
  { to: "/cases", label: "Tratativas", icon: LifeBuoy },
  { to: "/integrations", label: "Integrações", icon: Plug },
  { to: "/settings", label: "Configurações", icon: Settings },
  { to: "/help", label: "Central de ajuda", icon: BookOpen },
] as const;

function Shell() {
  const { data: m } = useMembership();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-4 md:flex">
        <span className="px-2 font-display text-lg font-bold">REICH<span className="text-brand">CSAT</span></span>
        <p className="mt-1 truncate px-2 text-xs text-muted-foreground">{(m?.organizations as { name: string } | null)?.name}</p>
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {nav.map((n) => (
            <Link key={n.to} to={n.to}
              className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent",
                path.startsWith(n.to) && "bg-sidebar-accent text-sidebar-accent-foreground")}>
              <n.icon className="h-4 w-4" /> {n.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-sidebar-border pt-4">
          <p className="truncate px-2 text-xs">{m?.email}</p>
          <p className="px-2 text-xs text-muted-foreground">{m ? roleLabel[m.role] : ""}</p>
          <button onClick={signOut} className="mt-3 flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent">
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <nav className="flex gap-1 overflow-x-auto border-b border-border p-2 md:hidden">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className={cn("whitespace-nowrap rounded-md px-3 py-1.5 text-sm", path.startsWith(n.to) ? "bg-secondary" : "text-muted-foreground")}>{n.label}</Link>
          ))}
        </nav>
        <main className="mx-auto w-full max-w-6xl flex-1 p-6 md:p-10"><Outlet /></main>
      </div>
    </div>
  );
}
