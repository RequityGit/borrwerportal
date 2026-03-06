# CLAUDE.md — Requity Group Monorepo

## Project Overview

Requity Group Monorepo — a pnpm + Turborepo workspace containing multiple Next.js applications and shared packages. The primary app is RequityOS, a full-stack SaaS platform for lending/fintech.

## Monorepo Structure

```
/
├── apps/
│   ├── requity-os/        # RequityOS SaaS portal (borrower/lender/investor)
│   ├── requity-group/     # Requity Group public marketing site
│   └── trg-living/        # TRG Living public site
├── packages/
│   ├── db/                # Shared Supabase: migrations, seed, edge functions
│   ├── ui/                # Headless shared component primitives
│   ├── lib/               # Shared utilities (cn, formatCurrency, etc.)
│   └── types/             # Shared TypeScript types
├── CLAUDE.md              # This file (monorepo root)
├── DESIGN_SYSTEM.md       # Design system spec (applies to RequityOS)
├── turbo.json             # Turborepo pipeline config
├── pnpm-workspace.yaml    # Workspace definition
└── package.json           # Root workspace package
```

## Commands (from root)

```bash
pnpm dev          # Run all apps in parallel (Turborepo)
pnpm build        # Build all apps and packages
pnpm lint         # Lint all workspaces
pnpm test         # Run tests across workspaces
pnpm typecheck    # TypeScript checking across workspaces
```

## App-specific commands

```bash
pnpm --filter @repo/requity-os dev     # Dev server for RequityOS (port 3000)
pnpm --filter @repo/requity-group dev  # Dev server for Requity Group (port 3001)
pnpm --filter @repo/trg-living dev     # Dev server for TRG Living (port 3002)
```

## Critical Rules

1. **Apps may import from `packages/*` but NEVER from each other**
2. **Packages must have zero knowledge of apps**
3. Each app has its own `CLAUDE.md` — read it before working on that app
4. Shared utilities go in `packages/lib`, shared types in `packages/types`
5. Database migrations and Supabase config live in `packages/db/supabase/`
6. Use `workspace:*` for internal package references

## Package Manager

This repo uses **pnpm** with workspaces. Do NOT use npm or yarn.

```bash
pnpm install              # Install all dependencies
pnpm add <pkg> --filter @repo/requity-os   # Add dep to specific app
```

## Tech Stack

- **Build System**: Turborepo + pnpm workspaces
- **Framework**: Next.js 14.2.21 with App Router (all apps)
- **Language**: TypeScript 5.9 (strict mode)
- **Database**: Supabase PostgreSQL with Row Level Security
- **Auth**: Supabase Auth with SSR support (RequityOS only)
- **Styling**: Tailwind CSS 3.4 per-app with app-specific tokens
- **UI Components**: shadcn/ui + Radix UI (RequityOS), custom per-app
- **Deployment**: Netlify (RequityOS), TBD (other apps)

## Environment Variables

Required in `apps/requity-os/.env` (see `apps/requity-os/.env.example`):
```
NEXT_PUBLIC_SUPABASE_URL=        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Supabase anon/public key
SUPABASE_SERVICE_ROLE_KEY=       # Supabase service role key (server-side only)
```

## Design System

**All RequityOS UI/design decisions must follow [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) (v3).** Other apps (requity-group, trg-living) have their own brand tokens in their respective `tailwind.config.ts` files.

## Database

- Supabase PostgreSQL with RLS enabled on all tables
- Migrations live in `packages/db/supabase/migrations/`
- Seed data in `packages/db/supabase/seed.sql`
- Edge functions in `packages/db/supabase/functions/`

### Core Tables (28 tables)

**Auth & Identity:**
- `profiles` — User identity (FK → auth.users), stores role, allowed_roles, activation_status
- `user_roles` — Maps users to app_role enum (super_admin, admin, investor, borrower)

**Lending / Loan Pipeline:**
- `borrowers`, `borrower_entities`, `loans`, `loan_condition_templates`, `loan_conditions`, `loan_documents`, `loan_draws`, `loan_payments`, `loan_activity_log`

**Investor Portal:**
- `investors`, `investing_entities`, `funds`, `investor_commitments`, `capital_calls`, `capital_call_line_items`, `distributions`, `distribution_line_items`

**Operations:** `ops_projects`, `ops_project_notes`, `ops_project_comments`, `ops_tasks`, `ops_task_comments`

**CRM:** `crm_contacts`, `crm_activities`

### Rules for Database Code

1. Always use typed Supabase client
2. Never guess column names — check `apps/requity-os/lib/supabase/types.ts`
3. `unfunded_amount` on investor_commitments is generated — never set directly
4. `loan_number` is auto-generated — never set on insert
5. Soft deletes — filter with `.is("deleted_at", null)`
6. Use `stage` not `status` for loan pipeline tracking
7. RLS: wrap `auth.uid()` in a subselect: `(select auth.uid())`

## Supabase MCP (Required)

**CRITICAL: ALWAYS use the Supabase MCP server for ALL database operations.**

### Connection Setup

```bash
claude mcp add --scope project --transport http supabase "https://mcp.supabase.com/mcp?project_ref=edhlkknvlczhbowasjna"
```

### MCP Tool Usage

- **Project ID**: `edhlkknvlczhbowasjna`
- **Schema changes**: `mcp__Supabase__apply_migration` — also create `.sql` file in `packages/db/supabase/migrations/`
- **Data queries**: `mcp__Supabase__execute_sql`
- **Generate types**: `mcp__Supabase__generate_typescript_types` → write to `apps/requity-os/lib/supabase/types.ts`

## GitHub — PR Workflow

**CRITICAL: ALWAYS push the branch and create a pull request.**

```bash
git push -u origin <branch-name>
gh pr create --title "..." --body "..." --base main
```

If `gh` is not authenticated, provide: `https://github.com/RequityGit/borrwerportal/compare/main...<branch-name>`

## Typography (RequityOS)

- **Font**: Inter exclusively via `font-sans`
- **`.num` class**: Apply to ALL numeric values (currency, percentages, dates)
- **Charts**: Use `NumericTick` component for Recharts axes
- These rules apply to RequityOS only — other apps follow their own design systems

## Page Layout (RequityOS)

- No KPI cards on content pages (data tables, kanban boards)
- Standard: PageHeader → Toolbar → Data view (visible without scrolling at 900px)
- KPI cards belong on Dashboard only

## Code Quality & Reliability (MANDATORY)

Every feature, fix, or refactor MUST follow these rules. No exceptions.

### Testing Requirements
- **Every form submission** must have a test that verifies: fields render, required validation fires, submit calls the correct Supabase RPC/mutation with the correct payload, and success/error states display properly.
- **Every button that triggers a mutation** (insert, update, delete, RPC call) must have a test confirming it fires correctly and handles errors gracefully.
- **Every new page or route** must have a basic smoke test: renders without crashing, required data loads, role-based access is enforced.
- Use **Vitest** for unit/integration tests. Use **Playwright** for E2E flows if the feature involves multi-step user interaction.
- Test files live next to the component: `ComponentName.test.tsx` in the same directory.

### Validation & Type Safety
- **All form inputs** must be validated with **Zod schemas** before submission. Never trust raw form data.
- Zod schemas must match the corresponding Supabase table types. If a column is `text NOT NULL`, the Zod field is `z.string().min(1)` — not `.optional()`.
- **Never use `any` type.** If you don't know the type, look it up via MCP (`list_tables`, `execute_sql`) or reference the generated Supabase types.
- When adding or modifying a form field, verify the field name matches the exact column name in Supabase. Mismatches between form fields and DB columns are the #1 source of portal bugs.

### Error Handling
- Every Supabase call must have explicit error handling: `const { data, error } = await supabase...` followed by an `if (error)` block.
- Never silently swallow errors. At minimum: log to console, show a toast/alert to the user, and if Sentry is configured, let it capture the error.
- API/edge function calls must have try/catch with meaningful error messages — not generic "Something went wrong."

### Pre-Commit Checklist (Before Every PR)
1. `npm run build` passes with zero errors and zero warnings.
2. `npm run lint` passes clean.
3. All new/modified mutations have corresponding tests.
4. All forms validate inputs with Zod before submission.
5. No hardcoded values that should come from the database or env vars.
6. No `console.log` left in production code (use Sentry or structured logging).
7. Test the feature manually in the browser — click every button, submit every form, check every state (empty, loading, error, success).

### When Modifying Existing Features
- **Read the existing tests first** before changing anything. If tests exist, update them to match the new behavior.
- **If no tests exist for the feature you're modifying, write them first** (covering current behavior), then make your changes. This prevents regressions.
- Run the full test suite after changes. If anything breaks, fix it before proceeding.

### Database Changes
- Every schema change (new table, new column, altered type) must be done via a **Supabase migration** through MCP — never raw SQL in the dashboard.
- After any schema change, regenerate TypeScript types immediately: `npx supabase gen types typescript --project-id edhlkknvlczhbowasjna > src/types/supabase.ts`
- Update any affected Zod schemas to match the new types.
- If you add a new table, add RLS policies. No table ships without RLS.

### Forbidden Patterns
- ❌ `as any` — find the real type
- ❌ Optional chaining as a band-aid (`data?.something?.nested?.value`) when the data should be guaranteed — fix the data flow instead
- ❌ Submitting forms without validation
- ❌ Mutations without error handling
- ❌ New tables without RLS policies
- ❌ Pushing code that doesn't build
- ❌ Skipping tests because "it's a small change"
