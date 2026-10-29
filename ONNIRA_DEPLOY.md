# REICHCSAT — implantação isolada na Onnira

> **Branch de portabilidade; não é a versão principal.** Este trabalho começa na versão funcional existente e não faz merge em `main` nem em `fix/auth-flow-2026-10-28`.

Branch: `portable-onnira-2026-10-29`  
Commit-base: `1751f7221ec49c509ad5e27d5bc81a0672205f1a`


Último commit validado para build Node.js: `090ecde38265a1fb5e937dbeff86690368f45c22`. O CI desse commit passou em lint, testes, typecheck, build e smoke test de inicialização do servidor Node.js: [resultado no GitHub Actions](https://github.com/caiocatarino-lang/projeto-reichcsat/actions/runs/40957206316).

## O que esta branch prepara

- Substitui a configuração de build exclusiva do Lovable por TanStack Start + Nitro com o preset Node.js `node_server`.
- Adiciona o comando de inicialização `npm run start` (`node .output/server/index.mjs`).
- Remove a ponte de autenticação do preview do Lovable e usa o fluxo OAuth nativo do Supabase para Google.
- Remove o arquivo `.env` versionado e ignora arquivos de ambiente locais; mantém apenas `.env.example` como modelo.
- Remove metadados e telemetria exclusivos do Lovable.
- Corrige o delimitador da função SQL na migration `0003_public_survey_ids.sql`.
- Adiciona typecheck e smoke test do servidor Node.js à validação CI.

## Limite da migração

Esta implantação muda a **hospedagem da aplicação web e das funções de servidor**, mas continua usando o projeto Supabase existente como backend (Postgres, Auth e RLS). A documentação pública da Onnira descreve Cloud Apps e endpoints de IA, mas não documenta um substituto completo para o banco e o Auth do Supabase. Portanto, não considere esta etapa uma migração do banco ou das contas de usuários.

**Não execute as migrations SQL durante o deploy da aplicação.** Como o destino continua sendo o Supabase atual, as tabelas e políticas de produção devem permanecer intactas.

## Requisitos

- Node.js `22.12.0` ou superior no ambiente de build/runtime.
- Projeto Supabase atual acessível a partir do servidor da Onnira.
- No ambiente do servidor: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` e `SUPABASE_SERVICE_ROLE_KEY`.
- No ambiente de build: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` e, depois de obter a URL pública da aplicação, `VITE_PUBLIC_SURVEY_BASE_URL`.

As variáveis `VITE_*` fazem parte do bundle do navegador e são **públicas**. Nunca adicione uma chave service-role, chave secreta de provedor ou outro segredo a essas variáveis, a um ZIP ou ao GitHub.

### Importante sobre as credenciais

O REICHCSAT criptografa as chaves de IA guardadas em `ai_provider_configs` usando uma chave derivada de `SUPABASE_SERVICE_ROLE_KEY`. Nesta migração, mantenha exatamente a mesma chave do servidor atual; trocar a chave-mestra pode impedir a descriptografia de credenciais já armazenadas. Se a chave atual não estiver disponível, planeje uma rotação controlada e salve novamente as credenciais de IA depois da mudança.

## Caminho A — criar o app por ZIP

1. Abra [esta branch no GitHub](https://github.com/caiocatarino-lang/projeto-reichcsat/tree/portable-onnira-2026-10-29).
2. Clique em **Code → Download ZIP**. O download pode ser feito por [este link direto de ZIP](https://github.com/caiocatarino-lang/projeto-reichcsat/archive/refs/heads/portable-onnira-2026-10-29.zip).
3. Extraia o arquivo. O ZIP do GitHub inclui uma pasta raiz com o nome do repositório e da branch. Para enviar à Onnira, compacte o **conteúdo dessa pasta** em um novo arquivo `REICHCSAT-onnira.zip`, deixando `package.json` na raiz do ZIP. Não inclua `.git`, `node_modules`, `.output`, `dist`, nem arquivos `.env`.
4. Na Onnira, crie uma aplicação Cloud Apps a partir de ZIP. Use:
   - Nome: `REICHCSAT - Portabilidade`
   - Runtime: `node`
   - Diretório base: `/`
   - Instalação: `npm install`
   - Build: `npm run build`
   - Inicialização: `npm run start`
   - Porta: `3000` (ou a porta que a Onnira definir e informar ao processo via `PORT`)
   - Tamanho: comece por `starter` no ambiente de teste e ajuste conforme o uso real.
5. Configure as variáveis de ambiente/segredos no painel da Onnira **antes do build e da inicialização**. Se a Onnira separar variáveis de build das variáveis de runtime, configure as `VITE_*` no build e as demais no servidor. Se o painel não oferecer um mecanismo seguro de secrets de runtime, interrompa antes de produção e confirme isso com o suporte Onnira; não coloque `SUPABASE_SERVICE_ROLE_KEY` no ZIP.
6. Execute o deploy e acompanhe o status e os logs até que a aplicação esteja em estado `RUNNING`.

**Alternativa para variáveis públicas de build:** se a Onnira não permitir definir `VITE_*` no build, crie apenas na cópia temporária local um arquivo `.env.production` com os quatro valores públicos `VITE_*`, então gere o ZIP. Esses valores serão incorporados ao JavaScript e não são segredos. Nunca inclua a service-role key ou chaves de IA nesse arquivo. Não versione `.env.production`.

## Caminho B — conectar ao GitHub

Se a Onnira puder acessar este repositório (por integração GitHub ou autorização equivalente), crie a aplicação usando a origem GitHub e selecione:

- Repositório: `caiocatarino-lang/projeto-reichcsat`
- Branch: `portable-onnira-2026-10-29`

Confirme no painel que o runtime Node.js está usando os comandos de instalação, build e start indicados acima. Se a configuração por GitHub não permitir controlar esses comandos, utilize o caminho por ZIP, que expõe esses campos no fluxo documentado pela Onnira.

## Configuração das variáveis

| Variável | Onde | Valor |
|---|---|---|
| `VITE_SUPABASE_URL` | Build | URL pública do projeto Supabase atual |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Build | Chave publicável do mesmo projeto |
| `VITE_SUPABASE_PROJECT_ID` | Build | Project ref Supabase |
| `VITE_PUBLIC_SURVEY_BASE_URL` | Build | URL pública fornecida pela Onnira |
| `SUPABASE_URL` | Servidor | URL do projeto Supabase |
| `SUPABASE_PUBLISHABLE_KEY` | Servidor | Chave publicável do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Segredo de servidor | Chave administrativa **privada** do mesmo projeto |

Não configure `DATABASE_URL` para a aplicação em runtime. Ela só seria necessária para operações de migração/Drizzle executadas deliberadamente por um operador autorizado.

## URLs de autenticação

Quando a Onnira gerar a primeira URL pública:

1. No Supabase, abra **Authentication → URL Configuration**.
2. Defina a Site URL para o novo endereço e adicione a URL exata do domínio Onnira à lista de Redirect URLs permitidas.
3. Se o login Google estiver habilitado, mantenha o provedor configurado no Supabase e confira as URLs de retorno permitidas.
4. Atualize `VITE_PUBLIC_SURVEY_BASE_URL` para a URL pública definitiva da aplicação e faça um novo build/deploy.

A URL de redirect precisa estar na allow-list do Supabase Auth. Consulte a [documentação oficial de Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls).

## Testes de aceite antes de trocar o domínio oficial

- [ ] A página inicial responde por HTTPS.
- [ ] Entrar com e-mail/senha, cadastro e confirmação de e-mail funcionam.
- [ ] Google OAuth retorna ao novo domínio, se estiver habilitado.
- [ ] Atualizar diretamente `/responses`, `/cases` e `/integrations` não retorna 404.
- [ ] Links `/pesquisa/...` abrem sem login e aceitam uma resposta de teste.
- [ ] O dashboard mostra a resposta gravada no Supabase atual.
- [ ] Transcrição de áudio e briefing de IA funcionam com uma credencial já configurada.
- [ ] O Bitrix24 valida a conexão e mantém as opções existentes.
- [ ] Os dados de uma organização não ficam visíveis para outra.
- [ ] Logs da aplicação não mostram segredos, tokens ou dados pessoais completos.

Mantenha a hospedagem atual ativa e não troque o domínio oficial até concluir a lista. O deploy na Onnira não altera nem mescla a versão atual.

## Acompanhar o deploy pela API Onnira

A documentação oficial descreve `POST /cloud/apps` com upload multipart usando `source_zip`, além dos endpoints para consultar a aplicação, deploy e logs. A autenticação é feita com uma chave Bearer da Onnira.

- [Documentação oficial Onnira](https://onnira.com/docs)
- `GET /cloud/apps`: listar as aplicações acessíveis à chave.
- `GET /cloud/apps/{id}`: conferir estado e URL pública.
- `GET /cloud/apps/{id}/deployments/{deployment_id}`: consultar a publicação.
- `GET /cloud/apps/{id}/logs`: ver falhas de build ou runtime.

O deploy é assíncrono; HTTP 202 significa que o processamento começou, não que a aplicação já esteja pronta.
