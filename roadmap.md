# REICHCSAT — roadmap de entrega

## Implementado nesta branch — aguardando validação no ambiente real
- [x] Base de autenticação, organizações e memberships.
- [x] Dashboard com filtros, NPS/CSAT, evolução e respostas recentes.
- [x] Gestão de pesquisas: criação, edição, prévia, duplicação e status.
- [x] Alinhar escala CSAT do formulário com escalas suportadas pelo banco.
- [x] Validar notas públicas de acordo com o tipo e a escala da pesquisa.
- [x] Adicionar página de resposta pública em `/r/{token}`.
- [x] Impedir que payloads públicos escolham livremente entidade do CRM ou canal de origem.
- [x] Preparar migração de hardening para regras de CSAT e funções privilegiadas; ainda não aplicada ao banco.

## P0 — segurança e integridade
- [ ] Verificar se o histórico anterior do repositório continha segredos reais e rotacionar credenciais expostas, se aplicável.
- [ ] Validar autenticação e isolamento multi-tenant no Supabase conectado.
- [ ] Aplicar a migração `0002_harden_csat_and_functions.sql` somente após validar o histórico em ambiente de desenvolvimento.
- [ ] Implementar proteção contra abuso/rate limiting para respostas públicas.
- [ ] Criar convites individualizados, vinculados no servidor ao destinatário e ao registro do CRM.

## P1 — MVP funcional
- [ ] Executar testes de ponta a ponta de cadastro, login, sessão e recuperação de acesso.
- [ ] Implementar listagem e detalhe de respostas com filtros, paginação e proteção de dados.
- [ ] Concluir a fila de tratativas e atualização do status.
- [ ] Concluir a tela de Integrações e tratamento de erros de configuração.
- [ ] Integrar o Bitrix24 somente usando associações de CRM validadas por convite.
- [ ] Confirmar cálculos e gatilhos de NPS/CSAT contra o banco real.

## P2 — operação
- [ ] Campanhas, disparos, agendamento e histórico de entregas.
- [ ] Envio por e-mail com provedor real e estados de entrega.
- [ ] Gestão de usuários e matriz de permissões.
- [ ] Configurações da organização, exportações e trilha de auditoria.

## P3 — expansão
- [ ] WhatsApp e SMS com provedores autorizados.
- [ ] Insights com IA baseados nos comentários reais.
- [ ] OAuth/app marketplace do Bitrix24, conforme estratégia comercial.
- [ ] Monitoramento, limites de plano e ferramentas administrativas.

## Critério de lançamento
Não considerar o produto pronto para produção até que autenticação, isolamento multi-tenant, respostas públicas, regras de cálculo, integrações críticas, mitigação contra abuso, backups e testes automatizados estejam validados em ambiente autorizado.
