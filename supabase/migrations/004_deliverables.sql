-- Sched U Phase 4: deliverables and revisions

create type public.deliverable_status as enum ('not_started', 'in_progress', 'internal_review', 'client_review', 'revision', 'approved', 'delivered');

create table public.deliverables (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  description text,
  status public.deliverable_status not null default 'not_started',
  assignee_id uuid references public.profiles(id) on delete set null,
  client_due_at timestamptz,
  internal_due_at timestamptz,
  version integer not null default 1 check (version > 0),
  file_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.deliverables enable row level security;

create policy "authenticated users can read deliverables"
  on public.deliverables for select to authenticated using (true);
create policy "managers can create deliverables"
  on public.deliverables for insert to authenticated
  with check (public.current_profile_role() in ('owner', 'manager'));
create policy "authenticated users can update deliverables"
  on public.deliverables for update to authenticated
  using (true)
  with check (true);

create index deliverables_project_id_idx on public.deliverables(project_id);
create index deliverables_status_idx on public.deliverables(status);
create index deliverables_client_due_at_idx on public.deliverables(client_due_at);