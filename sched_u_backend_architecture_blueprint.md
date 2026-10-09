# Sched-U Backend Architecture & Technical Implementation Plan

This document defines the schema, API surface, third-party automations, and directory structure to build the backend supporting the Sched-U application.

---

## 1. Tech Stack Recommendation

* **Runtime & Framework**: Node.js / Bun with Fastify OR Cloudflare Workers with Hono (matching edge deployment targets).
* **Database & ORM**: PostgreSQL (Supabase / Neon) or SQLite (Cloudflare D1) managed via **Prisma** or **Drizzle ORM**.
* **Authentication**: Clerk / Supabase Auth / Lucia for agency users; Token-based signed access for external Client Portals.
* **Storage & Integrations**:
  * Google Workspace API (Google Drive automated folder provisioning).
  * Google Calendar API (v3) bi-directional event sync.
  * @react-pdf/renderer or Puppeteer for dynamic PDF invoice generation.
  * Stripe / Razorpay Webhooks for invoice payment confirmation.

---

## 2. Database Schema (Drizzle ORM Definition)

```typescript
import { pgTable, uuid, varchar, text, numeric, timestamp, boolean, jsonb, integer, pgEnum } from "drizzle-orm/pg-core";

// Enums
export const leadStageEnum = pgEnum("lead_stage", ["new", "meeting_scheduled", "proposal_sent", "won", "lost"]);
export const projectStatusEnum = pgEnum("project_status", ["backlog", "in_progress", "in_review", "revision_requested", "approved", "completed"]);
export const taskStatusEnum = pgEnum("task_status", ["todo", "in_progress", "qc", "done"]);
export const taskPriorityEnum = pgEnum("task_priority", ["low", "medium", "high", "urgent"]);
export const invoiceStatusEnum = pgEnum("invoice_status", ["draft", "issued", "paid", "overdue"]);

// 1. Leads Table
export const leads = pgTable("leads", {
  id: uuid("id").defaultRandom().primaryKey(),
  source: varchar("source", { length: 100 }).notNull(), // e.g. "Insta DM"
  name: varchar("name", { length: 255 }).notNull(),
  handleOrEmail: varchar("handle_or_email", { length: 255 }).notNull(),
  inquiry: text("inquiry"),
  potentialValue: numeric("potential_value", { precision: 12, scale: 2 }),
  stage: leadStageEnum("stage").default("new").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 2. Clients Table
export const clients = pgTable("clients", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadId: uuid("lead_id").references(() => leads.id), // Link back to original lead if converted
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 50 }),
  billingAddress: jsonb("billing_address"),
  gdFolderId: varchar("gd_folder_id", { length: 255 }),
  gdFolderUrl: text("gd_folder_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 3. Projects Table
export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id").references(() => clients.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: projectStatusEnum("status").default("backlog").notNull(),
  amountCharged: numeric("amount_charged", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("USD").notNull(),
  publicToken: varchar("public_token", { length: 64 }).notNull().unique(), // Access token for client portal
  gdProjectUrl: text("gd_project_url"),
  startDate: timestamp("start_date"),
  targetDeadline: timestamp("target_deadline"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 4. Tasks Table
export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id").references(() => projects.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(), // e.g. "Reel edit 01"
  phase: varchar("phase", { length: 100 }), // "Script", "Shoot", "Rough Cut", "Revision"
  priority: taskPriorityEnum("priority").default("medium").notNull(),
  status: taskStatusEnum("status").default("todo").notNull(),
  assignedTo: uuid("assigned_to"),
  deadline: timestamp("deadline"),
  estimatedHours: numeric("estimated_hours", { precision: 5, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 5. Invoices Table
export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(),
  projectId: uuid("project_id").references(() => projects.id).notNull(),
  clientId: uuid("client_id").references(() => clients.id).notNull(),
  lineItems: jsonb("line_items").notNull(),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
  tax: numeric("tax", { precision: 12, scale: 2 }).default("0.00"),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  status: invoiceStatusEnum("status").default("draft").notNull(),
  dueDate: timestamp("due_date").notNull(),
  pdfUrl: text("pdf_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 6. Calendar Events Table
export const calendarEvents = pgTable("calendar_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  relatedType: varchar("related_type", { length: 50 }).notNull(), // "lead", "project", "task"
  relatedId: uuid("related_id").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  googleEventId: varchar("google_event_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

---

## 3. Core REST & tRPC API Endpoints

### Lead & CRM Router (`/api/v1/leads`)
* `POST /` — Capture new inbound lead (source, handle, inquiry).
* `POST /:id/schedule-meeting` — Books intro meeting, syncs with Calendar API.
* `POST /:id/create-proposal` — Attach proposal deliverables and pricing.
* `POST /:id/convert` — **Conversion Trigger**:
  1. Sets lead status to `won`.
  2. Creates new entry in `clients` table (prefilling email, name, notes).
  3. Triggers Google Drive background worker to create client directory.

### Project & Task Router (`/api/v1/projects`)
* `GET /` — List all projects with status, client name, and active deadline.
* `POST /` — Initialize new project under a Client UID. Generates `publicToken`.
* `GET /:id/tasks` — List tasks, phases, and deadline breakdown.
* `POST /:id/tasks` — Append task (priority, estimated time, phase).
* `PATCH /tasks/:taskId` — Update task status (triggers milestone recalculation).

### Invoicing Router (`/api/v1/invoices`)
* `POST /generate` — Generates invoice for a `projectId`.
* `GET /:id/pdf` — Stream generated PDF download.
* `POST /webhook/stripe` — Updates invoice status to `paid` upon payment completion.

### External Public Client Portal Router (`/api/v1/portal`)
* `GET /:publicToken` — Fetches non-sensitive project snapshot:
  * Project name, current milestone percentage, and drive URL.
  * Active review tasks.
  * Associated invoice status.
* `POST /:publicToken/action` — Handles client input:
  * `action: "approve"` $\rightarrow$ Marks project status as `approved`.
  * `action: "request_revision"` $\rightarrow$ Creates new high-priority revision task and registers client comments.

---

## 4. Background Services & Integration Workflows

### 4.1 Automated Google Drive Provisioning Service
```typescript
import { google } from "googleapis";

export async function provisionClientDriveWorkspace(clientName: string, clientUid: string) {
  const drive = google.drive({ version: "v3", auth: getGoogleAuthClient() });

  // 1. Create client parent folder
  const folderMetadata = {
    name: `${clientName} [${clientUid.slice(0, 8)}]`,
    mimeType: "application/vnd.google-apps.folder",
    parents: [process.env.GOOGLE_DRIVE_AGENCY_ROOT_ID!],
  };

  const folder = await drive.files.create({
    requestBody: folderMetadata,
    fields: "id, webViewLink",
  });

  // 2. Create standard internal sub-folders
  const subfolders = ["01_Raw_Footage", "02_Project_Files", "03_Drafts", "04_Final_Delivery"];
  for (const sub of subfolders) {
    await drive.files.create({
      requestBody: {
        name: sub,
        mimeType: "application/vnd.google-apps.folder",
        parents: [folder.data.id!],
      },
    });
  }

  return {
    folderId: folder.data.id,
    webViewLink: folder.data.webViewLink,
  };
}
```

### 4.2 Calendar Synchronizer
* Whenever a meeting is scheduled in the Lead flow or a Task deadline is assigned:
  1. The API fires a job to Google Calendar API `events.insert`.
  2. Stores `googleEventId` in `calendar_events`.
  3. Webhook listener at `/api/v1/webhooks/google-calendar` tracks updates made directly in external calendars.

---

## 5. Recommended Directory Layout

```
sched-u-backend/
├── src/
│   ├── config/             # Environment, DB connections, API keys
│   ├── db/
│   │   ├── schema.ts       # Drizzle / Prisma schema models
│   │   └── migrations/     # SQL migration files
│   ├── modules/
│   │   ├── leads/          # Controller, service, validator for leads
│   │   ├── clients/        # Client records & drive syncing logic
│   │   ├── projects/       # Projects, sub-tasks, and kanban logic
│   │   ├── calendar/       # Calendar scheduling and GCal sync
│   │   ├── invoices/       # PDF generator, calculations, Stripe webhook
│   │   └── portal/         # Public client review portal endpoints
│   ├── integrations/
│   │   ├── google-drive.ts # Workspace folder creation
│   │   ├── google-cal.ts   # Two-way calendar sync
│   │   └── mailer.ts       # Automated notification emails
│   └── server.ts           # Fastify / Hono server entrypoint
├── package.json
└── tsconfig.json
```

## 6. V1 implementation alignment

The blueprint above is the long-term extension architecture, not a requirement for the
first release. The current implementation deliberately uses a zero-cost boundary:

* React/Vite static assets hosted on a free static host.
* Supabase Auth, Postgres and Row Level Security for the internal workspace.
* Direct Supabase access from the frontend while all operations remain internal.
* Manual links for Drive files, manual payment recording and in-app notifications.
* No paid APIs, payment gateway, external calendar sync, automated messaging or public
  portal in the operating baseline.

The database is being extended in small migrations for crew, equipment, reservations,
project events and invoice items. These provide stable internal domain boundaries without
committing the project to a separate API server. A serverless API or worker should only be
introduced when server-side secrets, payment webhooks, OAuth integrations, or public
portal access make it necessary.

The long-term implementation order is:

1. Validate the internal Client -> Project -> Shoot -> Work -> Delivery -> Invoice -> Payment loop.
2. Add conflict checks and views for crew, equipment, deadlines and project activity.
3. Pilot on real 651 Studio projects and measure adoption and data completeness.
4. Add optional integrations one at a time, retaining a manual fallback for each.
5. Consider a public portal and separate API only after the internal workflow is reliable.