
create type public.org_role as enum ('admin','manager','agent');
create type public.survey_type as enum ('nps','csat');
create type public.survey_status as enum ('draft','active','archived');
create type public.case_status as enum ('open','in_progress','resolved');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);
create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null,
  role public.org_role not null default 'agent',
  email text,
  created_at timestamptz not null default now(),
  unique(org_id,user_id)
);
create table public.surveys (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  type public.survey_type not null,
  name text not null,
  question text not null,
  comment_prompt text not null default 'Conte-nos o motivo da sua nota',
  thank_you text not null default 'Obrigado pela sua resposta!',
  csat_scale int not null default 5 check (csat_scale in (5,10)),
  csat_threshold int not null default 4,
  service_type text,
  status public.survey_status not null default 'draft',
  public_token text not null unique default encode(gen_random_bytes(12),'hex'),
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.responses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  survey_id uuid not null references public.surveys(id) on delete cascade,
  survey_type public.survey_type not null,
  score int not null,
  comment text,
  contact_name text,
  contact_email text,
  responsible text,
  service_type text,
  channel text not null default 'link',
  bitrix_entity_type text,
  bitrix_entity_id text,
  is_negative boolean not null default false,
  bitrix_synced boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.cases (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  response_id uuid not null unique references public.responses(id) on delete cascade,
  status public.case_status not null default 'open',
  assignee text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.integrations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  provider text not null,
  status text not null default 'disconnected',
  portal text,
  create_tasks boolean not null default true,
  post_timeline boolean not null default true,
  last_sync_at timestamptz,
  last_error text,
  updated_at timestamptz not null default now(),
  unique(org_id,provider)
);
create table public.integration_secrets (
  integration_id uuid primary key references public.integrations(id) on delete cascade,
  webhook_url text not null
);
create table public.sync_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  provider text not null,
  action text not null,
  ok boolean not null,
  detail text,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.organizations, public.memberships, public.surveys, public.responses, public.cases, public.integrations, public.sync_events to authenticated;
grant all on public.organizations, public.memberships, public.surveys, public.responses, public.cases, public.integrations, public.sync_events, public.integration_secrets to service_role;

alter table public.organizations enable row level security;
alter table public.memberships enable row level security;
alter table public.surveys enable row level security;
alter table public.responses enable row level security;
alter table public.cases enable row level security;
alter table public.integrations enable row level security;
alter table public.integration_secrets enable row level security;
alter table public.sync_events enable row level security;

create or replace function public.is_member(_org uuid) returns boolean
language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.memberships where org_id=_org and user_id=auth.uid())
$$;
create or replace function public.has_org_role(_org uuid, _role public.org_role) returns boolean
language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.memberships where org_id=_org and user_id=auth.uid() and role=_role)
$$;

create policy "members read org" on public.organizations for select to authenticated using (public.is_member(id));
create policy "admins update org" on public.organizations for update to authenticated using (public.has_org_role(id,'admin'));
create policy "members read memberships" on public.memberships for select to authenticated using (public.is_member(org_id));
create policy "admins manage memberships" on public.memberships for all to authenticated using (public.has_org_role(org_id,'admin')) with check (public.has_org_role(org_id,'admin'));

create policy "members read surveys" on public.surveys for select to authenticated using (public.is_member(org_id));
create policy "managers write surveys" on public.surveys for all to authenticated
  using (public.has_org_role(org_id,'admin') or public.has_org_role(org_id,'manager'))
  with check (public.has_org_role(org_id,'admin') or public.has_org_role(org_id,'manager'));

create policy "members read responses" on public.responses for select to authenticated using (public.is_member(org_id));
create policy "members read cases" on public.cases for select to authenticated using (public.is_member(org_id));
create policy "members update cases" on public.cases for update to authenticated using (public.is_member(org_id)) with check (public.is_member(org_id));

create policy "members read integrations" on public.integrations for select to authenticated using (public.is_member(org_id));
create policy "members read sync" on public.sync_events for select to authenticated using (public.is_member(org_id));

-- negative flag + auto case
create or replace function public.flag_response() returns trigger
language plpgsql security definer set search_path=public as $$
declare s public.surveys;
begin
  select * into s from public.surveys where id=new.survey_id;
  new.org_id := s.org_id;
  new.survey_type := s.type;
  if s.type='nps' then
    if new.score<0 or new.score>10 then raise exception 'score fora da escala'; end if;
    new.is_negative := new.score<=6;
  else
    if new.score<1 or new.score>s.csat_scale then raise exception 'score fora da escala'; end if;
    new.is_negative := new.score < greatest(1, s.csat_threshold - case when s.csat_scale=5 then 1 else 2 end) + 1 and new.score < s.csat_threshold - 1 or new.score <= (case when s.csat_scale=5 then 2 else 4 end);
  end if;
  if new.service_type is null then new.service_type := s.service_type; end if;
  return new;
end $$;
create trigger trg_flag_response before insert on public.responses for each row execute function public.flag_response();

create or replace function public.open_case() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  if new.is_negative then
    insert into public.cases(org_id,response_id,assignee) values (new.org_id,new.id,new.responsible) on conflict do nothing;
  end if;
  return new;
end $$;
create trigger trg_open_case after insert on public.responses for each row execute function public.open_case();

-- new user => own organization as admin
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path=public as $$
declare o uuid;
begin
  insert into public.organizations(name) values (coalesce(new.raw_user_meta_data->>'company','Minha empresa')) returning id into o;
  insert into public.memberships(org_id,user_id,role,email) values (o,new.id,'admin',new.email);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
