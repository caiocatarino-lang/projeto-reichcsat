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

## Comentários por áudio nas pesquisas públicas

Na pesquisa pública, o respondente pode gravar até 60 segundos de áudio, ouvir a gravação e solicitar a transcrição para preencher o campo de comentário. O texto é adicionado ao campo editável para revisão antes do envio. O áudio é mantido temporariamente no navegador e enviado ao endpoint do servidor para transcrição; ele não é salvo em tabelas nem em Storage do REICHCSAT.

A transcrição utiliza a OpenAI Audio Transcriptions API com o modelo `gpt-transcribe`, em português. Configure `OPENAI_API_KEY` como segredo exclusivamente no ambiente do servidor/Lovable Cloud. Sem essa chave configurada, o fluxo textual da pesquisa continua disponível, mas a transcrição retorna uma mensagem informativa. O áudio é limitado a 8 MB e o endpoint aplica validações de formato, pesquisa ativa, origem da requisição e limite temporário de uso.

Antes de enviar a resposta, o cliente deve revisar a transcrição porque nomes próprios, siglas e ruído podem produzir erros. A gravação só é enviada ao serviço de transcrição quando o respondente aciona o botão específico; ela não é anexada à resposta final.

## Tratativas com briefing de IA

A área de Tratativas apresenta a nota e o comentário original e pode gerar um briefing estruturado de recuperação: resumo, problema principal, necessidade provável, sinais de sentimento no texto, urgência sugerida, abordagem, frase de abertura, próximos passos e pontos a evitar. O briefing é salvo em `cases.ai_briefing` e permanece vinculado à tratativa.

A geração usa a OpenAI Responses API no servidor, com `store: false`. O modelo recebe apenas a nota, tipo de pesquisa, canal, tipo de atendimento, nome da pesquisa e comentário com e-mails/telefones ocultados. Nome e e-mail do contato não são enviados no pedido à IA. A saída é validada no servidor e a chave nunca deve ser exposta no navegador.

**Configuração necessária:** definir `OPENAI_API_KEY` como segredo de servidor em Lovable Cloud. Opcionalmente, definir `OPENAI_MODEL`; por padrão é usado `gpt-6-luna`. Sem a chave, o painel informa que a IA não está configurada e a geração não funciona ainda. O consumo da API pode gerar custos à conta do provedor.

A análise é assistiva e descreve somente sinais presentes no comentário; o colaborador deve confirmar a causa com o cliente antes de assumir fatos ou prometer prazos. A IA não deve ser usada para inferir características psicológicas ou sensíveis do cliente.

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

## Links públicos de pesquisa

Os links de pesquisa usam caminhos legíveis como `/pesquisa/nome-da-pesquisa-<id-publico>`, sem parâmetros de consulta para canal. Os identificadores públicos são gerados no banco e são distintos do token legado.

Para que links copiados não exibam `lovable.app`, conecte um domínio próprio ao projeto em Lovable e configure `VITE_PUBLIC_SURVEY_BASE_URL` com a URL pública final (sem barra ao final). No preview, se essa variável não estiver configurada, o app usa a origem do próprio preview.

Após o envio de uma resposta pública, a página de confirmação direciona o cliente ao Instagram público da BR24. Não use URL interna de uma oportunidade do Bitrix24 como destino público, porque ela pode exigir sessão de CRM.

## Contas e banco de dados

Contas de autenticação pertencem ao projeto Supabase no qual foram criadas. **Conectar outro projeto não transfere automaticamente usuários, senhas, organizações ou sessões.** Se o backend de destino for novo e estiver sem contas, usuários antigos não conseguirão entrar nele até que seja feita uma migração apropriada ou que criem uma conta nova. Não copie hashes/sessões manualmente nem altere dados de produção sem um plano de migração validado.

O schema usa migrações Drizzle em `drizzle/migrations`. Antes de mudar o banco de destino, confira o histórico das migrações e compare as tabelas, funções, triggers e políticas RLS com o código. Não aplique a mesma migração cegamente nem suponha que um commit Git alterou o banco.

## Fluxo de trabalho seguro

- Trabalhe em uma branch de correção ou funcionalidade.
- Não faça merge ou publicação em produção sem aprovação.
- Valide a persistência e o isolamento entre organizações, não só a aparência da tela.
- Diferencie testes unitários, mocks e testes reais com Supabase/provedores externos.
- Não exponha credenciais nem registre tokens em logs.
