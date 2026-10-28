import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/workspace";

export const Route = createFileRoute("/_authenticated/cases")({
  head: () => pageHead("Tratativas", "Acompanhe a recuperação de clientes e suas avaliações negativas."),
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
