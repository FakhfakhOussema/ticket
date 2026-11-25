-- =============================================================================
-- Dashboard : prise en compte du statut « Fermé » (closed)
-- Un ticket fermé n'est jamais « en retard ».
-- =============================================================================

create or replace function public.get_project_dashboard(p_project_id uuid)
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
      'closed',      count(*) filter (where status = 'closed'),
      'overdue',     count(*) filter (where due_date < current_date and status not in ('done', 'closed')),
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
      count(*) filter (where t.status = 'closed')            as closed,
      round(100.0 * count(*) / nullif(v_total, 0), 1)        as percentage
    from public.tickets t
    left join public.profiles p on p.id = t.assignee_id
    where t.project_id = p_project_id
    group by t.assignee_id, p.full_name, p.email, p.avatar_url
  ) r;

  return jsonb_build_object('kpi', v_kpi, 'by_assignee', v_by_assignee);
end;
$$;
