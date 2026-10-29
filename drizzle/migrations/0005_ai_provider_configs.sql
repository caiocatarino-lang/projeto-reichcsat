CREATE TABLE IF NOT EXISTS public.ai_provider_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('openai', 'gemini')),
  api_key_ciphertext text NOT NULL,
  api_key_iv text NOT NULL,
  api_key_tag text NOT NULL,
  analysis_model text NOT NULL,
  transcription_model text NOT NULL,
  last_validated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_provider_configs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.ai_provider_configs FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.ai_provider_configs TO service_role;

COMMENT ON TABLE public.ai_provider_configs IS
  'Organization-scoped AI provider configuration. API keys are AES-256-GCM encrypted by server code and never returned to clients.';
COMMENT ON COLUMN public.ai_provider_configs.api_key_ciphertext IS
  'Base64 AES-256-GCM encrypted provider API key; readable only by server service role.';
