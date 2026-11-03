# REICHCSAT — implantação isolada na Onnira

> **Branch de portabilidade; não é a versão principal.** Este trabalho começa na versão funcional existente e não faz merge em `main` nem em `fix/auth-flow-2026-10-28`.

Branch: `portable-onnira-2026-10-29`  
Commit-base: `1751f7221ec49c509ad5e27d5bc81a0672205f1a`

## O que esta branch prepara

- TanStack Start + Nitro com o preset Node.js `node_server`.
- Inicialização Node em `node .output/server/index.mjs`, via `npm run start`.
- OAuth Google nativo do Supabase, sem a ponte de autenticação do Lovable.
- Arquivos de ambiente locais ignorados e sem `.env` real no pacote.
- Migração SQL `0003_public_survey_ids.sql` com delimitador PL/pgSQL corrigido.
- Instalação e validação do projeto usando npm.
- Geração automatizada de um ZIP com `package-lock.json`, sem lockfile/configuração Bun, arquivos de ambiente, dependências instaladas ou caches.

## Limite da migração

Esta implantação muda a **hospedagem da aplicação web e das funções de servidor**, mas continua usando o projeto Supabase existente como backend (Postgres, Auth e RLS). Não migra o banco nem as contas de usuários. **Não execute migrations SQL durante o deploy da aplicação.**

## Requisitos

- Node.js `22.12.0` ou superior.
- Projeto Supabase atual acessível pelo servidor da Onnira.
- Servidor: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- Build: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`, `VITE_PUBLIC_SURVEY_BASE_URL`.

As variáveis `VITE_*` são públicas e incorporadas ao bundle do navegador. Nunca adicione chaves privadas, service-role ou credenciais de IA a essas variáveis, ao ZIP ou ao GitHub.

### Importante sobre credenciais

As chaves de IA guardadas em `ai_provider_configs` são criptografadas usando uma chave derivada de `SUPABASE_SERVICE_ROLE_KEY`. Mantenha exatamente o mesmo valor durante a troca de hospedagem; alterá-lo pode impedir a descriptografia das credenciais existentes.

## ZIP correto para upload

**Não use o botão Code → Download ZIP do GitHub para esta publicação.** O ZIP bruto da branch pode não conter o lockfile npm gerado durante a instalação.

Use o artefato `REICHCSAT-ONNIRA-NPM` criado pela GitHub Actions. Ele contém `package.json` e `package-lock.json` na raiz, mantém `.env.example` como modelo e exclui:
- `bun.lock` e `bunfig.toml`;
- `.git`, `node_modules`, `.output`, `dist` e caches;
- `.env` real e outros arquivos de ambiente, exceto `.env.example`.

A CI executa `npm install`, confirma que `package-lock.json` foi gerado, testa `npm ci`, lint, testes, build/typecheck e inicialização do servidor Node antes de criar o artefato.

## Criar a aplicação na Onnira

No painel Cloud Apps, crie uma aplicação de origem ZIP e use:

| Campo | Valor |
|---|---|
| Nome | `REICHCSAT - Portabilidade` |
| Runtime | `node` |
| Diretório base | `/` |
| Instalação | `npm ci` |
| Build | `npm run build` |
| Inicialização | `npm run start` |
| Porta | `3000` (ou a porta definida pelo host) |

O projeto inclui `.npmrc` com a configuração de peer dependencies validada pela CI.

Configure variáveis e segredos no painel da Onnira antes do build e da inicialização. Se a Onnira separar variáveis de build e runtime, coloque as `VITE_*` na etapa de build e os segredos apenas no servidor. Se não houver mecanismo seguro para `SUPABASE_SERVICE_ROLE_KEY`, não publique em produção até confirmar esse recurso com o suporte.

## Configurar URLs do Supabase Auth

Quando receber a URL pública:

1. Abra Supabase → Authentication → URL Configuration.
2. Defina a Site URL para o novo endereço.
3. Adicione a URL exata à lista de Redirect URLs permitidas.
4. Confirme a configuração do provedor Google OAuth, se estiver habilitado.
5. Defina `VITE_PUBLIC_SURVEY_BASE_URL` com a URL pública final e faça novo build/deploy se necessário.

Consulte a [documentação oficial de Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls).

## Testes antes de trocar o domínio oficial

- [ ] Página inicial abre em HTTPS.
- [ ] Login, cadastro e recuperação de senha funcionam.
- [ ] Google OAuth retorna ao domínio novo, se utilizado.
- [ ] Rotas internas funcionam ao atualizar diretamente a página.
- [ ] Pesquisa pública abre sem autenticação e recebe resposta.
- [ ] Resposta salva aparece no dashboard.
- [ ] Transcrição de áudio e briefing de IA funcionam com credenciais válidas.
- [ ] Bitrix24 valida a conexão.
- [ ] O isolamento entre organizações permanece correto.
- [ ] Logs não expõem segredos ou dados pessoais desnecessários.

Mantenha a hospedagem atual ativa até concluir os testes. Esta branch e o ZIP não alteram a versão funcional existente.

## API e documentação Onnira

Consulte [https://onnira.com/docs](https://onnira.com/docs) para criação de Cloud Apps, upload ZIP e acompanhamento de deploy. A publicação é assíncrona: HTTP 202 indica que o processamento começou, não que a aplicação está pronta.
