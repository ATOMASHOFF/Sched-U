-- Sched U Phase 1 foundation
-- Apply this migration in the Supabase SQL editor after creating the project.

create type public.profile_role as enum ('owner', 'manager', 'staff');
create type public.client_status as enum ('active', 'inactive');
create type public.project_status as enum ('lead', 'planned', 'active', 'review', 'completed', 'cancelled');
create type public.project_priority as enum ('low', 'normal', 'high');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null,
  role public.profile_role not null default 'staff',
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.studio_settings (
  id uuid primary key default gen_random_uuid(),
  studio_name text not null default '651 Studio',
  phone text,
  email text,
  gst_number text,
  address text,
  invoice_prefix text not null default 'INV',
  invoice_terms text,
  upi_id text,
  bank_name text,
  bank_holder_name text,
  bank_account_display text,
  ifsc text,
  invoice_logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company_name text,
  phone text,
  email text,
  address text,
  notes text,
  status public.client_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.client_contacts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null,
  role text,
  phone text,
  email text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete restrict,
  title text not null,
  description text,
  status public.project_status not null default 'lead',
  start_at timestamptz,
  deadline timestamptz,
  budget numeric(12, 2) check (budget is null or budget >= 0),
  priority public.project_priority not null default 'normal',
  location text,
  drive_url text,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.studio_settings enable row level security;
alter table public.clients enable row level security;
alter table public.client_contacts enable row level security;
alter table public.projects enable row level security;
alter table public.activity_logs enable row level security;

create or replace function public.current_profile_role()
returns public.profile_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create policy "authenticated users can read profiles"
  on public.profiles for select to authenticated using (true);
create policy "users can update their profile"
  on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "authenticated users can read settings"
  on public.studio_settings for select to authenticated using (true);
create policy "owners and managers can update settings"
  on public.studio_settings for update to authenticated
  using (public.current_profile_role() in ('owner', 'manager'))
  with check (public.current_profile_role() in ('owner', 'manager'));

create policy "authenticated users can read clients"
  on public.clients for select to authenticated using (true);
create policy "managers can create clients"
  on public.clients for insert to authenticated
  with check (public.current_profile_role() in ('owner', 'manager'));
create policy "managers can update clients"
  on public.clients for update to authenticated
  using (public.current_profile_role() in ('owner', 'manager'))
  with check (public.current_profile_role() in ('owner', 'manager'));

create policy "authenticated users can read contacts"
  on public.client_contacts for select to authenticated using (true);
create policy "managers can manage contacts"
  on public.client_contacts for all to authenticated
  using (public.current_profile_role() in ('owner', 'manager'))
  with check (public.current_profile_role() in ('owner', 'manager'));

create policy "authenticated users can read projects"
  on public.projects for select to authenticated using (true);
create policy "managers can create projects"
  on public.projects for insert to authenticated
  with check (public.current_profile_role() in ('owner', 'manager'));
create policy "managers can update projects"
  on public.projects for update to authenticated
  using (public.current_profile_role() in ('owner', 'manager'))
  with check (public.current_profile_role() in ('owner', 'manager'));

create policy "authenticated users can read activity"
  on public.activity_logs for select to authenticated using (true);
create policy "authenticated users can create activity"
  on public.activity_logs for insert to authenticated with check (actor_id = auth.uid());
