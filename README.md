# Sched U

Sched U is 651 Studio's internal operating system for running client work from booking to delivery and payment.

## Current status

Phase 1 foundation is scaffolded:

- React + TypeScript + Vite app
- Responsive dashboard shell with local preview data
- Initial Supabase migration for profiles, settings, clients, contacts, projects and activity logs
- Agent guardrails in `AGENTS.md`
- Workflow discovery template in `docs/workflow.md`

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
4. Run `supabase/migrations/001_initial.sql` in the Supabase SQL editor.
5. Create the first authenticated user and profile row.

Do not put a service-role key in frontend environment variables.
