-- =============================================================================
-- « Modifié par » : dernier utilisateur ayant modifié un ticket
-- Rempli par un trigger (le client ne peut pas l'écrire : pas de grant update).
-- =============================================================================

alter table public.tickets
  add column if not exists updated_by uuid;

alter table public.tickets
  drop constraint if exists tickets_updated_by_fkey;
alter table public.tickets
  add constraint tickets_updated_by_fkey
    foreign key (updated_by) references public.profiles (id) on delete set null;

create index if not exists tickets_updated_by_idx on public.tickets (updated_by);

create or replace function public.set_ticket_updated_by()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- auth.uid() est null pour les mises à jour faites avec la clé service_role : on garde la valeur précédente.
  new.updated_by = coalesce(auth.uid(), old.updated_by);
  return new;
end;
$$;

drop trigger if exists tickets_set_updated_by on public.tickets;
create trigger tickets_set_updated_by
  before update on public.tickets
  for each row execute function public.set_ticket_updated_by();

-- Recharge le cache de l'API pour que la jointure updater:profiles!tickets_updated_by_fkey soit reconnue.
notify pgrst, 'reload schema';
