
create or replace function public.flag_response() returns trigger
language plpgsql security definer set search_path=public as $$
declare s public.surveys;
begin
  select * into s from public.surveys where id=new.survey_id;
  if s.id is null or s.status <> 'active' then raise exception 'pesquisa indisponível'; end if;
  new.org_id := s.org_id;
  new.survey_type := s.type;
  if s.type='nps' then
    if new.score<0 or new.score>10 then raise exception 'score fora da escala'; end if;
    new.is_negative := new.score<=6;
  else
    if new.score<1 or new.score>s.csat_scale then raise exception 'score fora da escala'; end if;
    new.is_negative := new.score < s.csat_threshold - 1;
  end if;
  if new.service_type is null then new.service_type := s.service_type; end if;
  return new;
end $$;
