-- =============================================================================
-- Notes de projet + liste de tâches personnelle
-- =============================================================================

-- ---------- project_notes : notes partagées d'un projet ----------
create table public.project_notes (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects (id) on delete cascade,
  title       text not null check (char_length(btrim(title)) between 1 and 120),
  body        text not null default '' check (char_length(body) <= 20000),
  color       text not null default 'yellow' check (color in ('yellow', 'blue', 'green', 'pink', 'purple', 'gray')),
  pinned      boolean not null default false,
  created_by  uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index project_notes_project_idx on public.project_notes (project_id, pinned desc, updated_at desc);
create index project_notes_created_by_idx on public.project_notes (created_by);

create trigger project_notes_set_updated_at
  before update on public.project_notes
  for each row execute function public.set_updated_at();

alter table public.project_notes enable row level security;
revoke all on public.project_notes from anon;
revoke update on public.project_notes from authenticated;
grant update (title, body, color, pinned) on public.project_notes to authenticated;

-- Tout membre lit, crée et modifie les notes ; suppression : auteur ou owner/admin
create policy "project_notes_select_member" on public.project_notes
  for select to authenticated
  using (public.is_project_member(project_id));

create policy "project_notes_insert_member" on public.project_notes
  for insert to authenticated
  with check (public.is_project_member(project_id) and created_by = auth.uid());

create policy "project_notes_update_member" on public.project_notes
  for update to authenticated
  using (public.is_project_member(project_id))
  with check (public.is_project_member(project_id));

create policy "project_notes_delete_author_or_admin" on public.project_notes
  for delete to authenticated
  using (created_by = auth.uid() or public.is_project_admin(project_id));

-- ---------- user_todos : tâches personnelles (liées ou non à un projet) ----------
create table public.user_todos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title       text not null check (char_length(btrim(title)) between 1 and 200),
  -- NULL = tâche personnelle ; sinon tâche rattachée à un projet (couleur du projet dans l'interface)
  project_id  uuid references public.projects (id) on delete set null,
  due_date    date,
  done        boolean not null default false,
  done_at     timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index user_todos_user_idx on public.user_todos (user_id, done, due_date);
create index user_todos_project_idx on public.user_todos (project_id);

create trigger user_todos_set_updated_at
  before update on public.user_todos
  for each row execute function public.set_updated_at();

create function public.set_todo_done_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.done and not old.done then
    new.done_at = now();
  elsif not new.done then
    new.done_at = null;
  end if;
  return new;
end;
$$;

create trigger user_todos_set_done_at
  before update of done on public.user_todos
  for each row execute function public.set_todo_done_at();

alter table public.user_todos enable row level security;
revoke all on public.user_todos from anon;
revoke update on public.user_todos from authenticated;
grant update (title, project_id, due_date, done) on public.user_todos to authenticated;

-- Strictement privées : chacun ne voit et ne modifie que ses propres tâches.
-- Une tâche ne peut être rattachée qu'à un projet dont on est membre.
create policy "user_todos_select_own" on public.user_todos
  for select to authenticated
  using (user_id = auth.uid());

create policy "user_todos_insert_own" on public.user_todos
  for insert to authenticated
  with check (user_id = auth.uid() and (project_id is null or public.is_project_member(project_id)));

create policy "user_todos_update_own" on public.user_todos
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and (project_id is null or public.is_project_member(project_id)));

create policy "user_todos_delete_own" on public.user_todos
  for delete to authenticated
  using (user_id = auth.uid());
