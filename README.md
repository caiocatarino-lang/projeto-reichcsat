# REICHCSAT

Plataforma SaaS B2B em desenvolvimento para pesquisas NPS/CSAT e gestão da experiência do cliente, com foco em integração ao Bitrix24. A interface é em português do Brasil.

## Estado atual da entrega

A branch de trabalho contém:
- Base de autenticação, organizações e associações de usuários.
- Dashboard com indicadores NPS/CSAT e filtros.
- Gestão de pesquisas: criação, edição, prévia, duplicação e status.
- Página pública de respostas em `/r/{token}`, com validação da nota de acordo com o tipo e a escala da pesquisa.
- Área de Respostas com busca, filtros, detalhes e exportação CSV.
- Área de Clientes derivada do histórico de respostas.
- Fila de Tratativas com atualização de status e notas.
- Configurações básicas de perfil e nome da organização.
- Central de ajuda com instruções de uso.
- Tela de integração Bitrix24 com conexão por webhook, diagnóstico de registros e opções de configuração.
- Testes unitários de indicadores, validação de respostas públicas e validação de URLs de webhook.

As funcionalidades acima precisam ser verificadas no ambiente Supabase real antes de serem consideradas prontas para produção. Campanhas agendadas, distribuição de pesquisas por provedores reais, gestão completa de usuários e permissões, análise por IA, auditoria completa e observabilidade/recuperação de produção ainda precisam ser desenvolvidas ou validadas.

**Limite de segurança da integração:** o token público atualmente identifica uma pesquisa, não um destinatário específico do CRM. A submissão pública não aceita IDs de lead/negócio/contato enviados pelo respondente e não cria comentários/tarefas no Bitrix24 a partir desses dados. A sincronização por resposta deve ser implementada após a criação de convites individuais validados no servidor.

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

Nunca use uma chave `service_role` ou `sb_secret_...` em variável `VITE_*`, no navegador ou no repositório. Mantenha segredos exclusivamente no ambiente de servidor. O arquivo `.env` deve permanecer ignorado pelo Git; use `.env.example` apenas com valores de exemplo.

## Banco de dados e migrações

O código contém migrações Drizzle em `drizzle/migrations`. Antes de aplicar uma migração ao banco de destino, confira o histórico aplicado e compare tabelas, funções, triggers, políticas RLS e dados existentes. Não aplique migrações cegamente nem suponha que um commit Git alterou o banco.

A migração `0002_harden_csat_and_functions.sql` foi adicionada nesta branch e **não foi aplicada ao Supabase**. Valide-a em uma base de desenvolvimento/homologação e compare o histórico do banco com as migrações anteriores antes de aplicá-la.

A verificação automatizada de CI usa variáveis de ambiente de exemplo; sucesso no CI não comprova a conexão ao Supabase real, o isolamento multi-tenant em produção nem a integração efetiva com Bitrix24.

Contas de autenticação pertencem ao projeto Supabase no qual foram criadas. Conectar outro projeto não transfere automaticamente usuários, senhas, organizações ou sessões. Mudanças de projeto exigem um plano de migração validado.

## Fluxo de trabalho seguro

- Trabalhe em uma branch de correção ou funcionalidade; preserve a `main`.
- Não faça merge ou publicação em produção sem aprovação explícita.
- Valide persistência, permissões e isolamento entre organizações, não apenas a aparência das telas.
- Diferencie testes unitários, mocks e testes reais com Supabase/provedores externos.
- Não registre tokens ou dados pessoais nos logs.
- Não considere o produto pronto para produção sem mitigação contra abuso de links públicos, backups, observabilidade e testes de recuperação.
