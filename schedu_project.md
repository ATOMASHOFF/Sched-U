# SCHED U — 651 STUDIO INTERNAL OPERATING SYSTEM

**Project:** Sched U  
**First user:** 651 Studio  
**Purpose:** Internal operating system for a 2–3 person creative studio  
**Current phase:** Pre-build / architecture + MVP definition  
**Build philosophy:** Vibe-coded, free-first, simple enough to maintain by 1–2 developers  
**Commercialization:** Deliberately postponed until the workflow is proven inside 651

---

## 0. THE DECISION

Sched U should **not** initially be a generic CRM for agencies.

It should be:

> **The internal operating system that 651 Studio uses to run every client project from booking to delivery and payment.**

The product should eventually be extractable into a SaaS product, but the first version should optimize for **651's real workflow**, not for hypothetical customers.

### The core question Sched U must answer

> **What is happening with every client, project, shoot, task, deliverable, deadline and payment right now?**

Everything in the application should support this.

---

# 1. HONEST ASSESSMENT OF THE CURRENT APPROACH

The original Sched U specification is ambitious and well thought out, but it tries to become an entire studio OS before the 651 workflow has been validated.

The current spec includes clients, shoots, crew, equipment, tasks, expenses, invoices, payments, documents, WhatsApp automation, cron jobs, Razorpay, a client portal, analytics and future intelligence. That is appropriate as a long-term product map, but it is too much for the first build.

The biggest change for V1 is therefore:

**Build the operational loop first. Integrate external services later.**

### Keep in V1

- Clients
- Projects
- Shoots
- Tasks
- Deliverables
- Team/crew
- Equipment reservations
- Calendar
- Project activity
- Basic invoices
- Manual payment tracking
- Dashboard
- Notifications inside the app
- CSV/Excel export
- WhatsApp click-to-chat
- Email `mailto:` / PDF download

### Explicitly postpone

- WhatsApp Cloud API
- Razorpay webhooks
- Automatic email sending
- External calendar sync
- AI inside the product
- OCR
- Automatic bank reconciliation
- Full accounting
- Complex contracts/e-signatures
- Client portal
- Mobile app
- Multi-tenant SaaS architecture
- Advanced analytics
- Equipment depreciation
- Recurring billing

This creates a product that can actually be finished.

---

# 2. PRODUCT PRINCIPLES

## Principle 1 — 651 comes first

Every feature must solve a real recurring problem at 651.

Do not build a feature because it is common in SaaS products.

## Principle 2 — Calendar is a surface, not the data model

A project should contain work, and the calendar should display the parts of that work that have time attached to them.

## Principle 3 — Project is not the same as shoot

A single client project can contain:

- multiple shoots
- multiple editing tasks
- multiple deliverables
- several review rounds
- several invoices/payments

Therefore V1 should separate **Project** from **Shoot Session**.

## Principle 4 — No paid integrations in V1

Sched U should be useful without a paid API.

For WhatsApp and email, the first version should prepare the message and let a human send it.

## Principle 5 — No raw production media in Sched U

Do not store full-resolution videos, raw photographs or large project files in Sched U.

Store links to Google Drive/Dropbox/etc. instead.

Sched U stores business information around the files, not the entire media archive.

## Principle 6 — Every important action is traceable

The studio should be able to see what changed and when.

## Principle 7 — Vibe coding does not mean architecture-free coding

AI should write much of the code, but the humans must control:

- schema
- permissions
- business rules
- naming
- migrations
- deployment
- tests
- backups

---

# 3. RECOMMENDED FREE-FIRST TECH STACK

## Frontend

**React + TypeScript + Vite**

Why:

- 651 does not need SSR
- the application is authenticated and app-like
- Supabase can act as the backend directly
- static deployment is simpler
- less infrastructure for vibe coding
- fewer moving parts than a full Next.js application

## Styling

- Tailwind CSS
- shadcn/ui
- Lucide icons

## Backend / Database / Auth

**Supabase Free**

Use it for:

- PostgreSQL
- Supabase Auth
- Row Level Security
- Storage for small documents/receipts

The current Supabase Free plan includes 500 MB database size, 1 GB storage, 50,000 monthly active users, 500,000 Edge Function invocations, and 2 million Realtime messages. These limits are far beyond the expected load of a tiny internal studio, but the free plan is still a quota-based service and must not be treated as an unlimited forever guarantee.

## Hosting

### Preferred architecture

**Static React/Vite build + Cloudflare Pages + Supabase**

Cloudflare Pages currently provides a Free plan with static asset requests that are free/unlimited, 500 builds per month, and a 25 MiB per-file asset limit. Pages Functions are subject to Workers Free quotas.

For V1, avoid server-side application code whenever possible so that the frontend can remain static.

### Important warning about Vercel

The previous spec suggested Vercel + Supabase. Do not assume Vercel Hobby is appropriate for a real 651 Studio business deployment.

Vercel's current Terms say the Hobby plan is for personal or non-commercial use. Therefore, use Vercel for experimentation only if its then-current terms permit your exact use; otherwise use a platform whose free tier permits your intended business use.

## PDF invoices

Use a browser-side PDF library such as:

- `@react-pdf/renderer`
- or `pdf-lib`

No paid PDF service.

## WhatsApp

V1:

**No WhatsApp API.**

Generate a prefilled `wa.me` link.

Example:

> Client payment reminder → Open WhatsApp → message already filled → human taps Send.

This provides most of the workflow value without an API bill.

## Email

V1:

**No email API.**

Options:

- `mailto:` link
- download PDF and attach manually
- copy generated email text

## Payments

V1:

Manual payment recording:

- UPI
- bank transfer
- cash
- other

An invoice can display:

- bank account
- UPI ID
- generated UPI QR

But Sched U does not need to know whether money actually reached the bank automatically.

## Pincode

Remove external pincode API from V1.

Address can simply be entered manually.

---

# 4. CORE SYSTEM MODEL

The most important architectural correction is this:

```text
CLIENT
  |
  +--- PROJECT
        |
        +--- SHOOT SESSION
        |      +--- CREW ASSIGNMENTS
        |      +--- EQUIPMENT RESERVATIONS
        |
        +--- TASKS
        |
        +--- DELIVERABLES
        |
        +--- DOCUMENTS / FILE LINKS
        |
        +--- INVOICES
               +--- PAYMENTS
```

And across the entire system:

```text
CALENDAR EVENTS
ACTIVITY LOG
NOTIFICATIONS
```

The calendar should not become the place where data is stored. It should be a view over operational data.

---

# 5. V1 DATA MODEL

Do not start from the old all-in-one schema. Start from this simplified model.

## 5.1 `profiles`

```text
id
email
name
role            // owner | manager | staff
avatar_url
created_at
```

## 5.2 `studio_settings`

Single row.

```text
id
studio_name
phone
email
gst_number
address
invoice_prefix
invoice_terms
upi_id
bank_name
bank_holder_name
bank_account_display
ifsc
invoice_logo_url
created_at
updated_at
```

Do not store more financial information than 651 actually needs.

## 5.3 `clients`

```text
id
name
company_name
phone
email
address
notes
status           // active | inactive
created_at
updated_at
```

## 5.4 `client_contacts`

Use this from the beginning so one client/company can have multiple contacts.

```text
id
client_id
name
role
phone
email
is_primary
created_at
```

## 5.5 `projects`

```text
id
client_id
title
description
status           // lead | planned | active | review | completed | cancelled
start_at
deadline
budget
priority        // low | normal | high
location
drive_url
notes
created_by
created_at
updated_at
```

## 5.6 `shoot_sessions`

```text
id
project_id
title
start_at
end_at
location
status           // scheduled | in_progress | completed | cancelled
notes
created_at
updated_at
```

## 5.7 `crew`

```text
id
profile_id      // nullable if external freelancer
name
phone
email
role
day_rate
active
notes
created_at
updated_at
```

Do not store bank account details until there is a real operational need.

## 5.8 `shoot_crew`

```text
id
shoot_id
crew_id
role_on_shoot
agreed_rate
status           // assigned | confirmed | completed | cancelled
created_at
```

## 5.9 `equipment`

```text
id
name
category
serial_number
condition
status           // available | maintenance | retired
purchase_date
purchase_price
maintenance_notes
last_maintenance_at
next_maintenance_at
notes
created_at
updated_at
```

## 5.10 `shoot_equipment`

```text
id
shoot_id
equipment_id
checkout_at
checkin_at
return_condition
notes
```

## 5.11 `tasks`

```text
id
project_id
shoot_id           // nullable
assignee_id        // nullable
title
description
status             // backlog | todo | in_progress | blocked | done
priority           // low | normal | high
start_at
due_at
created_by
created_at
updated_at
```

## 5.12 `deliverables`

Do NOT store deliverables as a JSON string inside the shoot row.

```text
id
project_id
name
description
status              // not_started | in_progress | internal_review | client_review | revision | approved | delivered
assignee_id
client_due_at
internal_due_at
version
file_url
notes
created_at
updated_at
```

This makes revisions, deadlines and progress measurable.

## 5.13 `project_events`

Generic time-based records.

```text
id
project_id
shoot_id
client_id
task_id
deliverable_id
type                // meeting | shoot | review | delivery | reminder | other
title
start_at
end_at
location
notes
created_by
created_at
updated_at
```

Not every calendar entry needs to be a task.

## 5.14 `invoices`

```text
id
client_id
project_id
invoice_no
doc_type            // quotation | invoice
issue_date
due_date
subtotal
discount
gst_rate
gst_amount
total
status              // draft | sent | partially_paid | paid | overdue | cancelled
notes
pdf_url
created_at
updated_at
```

## 5.15 `invoice_items`

```text
id
invoice_id
description
hsn_sac
quantity
unit_price
tax_rate
amount
```

## 5.16 `payments`

```text
id
invoice_id
amount
method              // upi | bank_transfer | cash | other
reference
paid_at
notes
created_at
```

## 5.17 `expenses`

```text
id
project_id
shoot_id
category
description
amount
expense_date
receipt_url
status              // recorded | reimbursed | ignored
created_by
created_at
```

Keep this simple. Profitability can be calculated later.

## 5.18 `documents`

```text
id
client_id
project_id
title
type
file_url
notes
created_at
```

Prefer storing links for large files.

## 5.19 `notifications`

```text
id
user_id
type
severity           // info | warning | urgent
title
message
related_type
related_id
read_at
created_at
```

## 5.20 `activity_logs`

```text
id
actor_id
entity_type
entity_id
action
metadata_json
created_at
```

Examples:

```text
Ashish created project ABC
Anshul assigned Aditya to Reel 2
Ashish marked invoice INV-024 as paid
Anshul moved deliverable to Client Review
```

---

# 6. V1 UX / NAVIGATION

Keep the left navigation extremely small.

```text
Dashboard
Calendar
Projects
Clients
Tasks
Crew
Equipment
Invoices
Expenses
Activity
Settings
```

Do not create 20 top-level menu items.

## Dashboard

The dashboard should show:

### Today

- shoots
- meetings
- deadlines
- overdue tasks
- payments due

### Project health

- active projects
- projects approaching deadline
- blocked items
- awaiting client review

### Money

- invoiced this month
- received
- pending
- overdue

### Quick actions

- New Client
- New Project
- New Shoot
- New Task
- New Invoice

---

# 7. THE PROJECT PAGE

The project page is probably more important than the dashboard.

Suggested layout:

```text
PROJECT HEADER
Client | Project status | Deadline | Value | Progress

TABS
Overview | Tasks | Deliverables | Calendar | Team | Equipment | Money | Files | Activity
```

## Project overview

Show:

- deadline
- progress
- next action
- current blocker
- assigned people
- pending client action
- payment status

Example:

```text
ABC Diwali Campaign

Progress           72%
Deadline           10 Oct
Next action        Client review — Reel 03
Pending from client 1 item
Payment            ₹25,000 / ₹50,000 received
```

This is far more valuable than a generic CRM profile.

---

# 8. THE CALENDAR

The calendar should provide:

## Views

- Day
- Week
- Month

## Event categories

- Shoot
- Meeting
- Task deadline
- Deliverable deadline
- Client review
- Payment due
- Internal event

## V1 conflict detection

Show warnings for:

- a person assigned to overlapping shoots
- equipment reserved by overlapping shoots

Do not attempt automatic scheduling optimization in V1.

The system should **detect conflicts**, not pretend to intelligently solve the studio's entire schedule.

---

# 9. TASK WORKFLOW

Use a clear status model:

```text
BACKLOG
  ↓
TODO
  ↓
IN PROGRESS
  ↓
INTERNAL REVIEW
  ↓
DONE
```

With a separate:

```text
BLOCKED
```

Do not make task states overly complicated.

---

# 10. DELIVERABLE WORKFLOW

This deserves its own state machine.

```text
NOT STARTED
    ↓
IN PROGRESS
    ↓
INTERNAL REVIEW
    ↓
CLIENT REVIEW
    ↓
APPROVED
    ↓
DELIVERED
```

Revision branch:

```text
CLIENT REVIEW
    ↓
REVISION REQUESTED
    ↓
IN PROGRESS
```

The system should keep the version number.

Example:

```text
Reel 01
v1 → client review
v2 → revision
v3 → approved
```

Do not build a full digital asset management platform.

---

# 11. CLIENT WORKFLOW

A client should move through something like:

```text
LEAD
 ↓
DISCUSSION
 ↓
CONFIRMED
 ↓
ACTIVE PROJECT
 ↓
DELIVERY
 ↓
COMPLETED
```

A project can have a separate operational status from the client itself.

Do not make CRM sales pipeline the main product.

651's immediate problem is delivery/operations, not enterprise sales automation.

---

# 12. INVOICE WORKFLOW

```text
DRAFT
 ↓
SENT
 ↓
PARTIALLY PAID
 ↓
PAID
```

Overdue is a derived/status state based on due date and balance.

Important calculation rules:

```text
balance = total - SUM(payments)
```

```text
paid = balance <= 0
```

Do not let the UI manually maintain both `status = paid` and `balance = 0` independently.

The database should have one source of truth and the application should derive the state where possible.

---

# 13. FREE-FIRST COMMUNICATION WORKFLOW

## WhatsApp V1

Button:

**Send WhatsApp**

It opens a prefilled message.

### Shoot confirmation

```text
Hi <name>,

Your shoot with 651 Studio is confirmed for <date> at <time>.
Location: <location>
Project: <project>

Please let us know if there are any changes.
```

### Payment reminder

```text
Hi <name>,

This is a reminder regarding invoice <invoice_no> for ₹<balance>.
Due date: <due_date>

Please let us know once the payment is completed.
Thank you,
651 Studio
```

### Deliverable notification

```text
Hi <name>,

The latest deliverable for <project> is ready for review.
Deliverable: <name>
Version: <version>

<file/link>
```

Sched U should generate these. A human sends them.

---

# 14. NOTIFICATION STRATEGY WITHOUT PAID SERVICES

V1 notifications are primarily **in-app**.

When the user logs in or refreshes:

- query deadlines in next 7 days
- query overdue tasks
- query unpaid invoices
- query tomorrow's shoots
- query unresolved blockers

Generate notification records.

Also show dashboard warnings immediately.

### Do not promise reliable background push/email in V1

A browser tab being closed means JavaScript timers are not a reliable business notification system.

If 651 later needs:

- automatic WhatsApp
- automatic email
- reliable background notifications

then the architecture can add a server-side job system.

Do not solve this prematurely.

---

# 15. NO-COST FILE STRATEGY

## Store in Supabase

Small:

- receipts
- invoice PDFs
- contracts
- small reference documents

## Store elsewhere

Large:

- raw camera files
- edited videos
- photo archives
- project exports

Use links:

```text
Google Drive URL
Dropbox URL
Other storage URL
```

Sched U records the link and its business context.

This keeps storage use low and prevents the free database/storage plan from becoming the bottleneck.

---

# 16. AUTH AND SECURITY

Even an internal 3-person application needs proper access control.

## Roles

Use only three:

```text
OWNER
MANAGER
STAFF
```

Do not build a giant permissions engine.

## Basic rules

OWNER:

- everything
- settings
- user management
- invoices
- financial data

MANAGER:

- clients
- projects
- shoots
- tasks
- crew
- equipment
- invoices

STAFF:

- assigned tasks
- assigned projects
- shoots
- deliverables
- limited financial visibility

## Supabase RLS

Every important table must have Row Level Security enabled.

Do not rely only on hiding buttons in React.

A user who knows an API request should still not be able to access unauthorized data.

This is one of the places where blindly trusting vibe coding is dangerous.

---

# 17. DEPLOYMENT ARCHITECTURE

```text
                 INTERNET
                    |
                    v
          Cloudflare Pages
           Static React App
                    |
          Supabase client SDK
                    |
                    v
          +-------------------+
          | Supabase           |
          |                   |
          | Postgres          |
          | Auth              |
          | Storage           |
          +-------------------+
```

No Node server is required for V1.

That makes the system much easier to vibe-code and deploy.

If later a paid/external integration requires a secret key, add a server-side function only for that integration.

Never place secret API keys in the browser.

---

# 18. RECOMMENDED PROJECT STRUCTURE

```text
sched-u/
├── src/
│   ├── app/
│   │   ├── routes/
│   │   │   ├── dashboard/
│   │   │   ├── calendar/
│   │   │   ├── projects/
│   │   │   ├── clients/
│   │   │   ├── tasks/
│   │   │   ├── crew/
│   │   │   ├── equipment/
│   │   │   ├── invoices/
│   │   │   ├── expenses/
│   │   │   ├── activity/
│   │   │   └── settings/
│   │   └── router.tsx
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── dashboard/
│   │   ├── projects/
│   │   ├── calendar/
│   │   ├── clients/
│   │   ├── invoices/
│   │   └── shared/
│   │
│   ├── features/
│   │   ├── clients/
│   │   ├── projects/
│   │   ├── shoots/
│   │   ├── tasks/
│   │   ├── deliverables/
│   │   ├── crew/
│   │   ├── equipment/
│   │   ├── invoices/
│   │   ├── payments/
│   │   └── notifications/
│   │
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── permissions.ts
│   │   ├── dates.ts
│   │   ├── money.ts
│   │   ├── invoice-pdf.ts
│   │   ├── whatsapp.ts
│   │   └── activity-log.ts
│   │
│   ├── hooks/
│   ├── types/
│   └── utils/
│
├── supabase/
│   ├── migrations/
│   ├── seed.sql
│   └── README.md
│
├── public/
├── docs/
│   ├── workflow.md
│   ├── decisions.md
│   └── test-cases.md
│
├── .env.example
├── AGENTS.md
├── README.md
└── package.json
```

The actual structure may change, but the separation between domain features and shared UI should stay.

---

# 19. BUILD PHASES

## Phase 0 — workflow discovery

Before coding:

1. Observe 651 for several working days.
2. Write the real client workflow.
3. List every recurring manual action.
4. Identify the spreadsheets/files currently used.
5. Record the most common WhatsApp messages.
6. Identify where deadlines are missed.
7. Identify where payment status gets lost.
8. Identify where crew/equipment conflicts happen.

Output:

`docs/workflow.md`

Do not skip this.

---

## Phase 1 — Foundation

Build:

- React/Vite project
- Supabase project
- Auth
- profiles
- studio settings
- database migrations
- RLS
- shared layout
- navigation
- error boundary
- loading states
- empty states

Exit criterion:

> Two people can log in and safely access the same studio data.

---

## Phase 2 — Client + project core

Build:

- client CRUD
- contacts
- project CRUD
- project status
- project progress
- project notes
- project file links
- activity logging

Exit criterion:

> 651 can manage the current client list and active projects without using a spreadsheet for basic project status.

---

## Phase 3 — Shoots + crew + equipment

Build:

- shoot sessions
- start/end time
- location
- crew assignments
- equipment reservations
- conflict warnings
- shoot status

Exit criterion:

> Every upcoming shoot shows exactly when it is, who is assigned, and which equipment is reserved.

---

## Phase 4 — Tasks + deliverables + calendar

Build:

- task board
- task assignment
- due dates
- deliverable tracking
- revisions/versioning
- calendar week/day/month
- activity log
- project progress calculation

Exit criterion:

> 651 can open one project and understand what remains to be done without opening WhatsApp to reconstruct the status.

---

## Phase 5 — Invoices + payments

Build:

- invoice builder
- quotation builder
- invoice numbering
- GST calculations if applicable
- invoice PDF
- manual payment recording
- partial payments
- overdue state
- WhatsApp prefilled reminders
- email `mailto:` link

Exit criterion:

> 651 can issue and track an invoice from inside Sched U without needing the old system for normal new work.

---

## Phase 6 — Dashboard + expenses

Build:

- revenue summary
- pending payments
- overdue payments
- expenses
- basic project profitability
- CSV/Excel export

Exit criterion:

> The studio owner can see current operational and financial health from one dashboard.

---

## Phase 7 — Real-world pilot

Run 651 on Sched U for actual work.

Do not add new major features for the first 1–2 weeks unless they fix a real blocker.

Record:

- what users avoid
- what users still do in WhatsApp
- what users still track in Excel
- repeated mistakes
- missing fields
- confusing workflows
- slow pages
- missing automation opportunities

This is where product discovery becomes real.

---

# 20. WHAT NOT TO BUILD YET

The following are explicitly out of scope for V1:

```text
AI assistant
AI scheduling
WhatsApp Cloud API
Razorpay webhook
Google Calendar sync
Gmail API
Client portal
Mobile application
Push notification platform
E-signature
Accounting ledger
GST filing integration
Social media management
Creator marketplace
CRM lead scoring
Team time tracking
Advanced resource optimization
Equipment depreciation
```

The existence of these ideas should be recorded, not implemented.

---

# 21. WHAT SHOULD BE BUILT "MANUALLY" IN V1

Automation does not have to mean API integration.

## WhatsApp

Generate message → open WhatsApp → send manually.

## Email

Generate subject/body → `mailto:` → send manually.

## Payment confirmation

User clicks `Record Payment` after checking bank/UPI.

## File management

Paste Drive folder URL.

## Scheduling

System detects conflict and shows warning.

Human chooses the schedule.

This keeps the product useful while staying effectively free.

---

# 22. MODEL / AI WORKFLOW FOR VIBE CODING

The goal is **not one model doing everything**.

Use different models for different jobs.

## A. Architecture / product reasoning

**Use a stronger web-based reasoning model**.

Examples:

- GPT-5.6 Luna in ChatGPT
- another strong reasoning model you already have access to

Use this for:

- architecture decisions
- schema reviews
- edge cases
- security reviews
- debugging explanations
- deciding whether a feature belongs in V1

Do not ask the weaker local model to make the most important architectural decisions.

## B. Main local coding model

**Qwen2.5-Coder 7B via Ollama**

This is the default local builder for the available PC hardware.

The current Ollama Qwen2.5-Coder 7B Q4 build is about 4.7 GB and has a 32K context window, making it a practical fit for an 8 GB VRAM machine.

Use it for:

- CRUD pages
- React components
- TypeScript types
- Supabase queries
- SQL migrations
- validation schemas
- forms
- utility functions
- repetitive UI work
- straightforward bug fixes

## C. Local reasoning / planning

**Qwen3 8B via Ollama**

The current Qwen3 8B Q4 build is about 5.2 GB.

Use it for:

- breaking a feature into tasks
- explaining unfamiliar code
- drafting test cases
- reviewing a proposed approach
- generating seed data
- writing documentation
- non-trivial but bounded reasoning

It is useful as the local "planner" while Qwen2.5-Coder handles code edits.

## D. Backup local coding model

**DeepSeek Coder 6.7B**

This is older than Qwen2.5-Coder, so it should not be the primary model, but it is useful as a second opinion for:

- SQL
- algorithms
- small bug fixes
- comparing two implementations

## E. Models NOT appropriate for this particular PC

Do not build your workflow around large local models such as:

- Qwen3-Coder 30B
- Devstral Small 2 24B

They are strong coding/agent models, but their current quantized downloads are roughly 19 GB and 15 GB respectively before considering system memory and runtime overhead. With 16 GB system RAM and 8 GB VRAM, they are poor choices for a comfortable local development workflow.

## F. Coding agent

For a local-code workflow, **Aider + Ollama** is a strong fit.

Aider officially supports Ollama local models, works against a Git repository, edits files, and provides easy undo/history. This is useful for vibe coding because the AI is operating on the repository rather than producing large chunks of code for copy/paste.

Recommended pairing:

```text
Aider
  +
Ollama
  +
Qwen2.5-Coder 7B
```

Use a separate strong web model as the architecture/review brain.

Do not blindly let the local model rewrite the entire repository.

---

# 23. MODEL TASK MATRIX

| Task | Primary model | Reason |
|---|---|---|
| Product decisions | Strong web reasoning model | Best judgement |
| Architecture review | Strong web reasoning model | Edge cases/security |
| SQL schema design | Strong web reasoning model + Qwen3 8B | Need correctness first |
| React page generation | Qwen2.5-Coder 7B | Repetitive coding |
| CRUD | Qwen2.5-Coder 7B | Good fit |
| Forms/validation | Qwen2.5-Coder 7B | Bounded work |
| SQL migration implementation | Qwen2.5-Coder 7B | Structured code |
| Debugging | Qwen2.5-Coder 7B first, stronger model second | Efficient workflow |
| Security review | Strong web reasoning model | Local small model is not enough |
| UX critique | Strong web reasoning model + human | Product judgement |
| Documentation | Qwen3 8B | Good enough |
| Test-case generation | Qwen3 8B | Reasonable planning |
| Repetitive refactors | Qwen2.5-Coder 7B | Fast |
| Final code review | Strong web reasoning model | Higher confidence |

---

# 24. HOW TO VIBE-CODE WITHOUT LOSING CONTROL

Do not give an AI this:

> Build the entire Sched U app.

That is how a codebase becomes inconsistent.

Instead use this sequence.

## Step 1

Ask the planner model:

> Read `schedu_project.md` and identify the smallest implementation for the current phase. Do not write code. List database changes, UI changes, business rules, edge cases and tests.

## Step 2

Ask the coding agent:

> Implement only Phase X, Task Y. Inspect the existing code first. Do not modify unrelated files. Reuse existing components and patterns. Run lint, typecheck and tests before finishing.

## Step 3

Review the diff.

## Step 4

Run the app yourself.

## Step 5

Commit.

## Step 6

Move to the next small task.

This is slower per prompt and much faster per successful feature.

---

# 25. EVERY AI CODING PROMPT SHOULD CONTAIN

```text
1. CONTEXT
2. CURRENT BEHAVIOR
3. DESIRED BEHAVIOR
4. FILES TO INSPECT
5. CONSTRAINTS
6. EDGE CASES
7. ACCEPTANCE CRITERIA
8. TESTS TO RUN
```

Example:

```text
Context:
Sched U is the internal operating system for 651 Studio.

Task:
Add project creation.

Constraints:
- React + TypeScript
- Supabase
- No new backend service
- Reuse existing form components
- Project must belong to an existing client

Acceptance criteria:
- Required fields validate
- Project saves to Postgres
- Created activity log is recorded
- Redirect to project page after save
- Errors are shown to the user
- Loading state exists

Do not:
- change authentication
- modify unrelated tables
- add dependencies unless necessary

Before editing:
inspect the existing patterns.
After editing:
run typecheck and lint.
```

---

# 26. CREATE `AGENTS.md` BEFORE CODING

The repository should contain an `AGENTS.md` that tells every coding model:

```text
# Sched U Agent Instructions

Project: Sched U — 651 Studio internal operating system.

Stack:
- React
- TypeScript
- Vite
- Tailwind
- shadcn/ui
- Supabase

Rules:
1. Inspect before editing.
2. Make the smallest change that solves the task.
3. Do not invent database tables without checking the schema.
4. Never expose secrets in client-side code.
5. Do not disable Supabase RLS.
6. Do not use any paid external API unless explicitly requested.
7. Do not store raw photo/video media in Supabase.
8. Reuse existing UI components.
9. Validate all user input.
10. Handle loading, empty, error and success states.
11. Keep business calculations in reusable utility functions.
12. Run typecheck/lint/tests after meaningful changes.
13. Do not refactor unrelated code while implementing a feature.
14. Do not install libraries when the existing stack can solve the problem.
15. Update documentation when a business rule changes.
```

This file is one of the highest-value things you can give a coding agent.

---

# 27. TESTING STRATEGY

Because the product will be heavily vibe-coded, tests are not optional.

## Unit tests

Test business rules:

- invoice totals
- GST calculations
- partial payments
- invoice balance
- overdue determination
- project progress
- deliverable progress
- scheduling conflicts

## Database tests

Verify:

- RLS
- foreign keys
- required fields
- unique invoice numbers
- cascading behavior

## UI tests

Test critical flows:

```text
Login
Create client
Create project
Create shoot
Assign crew
Reserve equipment
Create task
Create deliverable
Create invoice
Record payment
```

Do not test every button initially.

Test the business-critical paths.

---

# 28. BUSINESS RULES SHOULD LIVE IN CODE ONCE

Avoid duplicate calculations.

Examples:

```text
calculateInvoiceTotals()
calculateProjectProgress()
getInvoiceBalance()
getInvoiceStatus()
getShootConflicts()
getEquipmentConflicts()
```

Then every dashboard/card/table uses those same functions.

Do not calculate invoice totals differently in:

- invoice form
- invoice PDF
- dashboard
- payment page

One business rule. One implementation.

---

# 29. SERIOUS RISK #1 — YOU MAY BUILD A SOLUTION TO THE WRONG PROBLEM

This is the biggest product risk.

You have correctly noticed that studio work is fragmented. But it is possible that the real pain is not "we need a CRM."

It may actually be:

- people forget deadlines
- client requirements are unclear
- files are scattered
- nobody owns a deliverable
- WhatsApp contains the only useful information
- project status is invisible
- shoots conflict
- payments are not followed up

Those are different problems.

Build around the actual behavior.

---

# 30. SERIOUS RISK #2 — FEATURE CREEP

The existing spec is already drifting toward:

```text
CRM
+ project management
+ inventory
+ resource management
+ accounting
+ payments
+ communications
+ document management
+ automation
+ analytics
+ AI
```

That is too much for a 2–3 person studio.

The product can become an "OS" later.

For now, make one loop excellent:

```text
CLIENT
→ PROJECT
→ SHOOT
→ WORK
→ DELIVERY
→ PAYMENT
```

---

# 31. SERIOUS RISK #3 — VIBE CODING CAN CREATE A FAKE SENSE OF PROGRESS

This is especially dangerous.

You can generate:

- 20 pages
- beautiful dashboards
- 50 components
- hundreds of database lines

and still have a bad application.

A polished UI does not mean the workflow works.

The only meaningful progress is:

> **Can 651 use this tomorrow for real work without falling back to WhatsApp/Excel?**

---

# 32. SERIOUS RISK #4 — VIBE-CODED SECURITY

This deserves special attention.

The dangerous areas are:

- Supabase RLS
- authentication
- invoice data
- client data
- documents
- storage rules
- exposed service-role keys
- unsafe SQL
- access control

Never allow a model to say:

> "For simplicity, disable RLS for now."

Do not do that.

The shortcut saves minutes and can create a serious data leak.

---

# 33. SERIOUS RISK #5 — DATA LOSS

Supabase is a hosted service, not a substitute for your backup strategy.

At minimum:

- keep schema migrations in Git
- keep seed/demo data in Git
- export critical business data regularly
- keep invoice PDFs outside a single fragile location
- do not store the only copy of a contract or receipt in the app

Before moving all real 651 records into Sched U, define how you restore the system after a bad migration or accidental deletion.

---

# 34. SERIOUS RISK #6 — FREE DOES NOT MEAN ZERO RISK

A zero-cost software stack is reasonable for this stage.

But free infrastructure can have:

- quotas
- pauses
- changing policies
- support limitations
- storage limits
- rate limits
- breaking changes

Treat "free" as:

> **good for validation, not an eternal infrastructure guarantee.**

Supabase's current free quotas are enough for a 2–3 person internal tool, but you should monitor usage and keep the data export/backup path independent.

Cloudflare Pages currently provides generous free static hosting, but hosted free plans should still be treated as infrastructure with limits rather than as a contractual production SLA.

---

# 35. SERIOUS RISK #7 — THE APP BECOMES ANOTHER PLACE TO UPDATE

This is a killer failure mode.

If 651 has to update:

- WhatsApp
- Excel
- Sched U
- Google Calendar
- Drive

then Sched U has failed to become the source of truth.

The product must eliminate duplicate entry wherever possible.

Example:

Creating a shoot should automatically create/prepare:

- calendar event
- crew assignment state
- equipment reservation state
- project timeline item

One action should produce downstream data.

---

# 36. SERIOUS RISK #8 — OVER-AUTOMATION TOO EARLY

Automation is attractive because it feels like the product is becoming intelligent.

But a wrong automation is worse than a manual task.

Example:

If Sched U automatically sends a client a message with the wrong deadline, wrong amount or wrong project, trust is damaged.

Therefore:

```text
V1 = human-triggered shortcuts
V2 = safe internal automation
V3 = external automatic messaging
```

---

# 37. SERIOUS RISK #9 — CLIENTS MAY NOT USE IT

This is why the client portal should not be V1.

First make the **651 side** work.

Only once the internal workflow is reliable should you ask:

> Do clients need direct access?

Some clients may be perfectly happy receiving links through WhatsApp.

Do not force them into a portal because SaaS competitors have portals.

---

# 38. SERIOUS RISK #10 — YOU MAY CONFUSE INTERNAL VALUE WITH MARKET VALUE

A tool can be extremely useful to 651 and still not be a good standalone SaaS business.

That is okay.

The correct sequence is:

```text
Solve 651's problem
      ↓
Use it repeatedly
      ↓
Measure what matters
      ↓
Discover repeated patterns
      ↓
Generalize the stable workflow
      ↓
Interview other studios
      ↓
Build productized version
```

Do not reverse this sequence.

---

# 39. SUCCESS METRICS FOR THE INTERNAL PROJECT

Do not measure success by number of features.

Measure:

### Operational

- % of active projects tracked in Sched U
- % of shoots scheduled in Sched U
- % of deliverables with an owner
- number of deadline misses
- number of crew/equipment conflicts caught

### Administrative

- invoices created from Sched U
- payment status accuracy
- time spent finding project information
- number of spreadsheets still required

### Adoption

- daily active studio users
- weekly active studio users
- number of days Sched U is used continuously
- number of workflows still handled outside Sched U

A very useful metric is:

> **How often does someone need to ask “what's happening with this project?” when the answer should already be obvious in Sched U?**

---

# 40. THE FIRST REAL MVP

The first true MVP should be only this:

```text
AUTH
+
CLIENTS
+
PROJECTS
+
SHOOTS
+
CREW
+
EQUIPMENT
+
TASKS
+
DELIVERABLES
+
CALENDAR
+
ACTIVITY
+
BASIC INVOICING
+
PAYMENT TRACKING
```

Everything else is later.

---

# 41. FIRST BUILD COMMAND

After installing Node.js, create the app with a current supported Vite + React + TypeScript setup.

Then install only what is immediately required.

Suggested initial dependencies:

```text
react
react-router-dom
@supabase/supabase-js
zod
react-hook-form
@hookform/resolvers
lucide-react
```

Then add UI dependencies as required, rather than installing a huge template stack.

---

# 42. FIRST DATABASE MILESTONE

Create only:

```text
profiles
studio_settings
clients
client_contacts
projects
activity_logs
```

Do not create every future table on day one.

This prevents a vibe-coded schema from becoming a giant speculative database.

After those are proven, add:

```text
shoot_sessions
crew
shoot_crew
equipment
shoot_equipment
tasks
deliverables
project_events
invoices
invoice_items
payments
expenses
documents
notifications
```

---

# 43. FIRST UI MILESTONE

Build in this order:

```text
APP SHELL
↓
LOGIN
↓
DASHBOARD SHELL
↓
CLIENT LIST
↓
CLIENT DETAIL
↓
PROJECT LIST
↓
PROJECT DETAIL
↓
CREATE PROJECT
```

Do not build the full dashboard before the underlying workflows exist.

---

# 44. FIRST REAL 651 TEST

Take one real client.

Take one real project.

Create it in Sched U.

Then run the whole flow manually:

```text
Create client
↓
Create project
↓
Schedule shoot
↓
Assign crew
↓
Reserve equipment
↓
Create tasks
↓
Create deliverables
↓
Complete shoot
↓
Move deliverables through statuses
↓
Create invoice
↓
Record payment
↓
Close project
```

Watch where the UI becomes annoying.

Those pain points are more valuable than feature requests generated by AI.

---

# 45. PRODUCT DESIGN DIRECTION

651 Studio is the product's first user, so the interface should feel like an **operations dashboard**, not accounting software and not a generic CRM.

Suggested character:

- dark/neutral base
- strong typography
- dense but readable information
- clear hierarchy
- minimal decorative cards
- fast navigation
- desktop first, mobile usable
- project status visible at a glance

Do not overdesign the app.

A busy studio needs speed more than visual novelty.

---

# 46. LONG-TERM PRODUCT PATH

Only after the 651 version is stable:

## Stage A — 651 internal

Single studio.

## Stage B — 651-like studios

Generalize:

- clients
- projects
- shoots/jobs
- tasks
- deliverables
- resources
- invoices
- payments

## Stage C — creative agencies

Add:

- client portal
- external communication
- recurring projects
- approvals
- reporting

## Stage D — creators

Add a creator-specific layer:

- brand deals
- deliverables
- posting dates
- negotiation
- payment tracking
- collaboration history

Only after the underlying workflow proves useful should Sched U become a product for other businesses.

---

# 47. CURRENT FINAL STACK DECISION

```text
Frontend:
React + TypeScript + Vite

UI:
Tailwind + shadcn/ui

Backend:
Supabase

Database:
PostgreSQL

Auth:
Supabase Auth

Storage:
Supabase Storage for small files only

PDF:
@react-pdf/renderer or pdf-lib

Deployment:
Cloudflare Pages + Supabase

Local AI:
Ollama

Primary code model:
Qwen2.5-Coder 7B

Local reasoning model:
Qwen3 8B

Coding agent:
Aider

External APIs:
None in V1
```

---

# 48. DEVELOPMENT RULE

Every change must be one of these:

```text
FEATURE
BUG FIX
UX IMPROVEMENT
DATA / MIGRATION
SECURITY
PERFORMANCE
```

If a new request does not fit one of these, stop and question whether it belongs in the current milestone.

---

# 49. DEFINITION OF DONE

A feature is not done when the AI says:

> Implemented successfully.

It is done when:

```text
Code exists
+
TypeScript passes
+
Lint passes
+
Database migration works
+
RLS is verified
+
Happy path works
+
Error state works
+
Empty state works
+
Real 651 data works
+
User manually tested it
+
Git commit created
```

---

# 50. IMMEDIATE NEXT STEPS

1. Keep this document in the repo as `schedu_project.md`.
2. Create `AGENTS.md` using Section 26.
3. Create `docs/workflow.md` by documenting the actual 651 workflow.
4. Create a Git repository.
5. Create Supabase project.
6. Create only the Phase 1 tables.
7. Scaffold React/Vite.
8. Build authentication.
9. Build client management.
10. Build project management.
11. Test on one real 651 project.

Do not start with the calendar.

The calendar becomes powerful only after there is real project/task/shoot data underneath it.

---

# 51. FINAL PRODUCT THESIS

Sched U should not try to win because it has more features.

It should win because the studio can open one application and immediately understand:

```text
WHO is the client?
WHAT are we doing?
WHEN does it happen?
WHO is responsible?
WHAT has been delivered?
WHAT is waiting on the client?
WHAT needs to happen next?
HAVE we been paid?
```

That is the first version of the "operating system".

The rest should be earned through real usage.

---

# 52. EXTERNAL TECH NOTES — VERIFIED OCTOBER 1, 2026

- Next.js 16.3.8 is the current Active LTS release as of the September 30, 2026 security release. This project intentionally does **not** require Next.js because a static React/Vite architecture is simpler for the internal free-first version.
- Supabase Free currently includes 500 MB database, 1 GB storage, 50,000 MAU, 500,000 Edge Function invocations, 2 million Realtime messages, and 2 active free projects.
- Cloudflare Pages currently provides a Free plan with 500 builds/month and free static asset requests; Pages Functions use Workers quotas.
- Vercel Hobby is currently restricted by Vercel's Terms to personal/non-commercial use, so do not depend on Hobby as the long-term 651 business deployment.
- Ollama currently lists Qwen2.5-Coder 7B at about 4.7 GB, Qwen3 8B at about 5.2 GB, Qwen3-Coder 30B at about 19 GB, and Devstral Small 2 at about 15 GB. The smaller Qwen models are therefore much more practical on this project's available local hardware.
- Aider currently documents direct Ollama support and local model usage.

These limits and terms can change. Recheck them before production deployment.

---

# 53. SOURCE BASIS

This document is a deliberate revision of the original 651 Studio Sched U specification, especially its vision, data model, feature phases, build order and production checklist.

The original specification correctly identified the intended operational loop — booking → crew/equipment → execution → deliverables → invoicing → payment → automation — but this document narrows that loop for a free-first internal MVP before generalizing it.
