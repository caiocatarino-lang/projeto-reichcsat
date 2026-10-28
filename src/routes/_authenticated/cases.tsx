import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { CheckCircle2, ClipboardCheck, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { workspaceQuery, pageHead } from "@/lib/workspace";
import { updateCase } from "@/lib/workspace.functions";
import { WorkspaceError, WorkspacePending } from "@/components/workspace-states";
import type { Tables } from "@/integrations/supabase/types";

type TreatmentStatus = "open" | "in_progress" | "resolved";
const statusLabel: Record<TreatmentStatus, string> = {
  open: "Aberta",
  in_progress: "Em andamento",
  resolved: "Resolvida",
};
const dateLabel = (value: string) => new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

export const Route = createFileRoute("/_authenticated/cases")({
  loader: async ({ context }) => { await context.queryClient.ensureQueryData(workspaceQuery); },
  head: () => pageHead("Tratativas", "Acompanhe a recuperação de clientes e suas avaliações negativas."),
  component: Page,
  errorComponent: WorkspaceError,
  pendingComponent: WorkspacePending,
});

function Page() {
  const { data } = useSuspenseQuery(workspaceQuery);
  const queryClient = useQueryClient();
  const saveCase = useServerFn(updateCase);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Tables<"cases"> | null>(null);
  const [status, setStatus] = useState<TreatmentStatus>("open");
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: (value: { id: string; status: TreatmentStatus; notes: string }) => saveCase({ data: value }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["workspace"] });
      toast.success("Tratativa atualizada");
      setSelected(null);
    },
    onError: (error) => toast.error(error.message || "Não foi possível atualizar a tratativa."),
  });

  const responseById = new Map(data.responses.map((response) => [response.id, response]));
  const surveyById = new Map(data.surveys.map((survey) => [survey.id, survey]));
  const cases = data.cases.filter((item) => {
    const response = responseById.get(item.response_id);
    const surveyName = response ? surveyById.get(response.survey_id)?.name ?? "" : "";
    const query = search.trim().toLocaleLowerCase("pt-BR");
    const matchesSearch = !query || [
      response?.contact_name,
      response?.contact_email,
      response?.comment,
      surveyName,
      response?.responsible,
    ].some((value) => (value ?? "").toLocaleLowerCase("pt-BR").includes(query));
    return matchesSearch && (filter === "all" || item.status === filter);
  }).sort((a, b) => {
    const aResponse = responseById.get(a.response_id);
    const bResponse = responseById.get(b.response_id);
    return (bResponse?.created_at ?? b.created_at).localeCompare(aResponse?.created_at ?? a.created_at);
  });

  function openCase(item: Tables<"cases">) {
    setSelected(item);
    setStatus(item.status);
    setNotes(item.notes ?? "");
  }

  return (
    <div className="space-y-7">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">ReichCsat / Recuperação de clientes</p>
        <h1 className="mt-2 text-3xl font-semibold">Tratativas</h1>
        <p className="mt-2 text-sm text-muted-foreground">Acompanhe avaliações negativas e registre as ações de recuperação.</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Abertas</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{data.cases.filter((item) => item.status === "open").length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Em andamento</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{data.cases.filter((item) => item.status === "in_progress").length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Resolvidas</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{data.cases.filter((item) => item.status === "resolved").length}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar cliente, pesquisa ou comentário" aria-label="Buscar tratativas" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-44" aria-label="Filtrar status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="open">Abertas</SelectItem>
            <SelectItem value="in_progress">Em andamento</SelectItem>
            <SelectItem value="resolved">Resolvidas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!cases.length ? (
        <div className="rounded-xl border border-dashed px-6 py-16 text-center">
          <CheckCircle2 className="mx-auto size-10 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">{data.cases.length ? "Nenhuma tratativa encontrada" : "Nenhuma tratativa registrada"}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{data.cases.length ? "Altere os filtros para consultar outras tratativas." : "Avaliações negativas registradas em pesquisas ativas gerarão itens para acompanhamento."}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Pesquisa</TableHead>
                <TableHead>Nota</TableHead>
                <TableHead>Recebida em</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cases.map((item) => {
                const response = responseById.get(item.response_id);
                const surveyName = response ? surveyById.get(response.survey_id)?.name ?? "Pesquisa removida" : "Resposta não encontrada";
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <p className="font-medium">{response?.contact_name || "Cliente anônimo"}</p>
                      <p className="max-w-64 truncate text-xs text-muted-foreground">{response?.comment || "Sem comentário"}</p>
                    </TableCell>
                    <TableCell className="max-w-48 truncate">{surveyName}</TableCell>
                    <TableCell className="font-semibold tabular-nums">{response ? (response.survey_type.toUpperCase() + " · " + response.score) : "—"}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm">{response ? dateLabel(response.created_at) : dateLabel(item.created_at)}</TableCell>
                    <TableCell>{statusLabel[item.status]}</TableCell>
                    <TableCell className="text-right"><Button variant="outline" size="sm" onClick={() => openCase(item)}>Acompanhar</Button></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => { if (!open && !mutation.isPending) setSelected(null); }}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Atualizar tratativa</DialogTitle>
            <DialogDescription>Registre o andamento da recuperação do cliente.</DialogDescription>
          </DialogHeader>
          {selected && (() => {
            const response = responseById.get(selected.response_id);
            return (
              <div className="space-y-5">
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="font-medium">{response?.contact_name || "Cliente anônimo"}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{response ? response.survey_type.toUpperCase() + " · Nota " + response.score : "Resposta não encontrada"}</p>
                  <p className="mt-3 whitespace-pre-wrap text-sm">{response?.comment || "O cliente não deixou comentário."}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="case-status">Status</Label>
                  <Select value={status} onValueChange={(value: TreatmentStatus) => setStatus(value)}>
                    <SelectTrigger id="case-status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Aberta</SelectItem>
                      <SelectItem value="in_progress">Em andamento</SelectItem>
                      <SelectItem value="resolved">Resolvida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="case-notes">Notas de acompanhamento</Label>
                  <Textarea id="case-notes" maxLength={4000} rows={5} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Descreva as ações realizadas e o próximo passo..." />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setSelected(null)} disabled={mutation.isPending}>Cancelar</Button>
                  <Button onClick={() => mutation.mutate({ id: selected.id, status, notes })} disabled={mutation.isPending}>
                    <ClipboardCheck className="mr-2 size-4" />{mutation.isPending ? "Salvando…" : "Salvar tratativa"}
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
