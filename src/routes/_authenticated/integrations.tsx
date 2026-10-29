import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/workspace";

export const Route = createFileRoute("/_authenticated/integrations")({
  head: () => pageHead("Integrações", "Gerencie as conexões do ReichCsat com seus serviços."),
  component: Page,
});

function Page() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Integrações</h1>
      <p className="mt-2 text-sm text-muted-foreground">Esta área ainda está em construção.</p>
    </div>
  );
}
