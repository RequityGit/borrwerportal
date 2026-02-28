# CLAUDE.md — Requity Group Portal

## Project Overview

Requity Group Unified Portal — a full-stack SaaS platform for lending/fintech with role-based access for admins, borrowers, and investors. Built with Next.js 14 (App Router), TypeScript, Supabase, and Tailwind CSS. Deployed on Netlify.

## Commands

- `npm run dev` — Start dev server (Turbopack)
- `npm run build` — Production build
- `npm run start` — Start production server
- `npm run lint` — Run ESLint

There is no test framework configured. No unit or integration tests exist.

## Tech Stack

- **Framework**: Next.js 14.2.21 with App Router
- **Language**: TypeScript 5.7 (strict mode)
- **Database**: Supabase PostgreSQL with Row Level Security
- **Auth**: Supabase Auth with SSR support (`@supabase/ssr`)
- **Styling**: Tailwind CSS 3.4 with `class-variance-authority` and `tailwind-merge`
- **UI Components**: Radix UI primitives (headless) + custom components in `components/ui/`
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **Drag & Drop**: @dnd-kit
- **Deployment**: Netlify (`netlify.toml`)

## Environment Variables

Required in `.env` (see `.env.example`):
```
NEXT_PUBLIC_SUPABASE_URL=        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Supabase anon/public key
SUPABASE_SERVICE_ROLE_KEY=       # Supabase service role key (server-side only, for admin operations)
```

## Project Structure

```
app/                          # Next.js App Router pages
  (authenticated)/            # Protected routes (layout enforces auth)
    admin/                    # Admin dashboard, user/fund/loan management
    borrower/                 # Borrower portal (loans, draws, payments)
    investor/                 # Investor portal (funds, capital calls, distributions)
  api/                        # API routes (e.g. switch-role)
  auth/                       # OAuth callback routes
  login/                      # Login page
components/
  ui/                         # Reusable Radix-based UI primitives
  layout/                     # Sidebar, topbar, role-switcher
  shared/                     # Data table, file upload, KPI cards
  admin/                      # Admin-specific components
  borrower/                   # Borrower-specific components
  investor/                   # Investor-specific components
  operations/                 # Project/task management components
lib/
  supabase/                   # Supabase clients (client.ts, server.ts, admin.ts, middleware.ts)
  supabase/types.ts           # Generated Supabase TypeScript types
  utils.ts                    # General utilities (cn helper)
  constants.ts                # Business logic constants (loan stages, fund types, etc.)
  format.ts                   # Formatting utilities
supabase/
  migrations/                 # SQL migrations (7 files)
  seed.sql                    # Database seed script
middleware.ts                 # Role-based route protection & redirects
```

## Architecture Patterns

- **Path alias**: `@/*` maps to the project root — use `@/components/...`, `@/lib/...`, etc.
- **Authentication**: Supabase session managed via middleware. Unauthenticated users redirect to `/login`. Role stored in `profiles` table; active role tracked via cookie.
- **Multi-role support**: Users can have `allowed_roles[]`. Role switching uses the `/api/switch-role` endpoint and `active_role` cookie.
- **Route groups**: `(authenticated)` layout wraps all protected pages; role-specific subdirectories enforce access.
- **Server components by default**: Use `"use client"` directive only when needed for interactivity.
- **Supabase clients**: Use `createClient()` from `lib/supabase/client.ts` in client components, `createServerClient()` from `lib/supabase/server.ts` in server components/actions, and `createAdminClient()` for service-role operations.

### Server Actions Pattern

Server actions live in `actions.ts` files colocated with their page (e.g., `app/(authenticated)/admin/borrowers/new/actions.ts`). They follow this pattern:

1. Start with `"use server"` directive
2. Verify auth with `requireAdmin()` helper (checks user session + role)
3. Use admin client (`createAdminClient()`) for write operations that bypass RLS
4. Return `{ success: true, ... }` or `{ error: string }` objects
5. Wrap in try/catch with console.error logging

## Code Style

- TypeScript strict mode — avoid `any` types
- Use `cn()` from `@/lib/utils` to merge Tailwind classes
- Components use Radix UI primitives wrapped in `components/ui/`; prefer composing existing UI components
- Forms use React Hook Form with Zod schemas for validation
- Follow existing naming conventions: PascalCase for components, camelCase for utilities, kebab-case for files

## Database

- Supabase PostgreSQL with Row Level Security (RLS) enabled on all tables
- Core tables: `profiles`, `funds`, `investor_commitments`, `capital_calls`, `distributions`, `loans`, `draw_requests`, `payments`, `documents`
- Migrations live in `supabase/migrations/` — create new timestamped migration files for schema changes
- Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

### Row Level Security (RLS)

All tables have RLS enabled. General pattern:
- **Users** see only their own rows (via `auth.uid()` match)
- **Admins** have full CRUD on all tables
- **Borrowers** can insert their own draw requests
- **Storage**: Two buckets (`investor-documents`, `loan-documents`) with folder-based RLS

## Important Notes

- The `@/` path alias is used everywhere — always use it for imports
- No test framework is configured; run `npm run lint` to check for issues
- The project deploys to Netlify using `@netlify/plugin-nextjs`
- Supabase migrations are in `supabase/migrations/` and are ordered by timestamp
- The authenticated layout sets `dynamic = "force-dynamic"` to prevent static generation
- When creating new pages, follow existing patterns: server component with data fetching, use `PageHeader`, `KpiCard`, shared components
- Server actions should always verify authentication and admin role before performing mutations
- All financial amounts use `formatCurrency()` or `formatCurrencyDetailed()` from `lib/format.ts`
