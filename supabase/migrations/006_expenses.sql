-- Sched U Phase 6: project expenses

create type public.expense_status as enum ('recorded', 'reimbursed', 'ignored');

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete set null,
  shoot_id uuid references public.shoot_sessions(id) on delete set null,
  category text not null,
  description text not null,
  amount numeric(12, 2) not null check (amount > 0),
  expense_date date not null default current_date,
  status public.expense_status not null default 'recorded',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.expenses enable row level security;

create policy "authenticated users can read expenses"
  on public.expenses for select to authenticated using (true);
create policy "managers can create expenses"
  on public.expenses for insert to authenticated
  with check (public.current_profile_role() in ('owner', 'manager'));
create policy "managers can update expenses"
  on public.expenses for update to authenticated
  using (public.current_profile_role() in ('owner', 'manager'))
  with check (public.current_profile_role() in ('owner', 'manager'));

create index expenses_project_id_idx on public.expenses(project_id);
create index expenses_expense_date_idx on public.expenses(expense_date);
create index expenses_status_idx on public.expenses(status);