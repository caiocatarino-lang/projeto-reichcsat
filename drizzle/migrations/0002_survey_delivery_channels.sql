ALTER TABLE public.surveys
  ADD COLUMN IF NOT EXISTS delivery_channels jsonb NOT NULL
  DEFAULT '{
    "whatsapp": {
      "enabled": false,
      "message": "Olá, {{nome}}! Queremos saber como foi sua experiência com nosso atendimento. Pode avaliar por este link? {{link_pesquisa}} Obrigado!"
    },
    "sms": {
      "enabled": false,
      "message": "{{empresa}}: avalie seu atendimento: {{link_pesquisa}}"
    },
    "email": {
      "enabled": false,
      "subject": "Como foi sua experiência com a {{empresa}}?",
      "message": "Olá, {{nome}}!\\n\\nA sua opinião é muito importante para nós. Queremos entender como foi sua experiência com nosso atendimento e identificar oportunidades de melhoria.\\n\\nReserve alguns instantes para responder à pesquisa pelo link abaixo:\\n{{link_pesquisa}}\\n\\nAgradecemos pela sua confiança e participação.\\n\\nAtenciosamente,\\nEquipe {{empresa}}"
    }
  }'::jsonb;

COMMENT ON COLUMN public.surveys.delivery_channels IS
  'Configuração dos canais selecionados e modelos de mensagem WhatsApp, SMS e e-mail da pesquisa.';
