-- The live notes board.
-- Paste this whole file into Supabase > SQL Editor and press Run, once.
--
-- What visitors can do (with the public key that sits in config.js):
--   * add a note or a drawing. It is saved as "waiting" and nobody sees it yet.
--   * read the notes you approved. Only name, text, drawing and date.
-- What only you can do (from the Supabase dashboard, signed in to your account):
--   * approve a note (tick "approved"), edit it or delete it.
-- Visitors cannot edit, delete, approve, or read notes that are waiting.

create table if not exists public.notes (
  id          bigint generated always as identity primary key,
  name        text not null check (char_length(btrim(name)) between 1 and 40),
  text        text check (text is null or char_length(text) <= 1000),
  img         text check (img is null or (char_length(img) <= 400000
                and img ~ '^data:image/(png|jpeg);base64,[A-Za-z0-9+/=]+$')),
  approved    boolean not null default false,
  created_at  timestamptz not null default now(),
  constraint note_has_content check (text is not null or img is not null)
);

alter table public.notes enable row level security;

-- start from nothing, then give visitors only what they need
revoke all on table public.notes from anon, authenticated;
grant select (name, text, img, created_at) on table public.notes to anon;
grant insert (name, text, img) on table public.notes to anon;

drop policy if exists "read approved notes" on public.notes;
create policy "read approved notes" on public.notes
  for select to anon using (approved);

drop policy if exists "add a note for review" on public.notes;
create policy "add a note for review" on public.notes
  for insert to anon with check (approved = false);

-- slow down floods: at most 30 new notes in 10 minutes and 300 waiting in total.
-- It also makes sure a new note always starts as waiting with the real time.
create or replace function public.notes_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.notes where created_at > now() - interval '10 minutes') >= 30 then
    raise exception 'Too many notes right now. Please try again later.';
  end if;
  if (select count(*) from public.notes where not approved) >= 300 then
    raise exception 'The board is full right now. Please try again later.';
  end if;
  new.approved := false;
  new.created_at := now();
  new.name := btrim(new.name);
  return new;
end;
$$;

revoke all on function public.notes_guard() from public, anon, authenticated;

drop trigger if exists notes_guard on public.notes;
create trigger notes_guard
  before insert on public.notes
  for each row execute function public.notes_guard();

create index if not exists notes_board on public.notes (created_at desc) where approved;
