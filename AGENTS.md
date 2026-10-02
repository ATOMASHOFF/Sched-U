# Sched U Agent Instructions

Project: Sched U, the internal operating system for 651 Studio.

## Stack

- React, TypeScript and Vite
- Tailwind/shadcn may be added when the UI needs them
- Supabase for Postgres, Auth and small-file storage
- Lucide icons

## Rules

1. Inspect before editing.
2. Make the smallest change that solves the task.
3. Do not invent database tables without checking the schema.
4. Never expose secrets in client-side code.
5. Never disable Supabase RLS.
6. Do not use paid external APIs unless explicitly requested.
7. Do not store raw photo or video media in Supabase.
8. Reuse existing UI components and patterns.
9. Validate user input at the boundary.
10. Handle loading, empty, error and success states.
11. Keep business calculations in reusable utility functions.
12. Run typecheck, lint and tests after meaningful changes.
13. Do not refactor unrelated code while implementing a feature.
14. Do not install libraries when the existing stack can solve the problem.
15. Update documentation when a business rule changes.

## Product guardrails

The first release serves 651 Studio's internal workflow. Prioritize:

Client -> Project -> Shoot -> Work -> Delivery -> Invoice -> Payment

Keep external automation, client portals, AI, calendar sync and multi-tenant SaaS out of V1 unless explicitly approved.
