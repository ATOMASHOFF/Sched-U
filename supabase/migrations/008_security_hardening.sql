-- Sched U Phase 8: role and sensitive-record policy hardening

create or replace function public.prevent_non_owner_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and public.current_profile_role() is distinct from 'owner'::public.profile_role then
    raise exception 'Only an owner can change profile roles';
  end if;

  return new;
end;
$$;

create trigger profiles_prevent_non_owner_role_change
  before update on public.profiles
  for each row execute function public.prevent_non_owner_role_change();

drop policy if exists "authenticated users can update deliverables" on public.deliverables;
create policy "managers can update deliverables"
  on public.deliverables for update to authenticated
  using (public.current_profile_role() in ('owner', 'manager'))
  with check (public.current_profile_role() in ('owner', 'manager'));
