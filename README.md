# REICHCSAT

Plataforma SaaS de pesquisas NPS/CSAT, análise de feedback e recuperação de clientes. Interface em português brasileiro.

## Estado desta branch

`portable-onnira-2026-10-29` é uma branch isolada para preparar a aplicação para hospedagem Node.js fora do Lovable. Ela não foi mesclada à branch funcional existente e não substitui a versão atual.

Esta branch remove a configuração de build exclusiva do Lovable, utiliza OAuth nativo do Supabase, prepara um servidor Nitro/Node.js e mantém as telas e funções existentes.

## Stack e comandos

Stack: React 19, TypeScript, Vite 8, TanStack Start, Nitro, Supabase, Drizzle e Bun.

Runtime de produção: Node.js 22.12.0 ou superior.

Instalar e executar localmente:

    bun install --frozen-lockfile
    bun run dev

Validar:

    bun run lint
    bun run test
    bun run typecheck
    bun run build

O build gera o servidor em `.output/server/index.mjs`; o script `npm run start` inicia essa saída. O servidor lê HOST/PORT através do runtime Nitro. O arquivo `.npmrc` ativa a resolução legacy de peer dependencies para a instalação npm; a CI valida `npm install`, lint, testes, build/typecheck e inicialização Node.

## Variáveis de ambiente

Copie `.env.example` para um arquivo local `.env` somente para desenvolvimento. O `.env` real não deve ser commitado nem incluído no ZIP.

Variáveis públicas de build, incorporadas ao JavaScript do navegador:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`
- `VITE_PUBLIC_SURVEY_BASE_URL`

Variáveis de runtime do servidor:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (segredo privado, somente servidor)

Nunca exponha uma chave service-role, uma chave secreta ou credenciais de provedor em variáveis VITE_ ou em arquivos públicos. O cliente administrativo do Supabase é usado somente em funções do servidor.

## Limite da migração

Esta branch prepara a hospedagem da aplicação na Onnira, mantendo o projeto Supabase atual como backend. Ela não migra Postgres, contas de usuário, autenticação, políticas RLS ou dados para outro serviço. Não execute migrations durante o deploy do aplicativo.

As credenciais de IA armazenadas são criptografadas usando uma chave derivada de `SUPABASE_SERVICE_ROLE_KEY`; mantenha exatamente o mesmo valor durante a migração de hospedagem. A autenticação Google usa `supabase.auth.signInWithOAuth`; adicione o novo domínio à lista de URLs de retorno permitidas do Supabase antes de ativar o login nele.

## Integrações

OpenAI ou Google Gemini podem ser configurados por organização na página Integrações. A credencial é criptografada no servidor e utilizada para análise dos comentários e transcrição de áudio. A integração Bitrix24 mantém a configuração existente no banco atual. Chamadas externas precisam ser validadas com credenciais reais após o deploy; CI não confirma a disponibilidade das contas e das APIs externas.

## Links públicos e áudio

As pesquisas usam links públicos legíveis. O cliente pode digitar um comentário ou solicitar transcrição de áudio. O áudio é enviado apenas ao endpoint de transcrição e não é guardado em tabelas/Storage do REICHCSAT; o texto deve ser revisado antes do envio.

## Deploy na Onnira

Siga o roteiro [ONNIRA_DEPLOY.md](./ONNIRA_DEPLOY.md). Ele descreve o ZIP, runtime Node.js, comandos, variáveis de ambiente, configuração OAuth, validação e a diferença entre mudar a hospedagem e migrar o backend.
