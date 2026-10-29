import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/workspace";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => pageHead("Configurações", "Gerencie sua organização e equipe no ReichCsat."),
  component: Page,
});

function Page() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Configurações</h1>
      <p className="mt-2 text-sm text-muted-foreground">Esta área ainda está em construção.</p>
    </div>
  );
}
