import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowUpRight, Search, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { WorkspaceError, WorkspacePending } from "@/components/workspace-states";
import { workspaceQuery, pageHead } from "@/lib/workspace";
import type { Tables } from "@/integrations/supabase/types";

type ResponseRow = Tables<"responses">;
type ClientGroup = {
  key: string;
  name: string;
  email: string | null;
  responses: ResponseRow[];
  latestAt: string;
  latestScore: number;
  hasNegative: boolean;
  negativeCount: number;
};

const dateLabel = (value: string) => new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

function clientKey(response: ResponseRow): string {
  const email = response.contact_email?.trim().toLocaleLowerCase("pt-BR");
  if (email) return "email:" + email;
  const name = response.contact_name?.trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
  if (name) return "name:" + name;
  // Do not merge anonymous responses without a stable identifier.
  return "anonymous:" + response.id;
}

export const Route = createFileRoute("/_authenticated/clients")({
  loader: async ({ context }) => { await context.queryClient.ensureQueryData(workspaceQuery); },
  head: () => pageHead("Clientes", "Consulte o histórico de satisfação dos clientes."),
  component: Page,
  errorComponent: WorkspaceError,
  pendingComponent: WorkspacePending,
});

function Page() {
  const { data } = useSuspenseQuery(workspaceQuery);
  const [search, setSearch] = useState("");
  const [sentiment, setSentiment] = useState("all");
  const [selected, setSelected] = useState<ClientGroup | null>(null);
  const surveyNames = new Map(data.surveys.map((survey) => [survey.id, survey.name]));

  const clients = useMemo(() => {
    const grouped = new Map<string, ResponseRow[]>();
    for (const response of data.responses) {
      const key = clientKey(response);
      const rows = grouped.get(key) ?? [];
      rows.push(response);
      grouped.set(key, rows);
    }

    return Array.from(grouped.entries()).map(([key, rows]): ClientGroup => {
      const sorted = [...rows].sort((a, b) => b.created_at.localeCompare(a.created_at));
      const latest = sorted[0];
      const negativeCount = rows.filter((row) => row.is_negative).length;
      return {
        key,
        name: latest.contact_name?.trim() || "Cliente anônimo",
        email: latest.contact_email,
        responses: sorted,
        latestAt: latest.created_at,
        latestScore: latest.score,
        hasNegative: negativeCount > 0,
        negativeCount,
      };
    }).sort((a, b) => b.latestAt.localeCompare(a.latestAt));
  }, [data.responses]);

  const filtered = clients.filter((client) => {
    const query = search.trim().toLocaleLowerCase("pt-BR");
    const matchesSearch = !query || [
      client.name, client.email, ...client.responses.map((row) => row.comment),
      ...client.responses.map((row) => row.responsible),
      ...client.responses.map((row) => row.service_type),
    ].some((value) => (value ?? "").toLocaleLowerCase("pt-BR").includes(query));
    const matchesSentiment = sentiment === "all"
      || (sentiment === "negative" ? client.hasNegative : !client.hasNegative);
    return matchesSearch && matchesSentiment;
  });

  const totalResponses = clients.reduce((total, client) => total + client.responses.length, 0);
  const withNegative = clients.filter((client) => client.hasNegative).length;

  return (
    <div className="space-y-7">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">ReichCsat / Relacionamento</p>
        <h1 className="mt-2 text-3xl font-semibold">Clientes</h1>
        <p className="mt-2 text-sm text-muted-foreground">Consulte o histórico de satisfação com base nas respostas registradas.</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Clientes identificados</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{clients.filter((client) => client.email || client.name !== "Cliente anônimo").length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Respostas registradas</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{totalResponses}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Clientes com avaliações críticas</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{withNegative}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar nome, e-mail, comentário ou responsável" aria-label="Buscar clientes" />
        </div>
        <Select value={sentiment} onValueChange={setSentiment}>
          <SelectTrigger className="w-48" aria-label="Filtrar histórico"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os clientes</SelectItem>
            <SelectItem value="negative">Com avaliações críticas</SelectItem>
            <SelectItem value="other">Sem avaliação crítica</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!filtered.length ? (
        <div className="rounded-xl border border-dashed px-6 py-16 text-center">
          <UsersRound className="mx-auto size-10 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">{clients.length ? "Nenhum cliente encontrado" : "O histórico dos clientes aparecerá aqui"}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{clients.length ? "Ajuste sua busca ou os filtros." : "Quando as pesquisas receberem respostas, será possível consultar o histórico de satisfação."}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Respostas</TableHead>
                <TableHead>Última nota</TableHead>
                <TableHead>Última resposta</TableHead>
                <TableHead>Histórico</TableHead>
                <TableHead className="text-right">Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((client) => (
                <TableRow key={client.key}>
                  <TableCell>
                    <p className="font-medium">{client.name}</p>
                    <p className="max-w-56 truncate text-xs text-muted-foreground">{client.email || "E-mail não informado"}</p>
                  </TableCell>
                  <TableCell className="tabular-nums">{client.responses.length}</TableCell>
                  <TableCell>
                    <span className={client.hasNegative ? "font-semibold text-destructive" : "font-semibold"}>{client.latestScore}</span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">{dateLabel(client.latestAt)}</TableCell>
                  <TableCell>
                    {client.hasNegative
                      ? <span className="text-sm text-destructive">{client.negativeCount} crítica(s)</span>
                      : <span className="text-sm text-muted-foreground">Sem crítica sinalizada</span>}
                  </TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="icon" aria-label={"Ver histórico de " + client.name} onClick={() => setSelected(client)}><ArrowUpRight className="size-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="max-h-[85dvh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Histórico do cliente</DialogTitle>
            <DialogDescription>{selected?.name}{selected?.email ? " · " + selected.email : ""}</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              {selected.responses.map((response) => (
                <article key={response.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{surveyNames.get(response.survey_id) ?? "Pesquisa removida"}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{dateLabel(response.created_at)} · {response.survey_type.toUpperCase()}</p>
                    </div>
                    <span className={response.is_negative ? "rounded-md bg-destructive/10 px-3 py-1 font-semibold text-destructive" : "rounded-md bg-muted px-3 py-1 font-semibold"}>Nota {response.score}</span>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{response.comment || "Sem comentário"}</p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {response.responsible && <span>Responsável: {response.responsible}</span>}
                    {response.service_type && <span>Atendimento: {response.service_type}</span>}
                    {response.is_negative && <span className="text-destructive">Requer acompanhamento</span>}
                  </div>
                </article>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
