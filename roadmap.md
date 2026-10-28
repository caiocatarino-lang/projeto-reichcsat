# REICHCSAT — roadmap de entrega

## Implementado nesta branch — aguardando validação no ambiente real
- [x] Base de autenticação, organizações e memberships.
- [x] Dashboard com filtros, indicadores NPS/CSAT, evolução e respostas recentes.
- [x] Gestão de pesquisas: criação, edição, prévia, duplicação e status.
- [x] Validar escala CSAT no frontend e no schema de entrada contra escalas aceitas pelo banco (5 e 10).
- [x] Validar score público segundo o tipo e a escala da pesquisa.
- [x] Implementar página pública de resposta em `/r/{token}`.
- [x] Adicionar área de Respostas com busca, filtros, detalhes e CSV.
- [x] Adicionar diretório de Clientes a partir do histórico de respostas.
- [x] Adicionar fila de Tratativas com atualização de status e notas.
- [x] Adicionar configurações básicas de perfil e organização.
- [x] Adicionar Central de Ajuda.
- [x] Adicionar tela de Integrações Bitrix24, diagnóstico de lead/negócio e tratamento de erros.
- [x] Restringir URL de webhook a HTTPS, formato esperado e domínios Bitrix24 Cloud permitidos.
- [x] Preparar migração `0002_harden_csat_and_functions.sql`; ainda não aplicada ao banco.

## P0 — segurança e integridade
- [ ] Verificar se o histórico anterior do repositório continha segredos reais e rotacionar credenciais expostas, se aplicável.
- [ ] Validar autenticação, permissões e isolamento multi-tenant no Supabase conectado.
- [ ] Conferir o histórico real do banco e aplicar/testar a migração `0002` em ambiente de desenvolvimento antes de produção.
- [ ] Implementar rate limiting/mitigação de abuso para a página pública.
- [ ] Implementar convites individualizados, vinculados no servidor ao destinatário e ao registro do CRM.
- [ ] Validar fluxos de cadastro, confirmação de e-mail, login, sessão e recuperação no ambiente conectado.

## P1 — MVP funcional
- [ ] Executar testes de ponta a ponta para pesquisas, respostas, exportações e tratativas contra o Supabase real.
- [ ] Validar experiência responsiva e acessibilidade nos principais fluxos.
- [ ] Reativar integração de resposta com Bitrix24 somente usando associações de CRM validadas por convite.
- [ ] Validar cálculos e gatilhos de NPS/CSAT contra o banco real, incluindo avaliações negativas e criação de casos.
- [ ] Implementar paginação e agregações no servidor para evitar carregar todo o histórico de respostas.
- [ ] Concluir matriz de permissões e gestão de usuários/membros.

## P2 — operação
- [ ] Campanhas, disparos, agendamento e histórico de entregas.
- [ ] Envio de e-mail com provedor real e estados de entrega.
- [ ] Automações de disparo por evento do CRM e por período.
- [ ] Relatórios exportáveis e trilha de auditoria.
- [ ] Monitoramento de erros, backups e plano de recuperação.

## P3 — expansão
- [ ] WhatsApp e SMS com provedores autorizados.
- [ ] Insights com IA baseados nos comentários reais.
- [ ] OAuth/app marketplace do Bitrix24, conforme estratégia comercial.
- [ ] Limites de plano e ferramentas administrativas avançadas.

## Critério de lançamento
Não considerar o produto pronto para produção até que autenticação, isolamento multi-tenant, respostas públicas, regras de cálculo, integrações críticas, mitigação contra abuso, backups, monitoramento e testes automatizados estejam validados em ambiente autorizado.
