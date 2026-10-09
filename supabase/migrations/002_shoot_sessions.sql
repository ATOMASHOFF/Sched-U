-- Sched U Phase 3: shoot sessions

create type public.shoot_status as enum ('scheduled', 'in_progress', 'completed', 'cancelled');

create table public.shoot_sessions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  start_at timestamptz not null,
  end_at timestamptz,
  location text,
  status public.shoot_status not null default 'scheduled',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shoot_end_after_start check (end_at is null or end_at > start_at)
);

alter table public.shoot_sessions enable row level security;

create policy "authenticated users can read shoots"
  on public.shoot_sessions for select to authenticated using (true);
create policy "managers can create shoots"
  on public.shoot_sessions for insert to authenticated
  with check (public.current_profile_role() in ('owner', 'manager'));
create policy "managers can update shoots"
  on public.shoot_sessions for update to authenticated
  using (public.current_profile_role() in ('owner', 'manager'))
  with check (public.current_profile_role() in ('owner', 'manager'));

create index shoot_sessions_project_id_idx on public.shoot_sessions(project_id);
create index shoot_sessions_start_at_idx on public.shoot_sessions(start_at);