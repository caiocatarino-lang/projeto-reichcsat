import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Building2, Save, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { pageHead } from "@/lib/workspace";
import { membershipQuery, roleLabel, useMembership } from "@/lib/org";
import { updateOrganizationName } from "@/lib/workspace.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => pageHead("Configurações", "Gerencie seu perfil e os dados da organização ReichCsat."),
  component: Page,
});

function Page() {
  const queryClient = useQueryClient();
  const membership = useMembership();
  const [profileName, setProfileName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const canEditOrganization = membership.data?.role === "admin";
  const updateOrganization = useServerFn(updateOrganizationName);

  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user;
    },
    retry: false,
  });

  useEffect(() => {
    const metadataName = profileQuery.data?.user_metadata?.full_name;
    setProfileName(typeof metadataName === "string" ? metadataName : "");
  }, [profileQuery.data]);

  useEffect(() => {
    const organization = membership.data?.organizations as { name?: string } | null | undefined;
    if (organization?.name) setOrganizationName(organization.name);
  }, [membership.data]);

  const profileMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.updateUser({ data: { full_name: profileName.trim() } });
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Perfil atualizado");
    },
    onError: (error) => toast.error(error.message || "Não foi possível atualizar o perfil."),
  });

  const organizationMutation = useMutation({
    mutationFn: (name: string) => updateOrganization({ data: { name: name.trim() } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: membershipQuery.queryKey });
      await queryClient.invalidateQueries({ queryKey: ["workspace"] });
      toast.success("Organização atualizada");
    },
    onError: (error) => toast.error(error.message || "Não foi possível atualizar a organização."),
  });

  const loading = profileQuery.isLoading || membership.isLoading;
  const user = profileQuery.data;

  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">ReichCsat / Administração</p>
        <h1 className="mt-2 text-3xl font-semibold">Configurações</h1>
        <p className="mt-2 text-sm text-muted-foreground">Atualize as informações básicas do seu perfil e da organização.</p>
      </header>

      {loading && <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">Carregando configurações…</div>}
      {profileQuery.error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">Não foi possível carregar o perfil. Atualize a página ou entre novamente.</p>}
      {membership.error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">Não foi possível carregar a organização e suas permissões.</p>}

      {!loading && user && (
        <section className="rounded-xl border bg-card p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><UserRound className="size-5" /></div>
            <div><h2 className="text-lg font-semibold">Meu perfil</h2><p className="mt-1 text-sm text-muted-foreground">Informações usadas para identificar sua conta.</p></div>
          </div>
          <form className="mt-6 space-y-4" onSubmit={(event) => { event.preventDefault(); profileMutation.mutate(); }}>
            <div className="space-y-2">
              <Label htmlFor="profile-name">Nome de exibição</Label>
              <Input id="profile-name" autoComplete="name" maxLength={120} value={profileName} onChange={(event) => setProfileName(event.target.value)} placeholder="Como seu nome deve aparecer" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-email">E-mail da conta</Label>
              <Input id="profile-email" value={user.email ?? ""} readOnly disabled />
              <p className="text-xs text-muted-foreground">O e-mail de acesso não pode ser alterado nesta tela.</p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <p className="text-xs text-muted-foreground">Seu papel atual: {membership.data ? roleLabel[membership.data.role] ?? membership.data.role : "Não identificado"}</p>
              <Button type="submit" disabled={profileMutation.isPending || profileName.trim().length > 120}>
                <Save className="mr-2 size-4" />{profileMutation.isPending ? "Salvando…" : "Salvar perfil"}
              </Button>
            </div>
          </form>
        </section>
      )}

      {!loading && membership.data && (
        <section className="rounded-xl border bg-card p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Building2 className="size-5" /></div>
            <div><h2 className="text-lg font-semibold">Organização</h2><p className="mt-1 text-sm text-muted-foreground">O espaço em que pesquisas, respostas e tratativas são armazenadas.</p></div>
          </div>
          <form className="mt-6 space-y-4" onSubmit={(event) => { event.preventDefault(); organizationMutation.mutate(organizationName); }}>
            <div className="space-y-2">
              <Label htmlFor="organization-name">Nome da organização</Label>
              <Input id="organization-name" maxLength={120} required value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} disabled={!canEditOrganization} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <p className="text-xs text-muted-foreground">{canEditOrganization ? "Somente administradores podem alterar este campo." : "Peça ao administrador para alterar o nome da organização."}</p>
              <Button type="submit" disabled={!canEditOrganization || organizationMutation.isPending || !organizationName.trim()}>
                <Save className="mr-2 size-4" />{organizationMutation.isPending ? "Salvando…" : "Salvar organização"}
              </Button>
            </div>
          </form>
        </section>
      )}

      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-muted-foreground">
        A gestão completa de membros, convites, papéis avançados e autenticação multifator ainda não está disponível nesta versão.
      </div>
    </div>
  );
}
