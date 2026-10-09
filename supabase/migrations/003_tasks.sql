-- Sched U Phase 4: project tasks

create type public.task_status as enum ('backlog', 'todo', 'in_progress', 'blocked', 'done');
create type public.task_priority as enum ('low', 'normal', 'high');

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  status public.task_status not null default 'todo',
  priority public.task_priority not null default 'normal',
  due_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tasks enable row level security;

create policy "authenticated users can read tasks"
  on public.tasks for select to authenticated using (true);
create policy "managers can create tasks"
  on public.tasks for insert to authenticated
  with check (public.current_profile_role() in ('owner', 'manager'));
create policy "managers can update tasks"
  on public.tasks for update to authenticated
  using (public.current_profile_role() in ('owner', 'manager'))
  with check (public.current_profile_role() in ('owner', 'manager'));

create index tasks_project_id_idx on public.tasks(project_id);
create index tasks_status_idx on public.tasks(status);
create index tasks_due_at_idx on public.tasks(due_at);