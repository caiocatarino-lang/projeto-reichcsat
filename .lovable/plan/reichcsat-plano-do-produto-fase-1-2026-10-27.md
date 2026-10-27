# ReichCsat — Plano do Produto (Fase 1)

Identidade: logo enviado (infinito azul/ciano, "A inteligência por trás da voz do cliente"). Tema escuro azul-marinho com acentos azul e ciano; fontes Sora (títulos) + Manrope (texto).

## 1. Visão
Plataforma para criar, disparar e analisar pesquisas NPS e CSAT integradas ao Bitrix24, transformando avaliações negativas em tarefas de recuperação e usando IA para entender o porquê das notas.

## 2. Requisitos (rastreabilidade)

| ID | Requisito | Origem | Módulo | Teste de aceite |
|---|---|---|---|---|
| R1 | Criar e personalizar pesquisas NPS e CSAT | PDF NPS (explícito) | Pesquisas | Criar, editar, duplicar, arquivar; prévia antes de publicar |
| R2 | Envio automático por evento do CRM ou período | PDF NPS (explícito) | Campanhas / Bitrix24 | Evento do Bitrix (ex.: negócio ganho) gera envio; agendamento periódico dispara |
| R3 | Registrar notas e comentários vinculados ao cliente no Bitrix24 | PDF NPS (explícito) | Respostas / Bitrix24 | Resposta aparece na linha do tempo do lead/negócio |
| R4 | Painel por período, responsável e tipo de atendimento | PDF NPS (explícito) | Dashboard | Filtros alteram NPS/CSAT calculados de dados reais |
| R5 | Alertas/tarefas automáticas para avaliações negativas | PDF NPS (explícito) | Tratativas | Nota de detrator cria tarefa no Bitrix para o responsável |
| R6 | IA para identificar problemas | PDF NPS (desafio criativo) | Insights | Comentários classificados por tema e sentimento |
| R7 | Uso de crm.lead/deal.get e webhooks | PDF Bitrix (explícito) | Bitrix24 | Leitura de lead/negócio a partir do ID |
| R8 | Fórmulas NPS (0-6/7-8/9-10) e CSAT configurável | Prompt mestre | Relatórios | Cálculos verificados por testes automáticos |
| R9 | Canais WhatsApp, e-mail, SMS | Prompt mestre | Campanhas | Canal só aparece como ativo após conexão validada |
| R10 | Usuários, papéis, auditoria | Inferência | Administração | Perfis admin/gestor/atendente com permissões diferentes |

## 3. Mapa de navegação
```text
Login
└─ App
   ├─ Painel (NPS, CSAT, taxa de resposta, evolução, alertas)
   ├─ Pesquisas → Nova (tipo → perguntas → público → revisão → publicar)
   ├─ Campanhas → Nova (pesquisa → destinatários → canal → envio → acompanhar)
   ├─ Respostas → Detalhe (contexto do cliente, tratativa, status)
   ├─ Tratativas (fila de avaliações críticas)
   ├─ Insights IA (temas, sentimento, resumo)
   ├─ Integrações → Bitrix24 / E-mail / WhatsApp / SMS
   └─ Configurações (equipe, papéis, marca, auditoria)
Página pública: /r/{token} — o cliente responde a pesquisa
```

## 4. Backlog priorizado
1. Base: login, organização, papéis, design system, layout.
2. Pesquisas NPS/CSAT + página pública de resposta por link.
3. Respostas, cálculo de NPS/CSAT e Painel com filtros.
4. Tratativas de avaliações negativas.
5. Bitrix24: conexão por webhook de entrada, leitura de lead/negócio, gravação da resposta no CRM, criação de tarefa.
6. Disparo automático por evento do Bitrix (webhook de saída) e por agendamento.
7. Canais: e-mail primeiro; WhatsApp e SMS ao conectar um provedor.
8. Insights com IA sobre comentários.
9. Exportação CSV, auditoria, limites de plano.

## 5. Decisões pendentes
- Bitrix24: webhook de entrada (simples, uma empresa) vs. app OAuth do Marketplace (necessário para vender a várias empresas). Recomendação: webhook agora, OAuth depois.
- Provedor de WhatsApp/SMS (ex.: Twilio, Z-API). Até definido, ficam como "não conectado".
- Escala CSAT padrão: 1-5, satisfeito = 4 e 5 (configurável).
- O que é "tipo de atendimento": campo do negócio no Bitrix ou categoria definida na pesquisa?
- As duas contas Bitrix (5265 e 947) devem ser um ou dois ambientes?

## 6. Detalhes técnicos
- Lovable Cloud para login, banco, armazenamento e funções do servidor; Lovable AI para os insights.
- Tabelas: organizations, memberships (papéis em tabela separada), surveys, questions, campaigns, dispatches (status: pendente/agendado/enviado/entregue/respondido/falhou/cancelado), responses, answers, cases (tratativas), integrations, sync_events, audit_log. RLS por organização.
- Bitrix: URL do webhook guardada só no servidor; chamadas crm.lead.get, crm.deal.get, crm.timeline.comment.add, tasks.task.add; endpoint público para eventos ONCRMDEALUPDATE/ONCRMLEADUPDATE validado pelo application_token, com idempotência por ID do evento e retentativas registradas.
- Testes automáticos para as fórmulas de NPS e CSAT.
- Primeira entrega desta aprovação: itens 1 a 4 do backlog funcionando com dados reais, e a tela do Bitrix24 pronta para colar o webhook.
