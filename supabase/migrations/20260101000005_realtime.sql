-- =============================================================================
-- Realtime : tickets, commentaires, membres (la RLS filtre les événements)
-- =============================================================================

-- REPLICA IDENTITY FULL : les événements DELETE/UPDATE contiennent toutes les colonnes (project_id, ticket_id…)
alter table public.tickets         replica identity full;
alter table public.ticket_comments replica identity full;
alter table public.project_members replica identity full;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.tickets;
    alter publication supabase_realtime add table public.ticket_comments;
    alter publication supabase_realtime add table public.project_members;
  end if;
end;
$$;
