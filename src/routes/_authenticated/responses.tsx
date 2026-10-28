import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Download, Eye, MessageSquareText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { workspaceQuery, pageHead } from "@/lib/workspace";
import { WorkspaceError, WorkspacePending } from "@/components/workspace-states";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/responses")({
  loader: async ({ context }) => { await context.queryClient.ensureQueryData(workspaceQuery); },
  head: () => pageHead("Respostas", "Consulte as avaliações NPS e CSAT dos seus clientes."),
  component: Page,
  errorComponent: WorkspaceError,
  pendingComponent: WorkspacePending,
});

const dateLabel = (value: string) => new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
const scoreLabel = (response: Tables<"responses">) => response.survey_type === "nps" ? "NPS" : "CSAT";

function csvCell(value: unknown): string {
  const raw = String(value ?? "");
  // Prevent spreadsheet formula execution from untrusted survey content.
  const safe = /^[=+@-]/.test(raw.trimStart()) ? "'" + raw : raw;
  return '"' + safe.replace(/"/g, '""') + '"';
}

function downloadCsv(rows: Tables<"responses">[], surveyNames: Map<string, string>) {
  const header = ["Data", "Pesquisa", "Indicador", "Nota", "Cliente", "E-mail", "Responsável", "Tipo de atendimento", "Comentário", "Negativa"];
  const lines = rows.map((row) => [
    dateLabel(row.created_at),
    surveyNames.get(row.survey_id) ?? "",
    scoreLabel(row),
    row.score,
    row.contact_name,
    row.contact_email,
    row.responsible,
    row.service_type,
    row.comment,
    row.is_negative ? "Sim" : "Não",
  ].map(csvCell).join(";"));
  const csv = "\uFEFF" + [header.map(csvCell).join(";"), ...lines].join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "reichcsat-respostas.csv";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function Page() {
  const { data } = useSuspenseQuery(workspaceQuery);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [sentiment, setSentiment] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Tables<"responses"> | null>(null);
  const pageSize = 10;
  const surveyNames = new Map(data.surveys.map((survey) => [survey.id, survey.name]));

  const filtered = data.responses.filter((response) => {
    const surveyName = surveyNames.get(response.survey_id) ?? "";
    const query = search.trim().toLocaleLowerCase("pt-BR");
    const matchesSearch = !query || [
      response.contact_name,
      response.contact_email,
      response.comment,
      response.responsible,
      surveyName,
      response.service_type,
    ].some((value) => (value ?? "").toLocaleLowerCase("pt-BR").includes(query));
    const matchesType = type === "all" || response.survey_type === type;
    const matchesSentiment = sentiment === "all"
      || (sentiment === "negative" ? response.is_negative : !response.is_negative);
    return matchesSearch && matchesType && matchesSentiment;
  });
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function changeSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  return (
    <div className="space-y-7">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">ReichCsat / Experiência do cliente</p>
          <h1 className="mt-2 text-3xl font-semibold">Respostas</h1>
          <p className="mt-2 text-sm text-muted-foreground">Consulte notas e comentários enviados pelos clientes.</p>
        </div>
        <Button variant="outline" onClick={() => downloadCsv(filtered, surveyNames)} disabled={!filtered.length}>
          <Download className="mr-2 size-4" />Exportar CSV
        </Button>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Respostas encontradas</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{filtered.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">NPS</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{filtered.filter((response) => response.survey_type === "nps").length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Avaliações negativas</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{filtered.filter((response) => response.is_negative).length}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input value={search} onChange={(event) => changeSearch(event.target.value)} placeholder="Buscar cliente, comentário ou pesquisa" className="pl-9" aria-label="Buscar respostas" />
        </div>
        <Select value={type} onValueChange={(value) => { setType(value); setPage(1); }}>
          <SelectTrigger className="w-36" aria-label="Filtrar indicador"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">NPS e CSAT</SelectItem>
            <SelectItem value="nps">NPS</SelectItem>
            <SelectItem value="csat">CSAT</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sentiment} onValueChange={(value) => { setSentiment(value); setPage(1); }}>
          <SelectTrigger className="w-44" aria-label="Filtrar sentimento"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as avaliações</SelectItem>
            <SelectItem value="negative">Negativas / detratores</SelectItem>
            <SelectItem value="other">Demais avaliações</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed px-6 py-16 text-center">
          <MessageSquareText className="mx-auto size-10 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">{data.responses.length ? "Nenhuma resposta encontrada" : "As respostas aparecerão aqui"}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{data.responses.length ? "Ajuste a busca ou os filtros." : "Quando um cliente responder a uma pesquisa ativa, o registro ficará disponível nesta tela."}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Pesquisa</TableHead>
                <TableHead>Indicador</TableHead>
                <TableHead>Nota</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((response) => (
                <TableRow key={response.id}>
                  <TableCell className="whitespace-nowrap text-sm">{dateLabel(response.created_at)}</TableCell>
                  <TableCell>
                    <div className="font-medium">{response.contact_name || "Anônimo"}</div>
                    {response.contact_email && <div className="max-w-48 truncate text-xs text-muted-foreground">{response.contact_email}</div>}
                  </TableCell>
                  <TableCell className="max-w-52 truncate">{surveyNames.get(response.survey_id) ?? "Pesquisa removida"}</TableCell>
                  <TableCell>{scoreLabel(response)}</TableCell>
                  <TableCell className="font-semibold tabular-nums">{response.score}</TableCell>
                  <TableCell>
                    <span className={response.is_negative ? "text-destructive" : "text-muted-foreground"}>
                      {response.is_negative ? "Requer atenção" : "Registrada"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" aria-label={"Ver resposta de " + (response.contact_name || "cliente anônimo")} onClick={() => setSelected(response)}>
                      <Eye className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
            <p className="text-xs text-muted-foreground">Exibindo {Math.min((currentPage - 1) * pageSize + 1, filtered.length)}–{Math.min(currentPage * pageSize, filtered.length)} de {filtered.length}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>Anterior</Button>
              <Button variant="outline" size="sm" disabled={currentPage >= pageCount} onClick={() => setPage(currentPage + 1)}>Próxima</Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da resposta</DialogTitle>
            <DialogDescription>Dados registrados pela pesquisa de satisfação.</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <div><p className="text-muted-foreground">Cliente</p><p className="mt-1 font-medium">{selected.contact_name || "Anônimo"}</p></div>
                <div><p className="text-muted-foreground">E-mail</p><p className="mt-1 break-all font-medium">{selected.contact_email || "Não informado"}</p></div>
                <div><p className="text-muted-foreground">Pesquisa</p><p className="mt-1 font-medium">{surveyNames.get(selected.survey_id) ?? "Pesquisa removida"}</p></div>
                <div><p className="text-muted-foreground">Indicador e nota</p><p className="mt-1 font-medium">{scoreLabel(selected)} · {selected.score}</p></div>
                <div><p className="text-muted-foreground">Data</p><p className="mt-1 font-medium">{dateLabel(selected.created_at)}</p></div>
                <div><p className="text-muted-foreground">Responsável</p><p className="mt-1 font-medium">{selected.responsible || "Não atribuído"}</p></div>
              </div>
              <div><p className="text-muted-foreground">Tipo de atendimento</p><p className="mt-1">{selected.service_type || "Não informado"}</p></div>
              <div><p className="text-muted-foreground">Comentário</p><p className="mt-1 whitespace-pre-wrap rounded-md bg-muted/50 p-3">{selected.comment || "Nenhum comentário enviado."}</p></div>
              {selected.is_negative && <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-destructive">Esta avaliação está sinalizada para acompanhamento.</p>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
