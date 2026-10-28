import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, CheckCircle2, CircleHelp, ShieldAlert } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/workspace";

export const Route = createFileRoute("/_authenticated/help")({
  head: () => pageHead("Central de ajuda", "Aprenda a configurar e utilizar o ReichCsat."),
  component: HelpPage,
});

function HelpPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">ReichCsat / Orientação</p>
        <h1 className="mt-2 text-3xl font-semibold">Central de ajuda</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Guias rápidos para configurar pesquisas, interpretar indicadores e acompanhar avaliações críticas.</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <BookOpen className="size-5 text-primary" />
          <h2 className="mt-3 font-semibold">Guias práticos</h2>
          <p className="mt-1 text-sm text-muted-foreground">Instruções por etapa dentro de cada módulo.</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <CheckCircle2 className="size-5 text-primary" />
          <h2 className="mt-3 font-semibold">Boas práticas</h2>
          <p className="mt-1 text-sm text-muted-foreground">Regras para criar pesquisas comparáveis e acionáveis.</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <CircleHelp className="size-5 text-primary" />
          <h2 className="mt-3 font-semibold">Solução de dúvidas</h2>
          <p className="mt-1 text-sm text-muted-foreground">Entenda os estados e os limites atuais do produto.</p>
        </div>
      </div>

      <section className="rounded-xl border bg-card px-5 sm:px-6">
        <Accordion type="single" collapsible>
          <AccordionItem value="start">
            <AccordionTrigger>1. Por onde começar?</AccordionTrigger>
            <AccordionContent>
              <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                <li>Abra <strong className="text-foreground">Visão geral</strong> para consultar os indicadores da sua organização.</li>
                <li>Acesse <strong className="text-foreground">Pesquisas</strong> e selecione <strong className="text-foreground">Nova pesquisa</strong>.</li>
                <li>Escolha NPS ou CSAT, revise a pergunta, configure a escala aplicável e salve como rascunho.</li>
                <li>Confira a prévia antes de ativar a pesquisa e compartilhar o link.</li>
              </ol>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="surveys">
            <AccordionTrigger>2. Como criar uma pesquisa NPS ou CSAT?</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p><strong className="text-foreground">NPS</strong> mede a propensão a recomendar e usa notas de 0 a 10.</p>
                <p><strong className="text-foreground">CSAT</strong> mede satisfação com uma experiência específica. Nesta versão, a escala disponível é de 1 a 5 ou de 1 a 10. Defina a nota mínima considerada satisfeita.</p>
                <p>Use nomes claros, perguntas objetivas e mantenha a mesma metodologia ao comparar pesquisas ao longo do tempo.</p>
                <p>Pesquisas com respostas não devem mudar de tipo ou escala; para alterar a metodologia, crie uma nova versão.</p>
                <Button asChild variant="outline" size="sm"><Link to="/surveys">Abrir Pesquisas</Link></Button>
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="responses">
            <AccordionTrigger>3. Como consultar e exportar respostas?</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Acesse <strong className="text-foreground">Respostas</strong> para buscar por nome, e-mail, comentário, responsável ou pesquisa.</p>
                <p>Use os filtros para separar NPS, CSAT e avaliações sinalizadas. Abra os detalhes para consultar o comentário e os dados registrados.</p>
                <p>O botão <strong className="text-foreground">Exportar CSV</strong> baixa as respostas que correspondem aos filtros atuais. Proteja o arquivo exportado, pois ele pode conter dados pessoais.</p>
                <Button asChild variant="outline" size="sm"><Link to="/responses">Abrir Respostas</Link></Button>
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="cases">
            <AccordionTrigger>4. Como trabalhar uma avaliação negativa?</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Acesse <strong className="text-foreground">Tratativas</strong>, abra o caso e atualize o status para Aberta, Em andamento ou Resolvida.</p>
                <p>Registre nas notas o contato realizado, a causa identificada e o próximo passo. Evite incluir senhas, dados financeiros ou informações que não sejam necessárias para a recuperação do cliente.</p>
                <p>Casos são gerados pelo banco quando uma resposta se enquadra na regra de avaliação negativa configurada.</p>
                <Button asChild variant="outline" size="sm"><Link to="/cases">Abrir Tratativas</Link></Button>
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="metrics">
            <AccordionTrigger>5. Como interpretar NPS e CSAT?</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p><strong className="text-foreground">NPS:</strong> percentual de promotores (9–10) menos percentual de detratores (0–6). Notas 7–8 são neutras. O resultado varia de -100 a +100.</p>
                <p><strong className="text-foreground">CSAT:</strong> quantidade de respostas iguais ou acima do limite de satisfação dividida pela quantidade de respostas válidas, multiplicada por 100.</p>
                <p>Não compare resultados com escalas ou regras diferentes sem normalizar a metodologia. Observe também o volume de respostas e a taxa de resposta; um indicador isolado não explica a causa da insatisfação.</p>
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="bitrix">
            <AccordionTrigger>6. Como configurar o Bitrix24?</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Um administrador pode colar o webhook de entrada em <strong className="text-foreground">Integrações</strong> e testar o acesso a um lead ou negócio. Use apenas as permissões necessárias e não compartilhe a URL do webhook.</p>
                <p><strong className="text-foreground">Limite atual:</strong> a tela valida a conexão e permite consultar registros, mas a associação automática de respostas públicas a um lead/negócio ainda está desativada até que existam convites individuais vinculados e validados no servidor. Não considere a resposta sincronizada apenas porque o portal está conectado.</p>
                <Button asChild variant="outline" size="sm"><Link to="/integrations">Abrir Integrações</Link></Button>
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="troubleshoot">
            <AccordionTrigger>7. Por que uma pesquisa ou integração não funciona?</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Se uma pesquisa não abrir, confirme que o status está Ativa e que o link está completo.</p>
                <p>Se não conseguir salvar uma pesquisa, revise a pergunta, a escala CSAT e a nota mínima de satisfação.</p>
                <p>Se o Bitrix24 falhar, valide o domínio do portal, o formato do webhook, as permissões do usuário e o ID do registro usado no teste.</p>
                <p>Alguns recursos, incluindo campanhas agendadas, envio por e-mail/WhatsApp/SMS, análise por IA e gestão completa de usuários, ainda não estão liberados nesta versão.</p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
        <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-600" />
        <p className="text-muted-foreground">O ReichCsat permanece em desenvolvimento. Antes de usar com clientes reais, valide a configuração do Supabase, políticas de acesso, backups, proteção contra abuso de links públicos e os fluxos de integração no ambiente autorizado.</p>
      </div>
    </div>
  );
}
