-- Adds "Where from?" to the visitor notes. Paste into Supabase > SQL Editor and press Run, once.
alter table public.notes add column if not exists place text check (place is null or char_length(place) <= 40);
grant insert (place) on table public.notes to anon;
grant select (place) on table public.notes to anon;
notify pgrst, 'reload schema';
