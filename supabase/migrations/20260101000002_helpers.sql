-- =============================================================================
-- Fonctions helper SECURITY DEFINER (évitent la récursion dans les policies RLS)
-- =============================================================================

create function public.is_project_member(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.project_members
     where project_id = p_project_id and user_id = auth.uid()
  );
$$;

create function public.has_project_role(p_project_id uuid, p_roles public.project_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.project_members
     where project_id = p_project_id and user_id = auth.uid() and role = any (p_roles)
  );
$$;

create function public.is_project_admin(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_project_role(p_project_id, array['owner', 'admin']::public.project_role[]);
$$;

create function public.is_project_owner(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_project_role(p_project_id, array['owner']::public.project_role[]);
$$;

-- Vrai si l'utilisateur courant partage au moins un projet avec p_user_id
create function public.shares_project_with(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.project_members me
      join public.project_members other on other.project_id = me.project_id
     where me.user_id = auth.uid() and other.user_id = p_user_id
  );
$$;

-- Helpers côté ticket (pour les commentaires)
create function public.is_ticket_member(p_ticket_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.tickets t
      join public.project_members m on m.project_id = t.project_id
     where t.id = p_ticket_id and m.user_id = auth.uid()
  );
$$;

create function public.is_ticket_admin(p_ticket_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.tickets t
      join public.project_members m on m.project_id = t.project_id
     where t.id = p_ticket_id and m.user_id = auth.uid() and m.role in ('owner', 'admin')
  );
$$;

-- Droits d'exécution : réservés aux utilisateurs connectés
revoke all on function
  public.is_project_member(uuid),
  public.has_project_role(uuid, public.project_role[]),
  public.is_project_admin(uuid),
  public.is_project_owner(uuid),
  public.shares_project_with(uuid),
  public.is_ticket_member(uuid),
  public.is_ticket_admin(uuid)
from public, anon;

grant execute on function
  public.is_project_member(uuid),
  public.has_project_role(uuid, public.project_role[]),
  public.is_project_admin(uuid),
  public.is_project_owner(uuid),
  public.shares_project_with(uuid),
  public.is_ticket_member(uuid),
  public.is_ticket_admin(uuid)
to authenticated;
