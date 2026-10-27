import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/cases")({
  head: () => ({ meta: [{ title: "Tratativas — ReichCsat" }] }),
  component: Page,
});

function Page() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Tratativas</h1>
      <p className="mt-2 text-sm text-muted-foreground">Esta área ainda está em construção.</p>
    </div>
  );
}
