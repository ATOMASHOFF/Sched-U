# Sched U

Sched U is 651 Studio's internal operating system for running client work from booking to delivery and payment.

## Current status

The free-first internal V1 implementation is complete in the repository. It is ready
for Supabase migration application and a real 651 Studio pilot:

- React + TypeScript + Vite app deployed as static assets
- Supabase Auth, Postgres and RLS for the internal workspace
- Clients, projects, shoots, tasks, deliverables, invoices, payments and expenses
- Operations foundation for crew, equipment, project events and invoice line items
- Local/manual workflows instead of paid or externally hosted automation
- Agent guardrails in `AGENTS.md`
- Workflow discovery template in `docs/workflow.md`

Implemented V1 surfaces include the monthly operations calendar, project workspace,
client directory, crew and equipment registers, shoot assignment conflict checks,
tasks, deliverables, activity timeline, invoice line items, manual payments and expenses.

Before production use, apply migrations `001_initial.sql` through `008_security_hardening.sql`
in order, create the first owner profile, and validate one real 651 Studio project using
the workflow checklist in `docs/workflow.md`. The long-term lead pipeline, public client
portal, Google integrations, payment webhooks and automated messaging remain extension
points. They are not required to operate V1 and must not introduce a recurring service
cost before the internal workflow is proven.

## Development

```bash
npm install
npm run dev
npm run build
npm run lint
```

## Supabase setup

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local`.
3. Add the project URL and anon key to `.env.local`.
4. Run the migrations in `supabase/migrations` in numeric order, from `001_initial.sql`
   through the latest migration.
5. Create the first authenticated user and profile row.
6. Run the browser smoke checks listed below and confirm RLS policies in Supabase.

Do not put a service-role key in frontend environment variables.

## Zero-cost operating boundary

V1 uses the browser, Supabase free tier and static hosting only. Files remain in external
links such as Google Drive; raw photo and video media is not stored in Supabase. Any future
integration must have a free/manual fallback and must be isolated behind server-side
credentials or a serverless function before it is enabled.

## V1 smoke checklist

- Sign in and confirm the workspace loads without preview data replacing live records.
- Create a client and project, then open the Clients and Projects pages.
- Schedule a shoot, assign crew/equipment, edit the assignment, and verify an overlap is rejected.
- Add a task, deliverable, calendar event, invoice with line items, payment and expense.
- Move a project through its statuses and confirm the Activity page records the actions.
- Reload the page and confirm the records are still present.
