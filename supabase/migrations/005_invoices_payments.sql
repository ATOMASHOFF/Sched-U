-- Sched U Phase 5: invoices and manual payments

create type public.invoice_doc_type as enum ('quotation', 'invoice');
create type public.invoice_status as enum ('draft', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled');
create type public.payment_method as enum ('upi', 'bank_transfer', 'cash', 'other');

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete restrict,
  project_id uuid references public.projects(id) on delete set null,
  invoice_no text not null unique,
  doc_type public.invoice_doc_type not null default 'invoice',
  issue_date date not null default current_date,
  due_date date,
  subtotal numeric(12, 2) not null default 0 check (subtotal >= 0),
  discount numeric(12, 2) not null default 0 check (discount >= 0),
  gst_rate numeric(5, 2) not null default 0 check (gst_rate >= 0 and gst_rate <= 100),
  gst_amount numeric(12, 2) not null default 0 check (gst_amount >= 0),
  total numeric(12, 2) not null default 0 check (total >= 0),
  status public.invoice_status not null default 'draft',
  notes text,
  pdf_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  method public.payment_method not null default 'upi',
  reference text,
  paid_at date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.invoices enable row level security;
alter table public.payments enable row level security;

create policy "authenticated users can read invoices"
  on public.invoices for select to authenticated using (true);
create policy "managers can create invoices"
  on public.invoices for insert to authenticated
  with check (public.current_profile_role() in ('owner', 'manager'));
create policy "managers can update invoices"
  on public.invoices for update to authenticated
  using (public.current_profile_role() in ('owner', 'manager'))
  with check (public.current_profile_role() in ('owner', 'manager'));

create policy "authenticated users can read payments"
  on public.payments for select to authenticated using (true);
create policy "managers can create payments"
  on public.payments for insert to authenticated
  with check (public.current_profile_role() in ('owner', 'manager'));

create index invoices_client_id_idx on public.invoices(client_id);
create index invoices_project_id_idx on public.invoices(project_id);
create index invoices_status_idx on public.invoices(status);
create index payments_invoice_id_idx on public.payments(invoice_id);