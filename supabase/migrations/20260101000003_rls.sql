-- =============================================================================
-- Row Level Security : activée sur TOUTES les tables
-- =============================================================================

alter table public.profiles            enable row level security;
alter table public.projects            enable row level security;
alter table public.project_members     enable row level security;
alter table public.project_invitations enable row level security;
alter table public.tickets             enable row level security;
alter table public.ticket_comments     enable row level security;

-- Aucun accès anonyme
revoke all on public.profiles, public.projects, public.project_members,
              public.project_invitations, public.tickets, public.ticket_comments
  from anon;

-- Privilèges au niveau colonne : les champs d'identité/appartenance ne sont jamais modifiables
revoke update on public.profiles            from authenticated;
revoke update on public.projects            from authenticated;
revoke update on public.project_members     from authenticated;
revoke update on public.project_invitations from authenticated;
revoke update on public.tickets             from authenticated;
revoke update on public.ticket_comments     from authenticated;
revoke insert, delete on public.profiles    from authenticated;

grant update (full_name, avatar_url)                                       on public.profiles            to authenticated;
grant update (name, description, color, icon)                              on public.projects            to authenticated;
grant update (role)                                                        on public.project_members     to authenticated;
grant update (status)                                                      on public.project_invitations to authenticated;
grant update (title, description, status, priority, assignee_id, due_date, position)
                                                                           on public.tickets             to authenticated;
grant update (body)                                                        on public.ticket_comments     to authenticated;

-- Pas d'ajout direct de membres par les clients : trigger du owner + RPC accept_invitation
revoke insert on public.project_members from authenticated;

-- ---------- profiles ----------
create policy "profiles_select_self_or_comember" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.shares_project_with(id));

create policy "profiles_update_self" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------- projects ----------
-- owner_id = auth.uid() permet le INSERT ... RETURNING avant que le trigger n'ait ajouté le membre
create policy "projects_select_member" on public.projects
  for select to authenticated
  using (owner_id = auth.uid() or public.is_project_member(id));

create policy "projects_insert_self_owner" on public.projects
  for insert to authenticated
  with check (owner_id = auth.uid());

create policy "projects_update_owner" on public.projects
  for update to authenticated
  using (public.is_project_owner(id))
  with check (public.is_project_owner(id));

create policy "projects_delete_owner" on public.projects
  for delete to authenticated
  using (public.is_project_owner(id));

-- ---------- project_members ----------
create policy "project_members_select_member" on public.project_members
  for select to authenticated
  using (public.is_project_member(project_id));

create policy "project_members_update_admin" on public.project_members
  for update to authenticated
  using (public.is_project_admin(project_id) and role <> 'owner')
  with check (public.is_project_admin(project_id) and role <> 'owner');

-- Un admin/owner retire un membre (jamais le owner) ; chacun peut quitter un projet (sauf le owner)
create policy "project_members_delete_admin_or_self" on public.project_members
  for delete to authenticated
  using (
    role <> 'owner'
    and (public.is_project_admin(project_id) or user_id = auth.uid())
  );

-- ---------- project_invitations ----------
create policy "project_invitations_select_admin" on public.project_invitations
  for select to authenticated
  using (public.is_project_admin(project_id));

create policy "project_invitations_insert_admin" on public.project_invitations
  for insert to authenticated
  with check (
    public.is_project_admin(project_id)
    and invited_by = auth.uid()
    and status = 'pending'
  );

create policy "project_invitations_update_admin" on public.project_invitations
  for update to authenticated
  using (public.is_project_admin(project_id))
  with check (public.is_project_admin(project_id) and status = 'revoked');

create policy "project_invitations_delete_admin" on public.project_invitations
  for delete to authenticated
  using (public.is_project_admin(project_id));

-- ---------- tickets ----------
create policy "tickets_select_member" on public.tickets
  for select to authenticated
  using (public.is_project_member(project_id));

create policy "tickets_insert_member" on public.tickets
  for insert to authenticated
  with check (public.is_project_member(project_id) and created_by = auth.uid());

create policy "tickets_update_member" on public.tickets
  for update to authenticated
  using (public.is_project_member(project_id))
  with check (public.is_project_member(project_id));

create policy "tickets_delete_creator_or_admin" on public.tickets
  for delete to authenticated
  using (created_by = auth.uid() or public.is_project_admin(project_id));

-- ---------- ticket_comments ----------
create policy "ticket_comments_select_member" on public.ticket_comments
  for select to authenticated
  using (public.is_ticket_member(ticket_id));

create policy "ticket_comments_insert_member" on public.ticket_comments
  for insert to authenticated
  with check (public.is_ticket_member(ticket_id) and author_id = auth.uid());

create policy "ticket_comments_update_author" on public.ticket_comments
  for update to authenticated
  using (author_id = auth.uid() and public.is_ticket_member(ticket_id))
  with check (author_id = auth.uid());

create policy "ticket_comments_delete_author_or_admin" on public.ticket_comments
  for delete to authenticated
  using (author_id = auth.uid() or public.is_ticket_admin(ticket_id));
