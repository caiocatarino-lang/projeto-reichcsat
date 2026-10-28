# REICHCSAT

Plataforma SaaS B2B em desenvolvimento para pesquisas NPS/CSAT e gestão da experiência do cliente, com foco em integração ao Bitrix24. A interface é em português do Brasil.

## Estado da entrega

Esta branch contém a base de autenticação e organizações, o dashboard com indicadores, a criação e gestão de pesquisas, além da primeira implementação da página pública de resposta em `/r/{token}`. Essas partes ainda precisam ser verificadas no ambiente Supabase conectado antes de serem consideradas prontas para produção.

As telas de Respostas, Tratativas, Integrações e Configurações ainda precisam ser concluídas. Campanhas, agendamento, distribuição por e-mail/WhatsApp/SMS, insights por IA, auditoria e gestão completa de usuários também permanecem no backlog.

**Proteção do fluxo público:** o token atualmente identifica uma pesquisa, não um destinatário específico do CRM. Por isso, a submissão pública não deve aceitar IDs de lead, negócio ou contato enviados pelo respondente nem criar comentários/tarefas no Bitrix24 a partir desses dados. A sincronização com registros específicos deve ser reativada somente depois da implementação de convites individualizados validados no servidor.

A integração real com Bitrix24 e os provedores de comunicação depende de configuração, credenciais, permissões e testes no ambiente autorizado. Não informe que uma operação externa foi concluída sem confirmação do provedor.

## Stack e comandos

O projeto usa React, TypeScript, TanStack Start, Vite, Supabase, Drizzle e Bun.

```sh
bun install --frozen-lockfile
bun run dev
```

Verificações locais:

```sh
bun run lint
bun run test
bun run build
```

## Configuração do Supabase

1. Copie `.env.example` para `.env` no ambiente local.
2. Preencha os valores usando o projeto Supabase que será conectado.
3. Em ambientes Lovable, configure as variáveis necessárias no backend/Cloud do projeto. Uma branch Git não cria nem transfere automaticamente a conexão com o banco.

Variáveis públicas do navegador:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Variáveis do runtime do servidor:
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`, somente se alguma operação administrativa de servidor realmente exigir essa chave.

Nunca use uma chave `service_role` ou `sb_secret_...` em uma variável `VITE_*`, no navegador ou no repositório. Mantenha segredos exclusivamente no ambiente de servidor. O arquivo `.env` deve permanecer ignorado pelo Git; use `.env.example` apenas com valores de exemplo.

## Banco de dados e migrações

O código contém migrações Drizzle em `drizzle/migrations`. Antes de aplicar uma migração ao banco de destino, confira o histórico aplicado e compare tabelas, funções, triggers, políticas RLS e dados existentes. Não aplique migrações cegamente nem suponha que um commit Git alterou o banco.

A migração `0002_harden_csat_and_functions.sql` foi adicionada nesta branch. **Ela ainda não foi aplicada ao Supabase**. Antes de aplicá-la, valide-a em uma base de desenvolvimento/homologação e confirme que o histórico do banco corresponde às migrações `0000` e `0001`.

Contas de autenticação pertencem ao projeto Supabase no qual foram criadas. Conectar outro projeto não transfere automaticamente usuários, senhas, organizações ou sessões. Mudanças de projeto exigem um plano de migração validado.

## Fluxo de trabalho seguro

- Trabalhe em uma branch de correção ou funcionalidade; preserve a `main`.
- Não faça merge ou publicação em produção sem aprovação explícita.
- Valide persistência, permissões e isolamento entre organizações, não apenas a aparência das telas.
- Diferencie testes unitários, mocks e testes reais com Supabase/provedores externos.
- Não registre tokens ou dados pessoais nos logs.
- Não marque módulos como concluídos sem testes verificáveis e documentação atualizada.
