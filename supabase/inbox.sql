-- Contact messages and CV requests.
-- Paste this whole file into Supabase > SQL Editor and press Run, once.
--
-- Visitors can only send. Nobody can read, edit or delete through the site,
-- not even the sender. You read them in Table Editor > messages / cv_requests.

create table if not exists public.messages (
  id          bigint generated always as identity primary key,
  name        text not null check (char_length(btrim(name)) between 1 and 60),
  email       text not null check (char_length(email) <= 120 and email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$'),
  subject     text check (subject is null or char_length(subject) <= 120),
  text        text not null check (char_length(btrim(text)) between 1 and 3000),
  created_at  timestamptz not null default now()
);

create table if not exists public.cv_requests (
  id          bigint generated always as identity primary key,
  name        text not null check (char_length(btrim(name)) between 1 and 60),
  email       text not null check (char_length(email) <= 120 and email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$'),
  job_title   text not null check (char_length(btrim(job_title)) between 1 and 80),
  created_at  timestamptz not null default now()
);

alter table public.messages enable row level security;
alter table public.cv_requests enable row level security;

revoke all on table public.messages from anon, authenticated;
revoke all on table public.cv_requests from anon, authenticated;
grant insert (name, email, subject, text) on table public.messages to anon;
grant insert (name, email, job_title) on table public.cv_requests to anon;

drop policy if exists "send a message" on public.messages;
create policy "send a message" on public.messages for insert to anon with check (true);

drop policy if exists "ask for the cv" on public.cv_requests;
create policy "ask for the cv" on public.cv_requests for insert to anon with check (true);

-- slow down floods: at most 20 in 10 minutes and 1000 kept in each table
create or replace function public.inbox_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent int;
  total int;
begin
  execute format('select count(*) from public.%I where created_at > now() - interval ''10 minutes''', tg_table_name) into recent;
  execute format('select count(*) from public.%I', tg_table_name) into total;
  if recent >= 20 then
    raise exception 'Too many messages right now. Please try again later.';
  end if;
  if total >= 1000 then
    raise exception 'The inbox is full right now. Please try again later.';
  end if;
  new.created_at := now();
  new.name := btrim(new.name);
  return new;
end;
$$;

revoke all on function public.inbox_guard() from public, anon, authenticated;

drop trigger if exists inbox_guard on public.messages;
create trigger inbox_guard before insert on public.messages
  for each row execute function public.inbox_guard();

drop trigger if exists inbox_guard on public.cv_requests;
create trigger inbox_guard before insert on public.cv_requests
  for each row execute function public.inbox_guard();
