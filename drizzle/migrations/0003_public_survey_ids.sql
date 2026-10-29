ALTER TABLE public.surveys
  ADD COLUMN IF NOT EXISTS public_id text;

UPDATE public.surveys
SET public_id = substr(encode(gen_random_bytes(8), 'hex'), 1, 16)
WHERE public_id IS NULL OR btrim(public_id) = '';

CREATE UNIQUE INDEX IF NOT EXISTS surveys_public_id_unique
  ON public.surveys (public_id);

ALTER TABLE public.surveys
  ALTER COLUMN public_id SET NOT NULL;

CREATE OR REPLACE FUNCTION public.assign_survey_public_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.public_id IS NULL OR btrim(NEW.public_id) = '' THEN
    NEW.public_id := substr(encode(gen_random_bytes(8), 'hex'), 1, 16);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_survey_public_id ON public.surveys;
CREATE TRIGGER trg_assign_survey_public_id
  BEFORE INSERT ON public.surveys
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_survey_public_id();

COMMENT ON COLUMN public.surveys.public_id IS
  'Public identifier used in readable survey paths; distinct from the internal legacy public_token.';
