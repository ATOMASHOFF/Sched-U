-- Sched U Phase 7: free-first operations foundation
-- These tables support the internal V1 without external services.

create type public.crew_status as enum ('active', 'inactive');
create type public.equipment_status as enum ('available', 'maintenance', 'retired');
create type public.project_event_type as enum ('milestone', 'deadline', 'meeting', 'delivery', 'note');

create table public.crew (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  phone text,
  email text,
  status public.crew_status not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.shoot_crew (
  shoot_id uuid not null references public.shoot_sessions(id) on delete cascade,
  crew_id uuid not null references public.crew(id) on delete restrict,
  role text,
  notes text,
  created_at timestamptz not null default now(),
  primary key (shoot_id, crew_id)
);

create table public.equipment (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  identifier text,
  status public.equipment_status not null default 'available',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.shoot_equipment (
  shoot_id uuid not null references public.shoot_sessions(id) on delete cascade,
  equipment_id uuid not null references public.equipment(id) on delete restrict,
  notes text,
  created_at timestamptz not null default now(),
  primary key (shoot_id, equipment_id)
);

create table public.project_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  event_type public.project_event_type not null,
  title text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  all_day boolean not null default false,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint project_event_end_after_start check (
    ends_at is null or starts_at is null or ends_at > starts_at
  )
);

create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  quantity numeric(12, 2) not null default 1 check (quantity > 0),
  rate numeric(12, 2) not null default 0 check (rate >= 0),
  amount numeric(12, 2) generated always as (quantity * rate) stored,
  created_at timestamptz not null default now()
);

alter table public.crew enable row level security;
alter table public.shoot_crew enable row level security;
alter table public.equipment enable row level security;
alter table public.shoot_equipment enable row level security;
alter table public.project_events enable row level security;
alter table public.invoice_items enable row level security;

create policy "authenticated users can read crew"
  on public.crew for select to authenticated using (true);
create policy "managers can manage crew"
  on public.crew for all to authenticated
  using (public.current_profile_role() in ('owner', 'manager'))
  with check (public.current_profile_role() in ('owner', 'manager'));

create policy "authenticated users can read shoot crew"
  on public.shoot_crew for select to authenticated using (true);
create policy "managers can manage shoot crew"
  on public.shoot_crew for all to authenticated
  using (public.current_profile_role() in ('owner', 'manager'))
  with check (public.current_profile_role() in ('owner', 'manager'));

create policy "authenticated users can read equipment"
  on public.equipment for select to authenticated using (true);
create policy "managers can manage equipment"
  on public.equipment for all to authenticated
  using (public.current_profile_role() in ('owner', 'manager'))
  with check (public.current_profile_role() in ('owner', 'manager'));

create policy "authenticated users can read shoot equipment"
  on public.shoot_equipment for select to authenticated using (true);
create policy "managers can manage shoot equipment"
  on public.shoot_equipment for all to authenticated
  using (public.current_profile_role() in ('owner', 'manager'))
  with check (public.current_profile_role() in ('owner', 'manager'));

create policy "authenticated users can read project events"
  on public.project_events for select to authenticated using (true);
create policy "managers can create project events"
  on public.project_events for insert to authenticated
  with check (public.current_profile_role() in ('owner', 'manager') and created_by = auth.uid());
create policy "managers can update project events"
  on public.project_events for update to authenticated
  using (public.current_profile_role() in ('owner', 'manager'))
  with check (public.current_profile_role() in ('owner', 'manager'));
create policy "managers can delete project events"
  on public.project_events for delete to authenticated
  using (public.current_profile_role() in ('owner', 'manager'));

create policy "authenticated users can read invoice items"
  on public.invoice_items for select to authenticated using (true);
create policy "managers can manage invoice items"
  on public.invoice_items for all to authenticated
  using (public.current_profile_role() in ('owner', 'manager'))
  with check (public.current_profile_role() in ('owner', 'manager'));

create index shoot_crew_crew_id_idx on public.shoot_crew(crew_id);
create index shoot_equipment_equipment_id_idx on public.shoot_equipment(equipment_id);
create index project_events_project_id_idx on public.project_events(project_id);
create index project_events_starts_at_idx on public.project_events(starts_at);
create index invoice_items_invoice_id_idx on public.invoice_items(invoice_id);
