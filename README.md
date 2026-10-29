# REICHCSAT

Plataforma em desenvolvimento para pesquisas NPS/CSAT e gestão de feedback. A interface é em português do Brasil.

## Estado da entrega

Este repositório contém a base de autenticação, organizações, schema inicial e estrutura de rotas. **As telas de Painel, Pesquisas, Respostas, Tratativas, Integrações e Configurações ainda são placeholders** nesta versão; não as considere funcionalidades prontas para produção.

A integração real com Bitrix24, Resend, Twilio e IA depende de configuração e testes específicos. Não se deve informar que uma operação externa foi concluída sem confirmação do provedor.

## Stack e comandos

O projeto usa React, TypeScript, TanStack Start, Vite, Supabase, Drizzle e Bun.

Instale o Bun e então execute:

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

1. O arquivo raiz `.env` deste branch mantém apenas a configuração pública do projeto Supabase usada pelo build Vite/Lovable Preview.
2. Confirme que `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` e `VITE_SUPABASE_PROJECT_ID` apontam para o projeto Supabase correto.
3. As variáveis `VITE_*` são incorporadas ao bundle do navegador e, portanto, são públicas. Não coloque segredos privados, tokens ou a chave `service_role` nesse arquivo. Segredos de servidor devem ficar apenas no gerenciador seguro do backend.

Variáveis públicas do navegador:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Variáveis do runtime do servidor:
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`

`VITE_SUPABASE_PUBLISHABLE_KEY` deve ser uma chave publicável. Nunca use uma chave `service_role` ou `sb_secret_...` em uma variável `VITE_*`, no navegador, ou no repositório. O cliente administrativo do servidor, quando necessário, exige `SUPABASE_SERVICE_ROLE_KEY`; mantenha-a apenas nos segredos do servidor e não a copie para código do cliente.

O arquivo raiz `.env` versionado contém exclusivamente a URL, o identificador do projeto e a chave publicável do Supabase para que o Lovable gere o preview. Mantenha segredos privados fora dele. Use `.env.example` como modelo para novos ambientes.

## Contas e banco de dados

Contas de autenticação pertencem ao projeto Supabase no qual foram criadas. **Conectar outro projeto não transfere automaticamente usuários, senhas, organizações ou sessões.** Se o backend de destino for novo e estiver sem contas, usuários antigos não conseguirão entrar nele até que seja feita uma migração apropriada ou que criem uma conta nova. Não copie hashes/sessões manualmente nem altere dados de produção sem um plano de migração validado.

O schema usa migrações Drizzle em `drizzle/migrations`. Antes de mudar o banco de destino, confira o histórico das migrações e compare as tabelas, funções, triggers e políticas RLS com o código. Não aplique a mesma migração cegamente nem suponha que um commit Git alterou o banco.

## Fluxo de trabalho seguro

- Trabalhe em uma branch de correção ou funcionalidade.
- Não faça merge ou publicação em produção sem aprovação.
- Valide a persistência e o isolamento entre organizações, não só a aparência da tela.
- Diferencie testes unitários, mocks e testes reais com Supabase/provedores externos.
- Não exponha credenciais nem registre tokens em logs.
