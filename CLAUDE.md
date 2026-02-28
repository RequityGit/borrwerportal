# CLAUDE.md - Requity Group Portal

## Project Overview

Requity Group Portal is a multi-role financial services web application for managing borrowers, investors, loans, funds, and related operations. It serves three user roles: **Admin**, **Borrower**, and **Investor**, each with their own dashboard and feature set.

## Tech Stack

- **Framework**: Next.js 14.2 (App Router, React 18, TypeScript)
- **Dev server**: `next dev --turbopack`
- **Database/Auth/Storage**: Supabase (PostgreSQL + Auth + Storage)
- **Styling**: Tailwind CSS 3.4 with CSS variables (HSL-based theme), `tailwindcss-animate`
- **UI Components**: Radix UI primitives + shadcn/ui pattern (in `components/ui/`)
- **Forms**: React Hook Form + Zod validation + `@hookform/resolvers`
- **Icons**: lucide-react
- **Drag & Drop**: @dnd-kit (used in loan Kanban board)
- **Deployment**: Netlify (via `@netlify/plugin-nextjs`)

## Commands

```bash
npm run dev      # Start dev server with Turbopack
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint (next lint)
```

There is no test framework configured. No unit or integration tests exist.

## Environment Variables

Required in `.env` (see `.env.example`):
```
NEXT_PUBLIC_SUPABASE_URL=        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Supabase anon/public key
SUPABASE_SERVICE_ROLE_KEY=       # Supabase service role key (server-side only, for admin operations)
```

## Project Structure

```
app/
  layout.tsx                          # Root layout (metadata, global CSS)
  page.tsx                            # Root page (redirects to /login)
  globals/globals.css                 # Global styles + Tailwind + CSS variable theme
  login/page.tsx                      # Login page (client component, Google OAuth + magic link)
  auth/
    callback/route.ts                 # OAuth callback handler
    confirm/route.ts                  # Magic link OTP verification
  api/
    switch-role/route.ts              # POST endpoint to switch active role (sets cookie)
  (authenticated)/
    layout.tsx                        # Authenticated layout (sidebar + topbar + auth guard)
    admin/                            # Admin portal pages
      dashboard/page.tsx
      borrowers/                      # Borrower management (list, detail, new + actions.ts)
      investors/                      # Investor management (list, detail, new + actions.ts)
      loans/                          # Loan pipeline (list/Kanban, detail)
      funds/                          # Fund management
      conditions/                     # Loan condition templates
      documents/                      # Document management
      capital-calls/                  # Capital call management
      distributions/                  # Distribution management
      operations/                     # Internal operations/task board
      settings/                       # Admin settings
      account/                        # Account settings
    borrower/                         # Borrower portal pages
      dashboard/page.tsx
      loans/[id]/page.tsx
      draws/page.tsx
      payments/page.tsx
      documents/page.tsx
      account/page.tsx
    investor/                         # Investor portal pages
      dashboard/page.tsx
      funds/                          # Fund detail views
      capital-calls/                  # Contribution notices
      distributions/                  # Distribution history
      documents/                      # K-1s, statements, reports
      account/page.tsx

components/
  ui/                                 # shadcn/ui base components (do not modify lightly)
    button.tsx, card.tsx, dialog.tsx, form.tsx, input.tsx, label.tsx,
    select.tsx, table.tsx, tabs.tsx, toast.tsx, toaster.tsx, etc.
  shared/                             # Reusable domain components
    data-table.tsx                    # Generic data table
    file-upload.tsx                   # File upload component
    kpi-card.tsx                      # KPI metric card
    loan-stage-tracker.tsx            # Visual loan pipeline tracker
    page-header.tsx                   # Page title + description
    status-badge.tsx                  # Status badge with color mapping
  layout/                             # Layout components
    sidebar.tsx                       # Role-aware sidebar navigation
    topbar.tsx                        # Top bar with user menu + role switcher
    role-switcher.tsx                 # Role switching dropdown
  admin/                              # Admin-specific components
    borrower-*.tsx, investor-*.tsx, loan-*.tsx, fund-*.tsx,
    capital-call-*.tsx, distribution-*.tsx, document-*.tsx,
    condition-*.tsx, create-loan-dialog.tsx
  borrower/                           # Borrower-specific components
    document-download.tsx, documents-table.tsx, loan-detail-tabs.tsx,
    new-draw-form.tsx, payments-table.tsx
  investor/                           # Investor-specific components
    document-download.tsx, phone-verify-dialog.tsx
  operations/                         # Operations/task management components
    OperationsView.tsx, TaskBoard.tsx, TaskList.tsx, ProjectCard.tsx, etc.

lib/
  utils.ts                            # cn() helper (clsx + tailwind-merge)
  format.ts                           # formatCurrency, formatDate, formatPercent helpers
  constants.ts                        # All domain constants, enums, stage definitions, status colors
  supabase/
    client.ts                         # Browser Supabase client (createBrowserClient)
    server.ts                         # Server Supabase client (createServerClient with cookies)
    admin.ts                          # Admin Supabase client (service role key, no session)
    middleware.ts                     # Middleware session helper (updateSession)
    types.ts                          # Database types (generated) + convenience type aliases

middleware.ts                         # Next.js middleware: auth guard + role-based routing

supabase/
  migrations/                         # SQL migration files (ordered by date)
    20250301000000_initial_schema.sql  # Core tables, RLS, storage, triggers
    20250302000000_add_activation_status.sql
    20250302000000_loan_pipeline.sql   # Extended loan fields, activity log
    20250303000000_conditions_templates.sql
    20250304000000_recurring_tasks.sql
    20250305000000_add_allowed_roles.sql
  seed.sql                            # Seed data
```

## Architecture & Key Patterns

### Authentication & Authorization

- **Auth provider**: Supabase Auth (Google OAuth + magic link/OTP)
- **Login flow**: `/login` (client component) -> `/auth/callback` (OAuth) or `/auth/confirm` (magic link)
- **Middleware** (`middleware.ts`): Intercepts all requests (except static assets). Redirects unauthenticated users to `/login`. Validates role-based route access against `profiles.allowed_roles`.
- **Role system**: Three roles: `admin`, `borrower`, `investor`. Users have a primary `role` and an `allowed_roles` array for multi-role access.
- **Role switching**: Via `POST /api/switch-role` which sets an `active_role` cookie. The `RoleSwitcher` component in the topbar calls this endpoint.
- **Activation status**: Profiles have `activation_status` (`pending` | `link_sent` | `activated`), auto-set to `activated` on first sign-in.

### Supabase Client Usage

Three client variants are used in specific contexts:

| Client | File | Use when... |
|--------|------|-------------|
| `createClient()` from `lib/supabase/client.ts` | Client components (`"use client"`) | Browser-side operations |
| `createClient()` from `lib/supabase/server.ts` | Server components, server actions, route handlers | Server-side with user session cookies |
| `createAdminClient()` from `lib/supabase/admin.ts` | Server actions that bypass RLS | Admin operations needing service role key |

### Server Actions Pattern

Server actions live in `actions.ts` files colocated with their page (e.g., `app/(authenticated)/admin/borrowers/new/actions.ts`). They follow this pattern:

1. Start with `"use server"` directive
2. Verify auth with `requireAdmin()` helper (checks user session + role)
3. Use admin client (`createAdminClient()`) for write operations that bypass RLS
4. Return `{ success: true, ... }` or `{ error: string }` objects
5. Wrap in try/catch with console.error logging

### Page Components

- **Server components by default** (async functions that fetch data directly)
- Dashboard pages fetch KPIs in parallel using `Promise.all()`
- Pages in `(authenticated)/` route group are protected by the authenticated layout
- `export const dynamic = "force-dynamic"` is set on the authenticated layout

### Styling Conventions

- **Brand color**: Deep navy `#1a2b4a` (HSL `218 47% 20%`) used as primary
- **Accent**: Teal (`174 60% 40%`)
- CSS variables defined in `app/globals/globals.css` using HSL values
- Dark mode support defined but not actively toggled (class-based via Tailwind)
- Use `cn()` from `lib/utils.ts` for conditional class merging
- Status colors are centralized in `lib/constants.ts` (`STATUS_COLORS` map)

### Component Conventions

- `components/ui/` contains shadcn/ui primitives -- modify only when updating the design system
- `components/shared/` contains reusable cross-role components (`KpiCard`, `StatusBadge`, `PageHeader`, `DataTable`)
- Role-specific components go in `components/admin/`, `components/borrower/`, `components/investor/`
- Client components use `"use client"` directive at the top
- Icons come from `lucide-react`

## Database Schema

### Core Tables

| Table | Description | Key fields |
|-------|-------------|------------|
| `profiles` | User profiles (linked to `auth.users`) | `role`, `allowed_roles`, `activation_status` |
| `borrowers` | Borrower records (separate from profiles) | `first_name`, `last_name`, `credit_score`, `experience_count` |
| `borrower_entities` | LLC/Corp entities owned by borrowers | `entity_name`, `entity_type`, `ein` |
| `funds` | Investment funds | `name`, `fund_type`, `current_aum`, `status` |
| `investor_commitments` | Investor commitments to funds | `commitment_amount`, `funded_amount`, `unfunded_amount` (generated) |
| `capital_calls` | Capital call notices | `call_amount`, `due_date`, `status` |
| `distributions` | Distribution payments to investors | `amount`, `distribution_type`, `distribution_date` |
| `loans` | Loan records with pipeline tracking | `loan_amount`, `stage`, `priority`, `ltv` (generated) |
| `loan_activity_log` | Audit trail for loan changes | `activity_type`, `description`, `old_value`, `new_value` |
| `draw_requests` | Borrower draw requests on loans | `amount_requested`, `status` |
| `loan_payments` | Loan payment schedule/tracking | `amount_due`, `due_date`, `status` |
| `documents` | Uploaded documents | `file_path`, `document_type`, `owner_id`, `fund_id`, `loan_id` |
| `condition_templates` | Reusable loan condition templates | `name`, `loan_type`, `is_default` |
| `condition_template_items` | Items within templates | `name`, `category`, `responsible_party` |
| `loan_conditions` | Conditions applied to specific loans | `status`, `category`, `responsible_party`, `is_critical_path` |
| `loan_condition_documents` | Join table: conditions <-> documents | `condition_id`, `document_id` |

### Row Level Security (RLS)

All tables have RLS enabled. General pattern:
- **Users** see only their own rows (via `auth.uid()` match)
- **Admins** have full CRUD on all tables
- **Borrowers** can insert their own draw requests
- **Storage**: Two buckets (`investor-documents`, `loan-documents`) with folder-based RLS

### Key Domain Constants

Defined in `lib/constants.ts`:
- `LOAN_STAGES`: `lead` -> `application` -> `processing` -> `underwriting` -> `approved` -> `clear_to_close` -> `funded` -> `servicing` -> `payoff` -> `default` -> `reo` -> `paid_off`
- `PIPELINE_STAGES`: Active stages shown on Kanban board (lead through funded)
- `TERMINAL_STAGES`: Post-pipeline stages (servicing, payoff, default, reo, paid_off)
- `LOAN_TYPES`: `bridge_residential`, `bridge_commercial`, `fix_and_flip`, `ground_up`, `dscr`, `stabilized`, `other`
- `LOAN_PRIORITIES`: `hot`, `normal`, `on_hold`
- `CONDITION_STATUSES`: `not_requested` -> `requested` -> `received` -> `under_review` -> `approved` / `waived` / `rejected`
- `CONDITION_CATEGORIES`: `pta` (Prior to Approval), `ptf` (Prior to Funding)

### Type System

- Database types are defined in `lib/supabase/types.ts` with convenience aliases:
  - `Borrower`, `BorrowerInsert`, `BorrowerUpdate`
  - `Loan`, `LoanInsert`, `LoanUpdate`
  - `Profile`, `Fund`, `InvestorCommitment`, `CapitalCall`, `Distribution`, etc.
- Use the `Database` type when creating Supabase clients for type safety

## Path Aliases

- `@/*` maps to the project root (configured in `tsconfig.json`)
- Example: `import { cn } from "@/lib/utils"`

## Important Notes

- The `@/` path alias is used everywhere -- always use it for imports
- No test framework is configured; run `npm run lint` to check for issues
- The project deploys to Netlify using `@netlify/plugin-nextjs`
- Supabase migrations are in `supabase/migrations/` and are ordered by timestamp
- Images from `*.supabase.co` are allowed via `next.config.mjs` remote patterns
- The authenticated layout sets `dynamic = "force-dynamic"` to prevent static generation
- When creating new pages, follow existing patterns: server component with data fetching, use `PageHeader`, `KpiCard`, shared components
- Server actions should always verify authentication and admin role before performing mutations
- All financial amounts use `formatCurrency()` or `formatCurrencyDetailed()` from `lib/format.ts`
