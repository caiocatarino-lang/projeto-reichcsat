ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS ai_briefing jsonb,
  ADD COLUMN IF NOT EXISTS ai_generated_at timestamptz,
  ADD COLUMN IF NOT EXISTS ai_model text;

COMMENT ON COLUMN public.cases.ai_briefing IS
  'Structured internal AI briefing for customer recovery; contains no contact name or email.';
COMMENT ON COLUMN public.cases.ai_generated_at IS
  'Time the current AI briefing was generated.';
COMMENT ON COLUMN public.cases.ai_model IS
  'Model identifier used for the latest AI briefing.';
