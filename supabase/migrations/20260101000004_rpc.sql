-- =============================================================================
-- Fonctions RPC : dashboard et invitations
-- =============================================================================

-- ---------- Dashboard ----------
-- SECURITY INVOKER : la RLS s'applique, on vérifie en plus l'appartenance pour un message d'erreur net.
create function public.get_project_dashboard(p_project_id uuid)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_kpi jsonb;
  v_total bigint;
  v_by_assignee jsonb;
begin
  if not public.is_project_member(p_project_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select
    jsonb_build_object(
      'total',       count(*),
      'todo',        count(*) filter (where status = 'todo'),
      'in_progress', count(*) filter (where status = 'in_progress'),
      'in_review',   count(*) filter (where status = 'in_review'),
      'done',        count(*) filter (where status = 'done'),
      'overdue',     count(*) filter (where due_date < current_date and status <> 'done'),
      'unassigned',  count(*) filter (where assignee_id is null)
    ),
    count(*)
  into v_kpi, v_total
  from public.tickets
  where project_id = p_project_id;

  select coalesce(jsonb_agg(to_jsonb(r) order by r.total desc, r.full_name nulls last), '[]'::jsonb)
  into v_by_assignee
  from (
    select
      t.assignee_id                                          as user_id,
      p.full_name,
      p.email,
      p.avatar_url,
      count(*)                                               as total,
      count(*) filter (where t.status = 'todo')              as todo,
      count(*) filter (where t.status = 'in_progress')       as in_progress,
      count(*) filter (where t.status = 'in_review')         as in_review,
      count(*) filter (where t.status = 'done')              as done,
      round(100.0 * count(*) / nullif(v_total, 0), 1)        as percentage
    from public.tickets t
    left join public.profiles p on p.id = t.assignee_id
    where t.project_id = p_project_id
    group by t.assignee_id, p.full_name, p.email, p.avatar_url
  ) r;

  return jsonb_build_object('kpi', v_kpi, 'by_assignee', v_by_assignee);
end;
$$;

-- ---------- Invitations ----------

-- Détails d'une invitation à partir de son token (page /invitations/[token])
create function public.get_invitation_by_token(p_token text)
returns table (
  id uuid,
  project_id uuid,
  project_name text,
  role public.project_role,
  email text,
  status public.invitation_status,
  expires_at timestamptz,
  invited_by_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  select i.id, i.project_id, p.name, i.role, i.email, i.status, i.expires_at,
         coalesce(nullif(pr.full_name, ''), pr.email)
    from public.project_invitations i
    join public.projects p on p.id = i.project_id
    left join public.profiles pr on pr.id = i.invited_by
   where i.token = p_token
     and auth.uid() is not null;
$$;

-- Invitations en attente adressées à l'utilisateur connecté (bandeau « Invitations »)
create function public.my_pending_invitations()
returns table (
  id uuid,
  token text,
  project_id uuid,
  project_name text,
  role public.project_role,
  invited_by_name text,
  expires_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select i.id, i.token, i.project_id, p.name, i.role,
         coalesce(nullif(pr.full_name, ''), pr.email), i.expires_at
    from public.project_invitations i
    join public.projects p on p.id = i.project_id
    left join public.profiles pr on pr.id = i.invited_by
   where i.status = 'pending'
     and i.expires_at > now()
     and i.email = lower((select u.email from auth.users u where u.id = auth.uid()))
   order by i.created_at desc;
$$;

-- Accepter une invitation : ajoute l'utilisateur à project_members
create function public.accept_invitation(p_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_confirmed timestamptz;
  v_inv public.project_invitations;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select lower(u.email), u.email_confirmed_at into v_email, v_confirmed
    from auth.users u where u.id = v_uid;

  select * into v_inv from public.project_invitations where token = p_token for update;

  if not found then
    raise exception 'invitation_not_found';
  end if;
  if v_inv.status <> 'pending' then
    raise exception 'invitation_not_pending';
  end if;
  if v_inv.expires_at <= now() then
    raise exception 'invitation_expired';
  end if;
  if v_email is null or v_email <> v_inv.email or v_confirmed is null then
    raise exception 'invitation_email_mismatch';
  end if;

  insert into public.project_members (project_id, user_id, role)
  values (v_inv.project_id, v_uid, v_inv.role)
  on conflict (project_id, user_id) do nothing;

  update public.project_invitations
     set status = 'accepted', accepted_at = now()
   where id = v_inv.id;

  return v_inv.project_id;
end;
$$;

-- Refuser une invitation
create function public.decline_invitation(p_token text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_updated int;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  update public.project_invitations i
     set status = 'declined'
   where i.token = p_token
     and i.status = 'pending'
     and i.email = lower((select u.email from auth.users u where u.id = auth.uid()));

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    raise exception 'invitation_not_found';
  end if;
end;
$$;

revoke all on function
  public.get_project_dashboard(uuid),
  public.get_invitation_by_token(text),
  public.my_pending_invitations(),
  public.accept_invitation(text),
  public.decline_invitation(text)
from public, anon;

grant execute on function
  public.get_project_dashboard(uuid),
  public.get_invitation_by_token(text),
  public.my_pending_invitations(),
  public.accept_invitation(text),
  public.decline_invitation(text)
to authenticated;
