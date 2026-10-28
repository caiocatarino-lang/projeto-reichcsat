-- Harden CSAT thresholds and privileged helper functions.
-- Keep this migration in source control; apply only after comparing the target DB history.

ALTER TABLE public.surveys
  ADD CONSTRAINT surveys_csat_threshold_within_scale
  CHECK (csat_threshold >= 1 AND csat_threshold <= csat_scale) NOT VALID;

CREATE OR REPLACE FUNCTION public.is_member(_org uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.memberships
    WHERE org_id = _org
      AND user_id = (SELECT auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION public.has_org_role(_org uuid, _role public.org_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.memberships
    WHERE org_id = _org
      AND user_id = (SELECT auth.uid())
      AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.flag_response()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  s public.surveys%ROWTYPE;
BEGIN
  SELECT * INTO s FROM public.surveys WHERE id = NEW.survey_id;

  IF s.id IS NULL OR s.status <> 'active' THEN
    RAISE EXCEPTION 'pesquisa indisponível';
  END IF;

  NEW.org_id := s.org_id;
  NEW.survey_type := s.type;

  IF s.type = 'nps' THEN
    IF NEW.score < 0 OR NEW.score > 10 THEN
      RAISE EXCEPTION 'score fora da escala';
    END IF;
    NEW.is_negative := NEW.score <= 6;
  ELSE
    IF NEW.score < 1 OR NEW.score > s.csat_scale THEN
      RAISE EXCEPTION 'score fora da escala';
    END IF;
    -- A response is negative when it falls below the configured satisfaction threshold.
    NEW.is_negative := NEW.score < s.csat_threshold;
  END IF;

  IF NEW.service_type IS NULL THEN
    NEW.service_type := s.service_type;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.open_case()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.is_negative THEN
    INSERT INTO public.cases (org_id, response_id, assignee)
    VALUES (NEW.org_id, NEW.id, NEW.responsible)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  organization_id uuid;
BEGIN
  INSERT INTO public.organizations (name)
  VALUES (COALESCE(NEW.raw_user_meta_data ->> 'company', 'Minha empresa'))
  RETURNING id INTO organization_id;

  INSERT INTO public.memberships (org_id, user_id, role, email)
  VALUES (organization_id, NEW.id, 'admin', NEW.email);

  RETURN NEW;
END;
$$;

-- The membership helpers are required by RLS policies, not anonymous callers.
REVOKE ALL ON FUNCTION public.is_member(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_member(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.has_org_role(uuid, public.org_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_org_role(uuid, public.org_role) TO authenticated, service_role;

-- These are trigger-only entry points; avoid directly granting them to API roles.
REVOKE ALL ON FUNCTION public.flag_response() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.open_case() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
