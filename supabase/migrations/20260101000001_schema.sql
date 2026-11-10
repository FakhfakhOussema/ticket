-- =============================================================================
-- Pilotis Ticket : schéma (types, tables, index, triggers)
-- =============================================================================

-- ---------- Types énumérés ----------
create type public.project_role as enum ('owner', 'admin', 'member');
create type public.invitation_status as enum ('pending', 'accepted', 'declined', 'revoked', 'expired');
create type public.ticket_status as enum ('todo', 'in_progress', 'in_review', 'done');
create type public.ticket_priority as enum ('low', 'medium', 'high', 'urgent');

-- ---------- Fonction générique updated_at ----------
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- profiles ----------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Création automatique du profil à l'inscription
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Synchronisation de l'email si l'utilisateur le change
create function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.handle_user_email_change();

-- ---------- projects ----------
create table public.projects (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(btrim(name)) between 1 and 100),
  description  text check (char_length(description) <= 2000),
  color        text not null default '#6366f1' check (color ~ '^#[0-9a-fA-F]{6}$'),
  icon         text not null default 'folder' check (char_length(icon) between 1 and 40),
  owner_id     uuid not null references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index projects_owner_id_idx on public.projects (owner_id);

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- ---------- project_members ----------
create table public.project_members (
  project_id  uuid not null references public.projects (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  role        public.project_role not null default 'member',
  created_at  timestamptz not null default now(),
  primary key (project_id, user_id)
);

create index project_members_user_id_idx on public.project_members (user_id);
-- Un seul owner par projet
create unique index project_members_single_owner_idx
  on public.project_members (project_id) where role = 'owner';

-- Le créateur d'un projet en devient automatiquement owner
create function public.handle_new_project()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.project_members (project_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end;
$$;

create trigger on_project_created
  after insert on public.projects
  for each row execute function public.handle_new_project();

-- ---------- project_invitations ----------
create table public.project_invitations (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects (id) on delete cascade,
  email        text not null,
  role         public.project_role not null default 'member',
  token        text not null unique
                 default (replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')),
  status       public.invitation_status not null default 'pending',
  invited_by   uuid references public.profiles (id) on delete set null,
  expires_at   timestamptz not null default (now() + interval '7 days'),
  accepted_at  timestamptz,
  created_at   timestamptz not null default now(),
  constraint project_invitations_role_check check (role <> 'owner'),
  constraint project_invitations_email_check check (email = lower(btrim(email)) and email like '%_@_%')
);

create index project_invitations_project_id_idx on public.project_invitations (project_id);
create index project_invitations_email_idx on public.project_invitations (email);
-- Une seule invitation en attente par (projet, email)
create unique index project_invitations_pending_idx
  on public.project_invitations (project_id, email) where status = 'pending';

-- Normalise l'email avant insertion
create function public.normalize_invitation_email()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.email = lower(btrim(new.email));
  return new;
end;
$$;

create trigger project_invitations_normalize_email
  before insert or update of email on public.project_invitations
  for each row execute function public.normalize_invitation_email();

-- ---------- tickets ----------
create table public.tickets (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects (id) on delete cascade,
  title        text not null check (char_length(btrim(title)) between 1 and 200),
  description  text check (char_length(description) <= 10000),
  status       public.ticket_status not null default 'todo',
  priority     public.ticket_priority not null default 'medium',
  assignee_id  uuid,
  created_by   uuid default auth.uid(),
  due_date     date,
  -- Ordre dans la colonne Kanban ; 0 = « placer en fin de colonne » (voir trigger)
  position     double precision not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint tickets_assignee_id_fkey
    foreign key (assignee_id) references public.profiles (id) on delete set null,
  constraint tickets_created_by_fkey
    foreign key (created_by) references public.profiles (id) on delete set null
);

create index tickets_project_status_idx on public.tickets (project_id, status, position);
create index tickets_assignee_id_idx on public.tickets (assignee_id);
create index tickets_project_due_date_idx on public.tickets (project_id, due_date) where due_date is not null;
create index tickets_created_by_idx on public.tickets (created_by);

create trigger tickets_set_updated_at
  before update on public.tickets
  for each row execute function public.set_updated_at();

-- Position par défaut : fin de la colonne du statut
create function public.set_ticket_position()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.position = 0 then
    select coalesce(max(t.position), 0) + 1024
      into new.position
      from public.tickets t
     where t.project_id = new.project_id and t.status = new.status;
  end if;
  return new;
end;
$$;

create trigger tickets_set_position
  before insert on public.tickets
  for each row execute function public.set_ticket_position();

-- L'assigné doit être membre du projet
create function public.check_ticket_assignee()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.assignee_id is not null and not exists (
    select 1 from public.project_members m
     where m.project_id = new.project_id and m.user_id = new.assignee_id
  ) then
    raise exception 'assignee_not_member' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger tickets_check_assignee
  before insert or update of assignee_id, project_id on public.tickets
  for each row execute function public.check_ticket_assignee();

-- Retrait d'un membre : ses tickets redeviennent non assignés
create function public.unassign_removed_member()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.tickets
     set assignee_id = null
   where project_id = old.project_id and assignee_id = old.user_id;
  return old;
end;
$$;

create trigger on_project_member_removed
  after delete on public.project_members
  for each row execute function public.unassign_removed_member();

-- ---------- ticket_comments ----------
create table public.ticket_comments (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid not null references public.tickets (id) on delete cascade,
  author_id   uuid default auth.uid(),
  body        text not null check (char_length(btrim(body)) between 1 and 5000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint ticket_comments_author_id_fkey
    foreign key (author_id) references public.profiles (id) on delete set null
);

create index ticket_comments_ticket_id_idx on public.ticket_comments (ticket_id, created_at);
create index ticket_comments_author_id_idx on public.ticket_comments (author_id);

create trigger ticket_comments_set_updated_at
  before update on public.ticket_comments
  for each row execute function public.set_updated_at();
