import { useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WorkspaceError() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return <div role="alert" className="py-20 text-center"><h1 className="text-xl font-semibold">Não foi possível carregar os dados</h1>
    <Button className="mt-6" onClick={async () => { await queryClient.resetQueries({ queryKey: ["workspace"] }); await router.invalidate(); }}><RefreshCw />Tentar novamente</Button></div>;
}
export function WorkspacePending() {
  return <div role="status" className="py-20 text-center text-muted-foreground">Carregando dados…</div>;
}