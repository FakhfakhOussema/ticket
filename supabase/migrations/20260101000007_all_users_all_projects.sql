-- =============================================================================
-- Tous les utilisateurs inscrits sont membres de tous les projets
--   * les projets sont visibles par tout le monde (la RLS repose sur project_members)
--   * la liste d'assignation des tickets contient tous les utilisateurs inscrits
-- À exécuter dans Supabase → SQL Editor (ou `supabase db push`). Idempotent.
-- =============================================================================

-- 1) Rattrapage : chaque profil existant devient membre de chaque projet
insert into public.project_members (project_id, user_id, role)
select p.id, pr.id, 'member'
  from public.projects p
 cross join public.profiles pr
on conflict (project_id, user_id) do nothing;

-- 2) Nouveau projet : le créateur est owner, tous les autres inscrits sont membres
create or replace function public.handle_new_project()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.project_members (project_id, user_id, role)
  values (new.id, new.owner_id, 'owner');

  insert into public.project_members (project_id, user_id, role)
  select new.id, pr.id, 'member'
    from public.profiles pr
   where pr.id <> new.owner_id
  on conflict (project_id, user_id) do nothing;

  return new;
end;
$$;

-- 3) Nouvel inscrit (email, Google ou invitation) : membre de tous les projets existants
create or replace function public.add_new_profile_to_all_projects()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.project_members (project_id, user_id, role)
  select p.id, new.id, 'member'
    from public.projects p
  on conflict (project_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_profile_created_join_projects on public.profiles;
create trigger on_profile_created_join_projects
  after insert on public.profiles
  for each row execute function public.add_new_profile_to_all_projects();
