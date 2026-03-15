# Requity Group Marketing Site — Go-Live Analysis

**Scope:** Front-end marketing / investor-facing site (requitygroup.com).  
**Stack:** Next.js 14 (App Router), Tailwind, Supabase (read-only for site content), Netlify.

---

## Executive Summary

The site is **close to launch** but has **one blocking bug** (deal submission form does not submit), **one data-layer bug** (build-time errors for `site_company_info`), and several **pre-launch tasks** (form wiring, env, content encoding, optional hardening). Below: what’s in good shape, what’s broken, and a prioritized checklist to go live.

---

## 1. What’s in Good Shape

- **Pages & content:** Home, About, Invest, Fund, Lending, Lending/Apply are implemented with clear CTAs and structure.
- **SEO:** Per-page metadata (title, description, OG, Twitter), `metadataBase: https://requitygroup.com`, `StructuredData` (JSON-LD FinancialService).
- **Performance:** Static generation (SSG), `revalidate = 300` (ISR) on data-driven pages.
- **Security headers:** Netlify `netlify.toml` sets CSP, HSTS, X-Frame-Options, etc.; edge function forces HTTPS.
- **Analytics:** GA4 hook present; gated on `NEXT_PUBLIC_GA_ID` (optional).
- **Deploy config:** Netlify build command and `@netlify/plugin-nextjs` are set; base = `apps/requity-group`.
- **Data:** Content comes from Supabase `site_*` tables (navigation, company info, stats, testimonials, sections, loan programs, insights, team). Tables exist in schema (referenced in `packages/db/supabase/types.ts`).
- **Brand assets:** Favicon and OG image from Supabase Storage (`brand-assets`); logo in Nav/Footer.
- **Build:** `pnpm --filter @repo/requity-group build` completes (with runtime errors during SSG; see below).

---

## 2. Blocking Issues (Must Fix Before Go-Live)

### 2.1 Deal submission form does not submit (Critical)

**File:** `apps/requity-group/app/lending/apply/page.tsx`

The “Deal Submission” block is a `<div>` with fieldsets and inputs; there is **no `<form>`** and no `action`/`method`. The “Submit Deal” button is `type="submit"` but has no form, so it does nothing (or would do a GET to the current URL with no body).

**Required:**

- Wrap all fields + submit button in a `<form>`.
- Choose a submission path and implement it:
  - **Option A (recommended for speed):** `action="mailto:lending@requitygroup.com"` and `method="get"` (or a mailto link that opens the client). Simple but no server-side storage.
  - **Option B:** Server Action in Next.js that sends email (e.g. Resend/SendGrid) and/or writes to a Supabase table (e.g. `lending_inquiries` or `contact_submissions`), then redirect or show success.
- Ensure required/validation and success/error UX if you use Option B.

### 2.2 `site_company_info` query fails at build time

**Symptom:** During `next build`, multiple:

```text
Error fetching site_company_info: column site_company_info.sort_order does not exist
```

**Cause:** `lib/supabase.ts` → `fetchSiteData()` always applies `.order("sort_order", { ascending: true })` when `options.order` is omitted. The table `site_company_info` has no `sort_order` column (single-row config table).

**Required:** Make ordering optional for that table.

- **Option A (recommended):** In `fetchSiteData`, add an option (e.g. `skipOrder?: true`). When calling for `site_company_info`, pass `skipOrder: true` and do not call `.order()`.
- **Option B:** Add a `sort_order` column to `site_company_info` and set it in the DB (e.g. 0). More invasive and unnecessary for a single row.

After the fix, build should complete with no `site_company_info` errors. Layout still receives company data (or empty) because the helper currently returns `[]` on error.

---

## 3. High-Priority Pre-Launch (Strongly Recommended)

### 3.1 Fix character encoding on `/fund` (and any similar pages)

**File:** `apps/requity-group/app/fund/page.tsx`

- Metadata description and body copy use corrupted sequences: `â` (should be `—`), `â★` (should be `★`), and long comment blocks that were box-drawing characters. This is typically UTF-8 saved as Latin-1 or similar.
- **Action:** Replace those strings with correct UTF-8 (e.g. `—`, `★`). Remove or shorten comments if needed so the file is saved as UTF-8. Re-run build and visually check `/fund` and metadata in devtools/social preview.

### 3.2 Environment variables and Supabase config

- **Supabase:** URL and anon key are hardcoded in `lib/supabase.ts`. For production it’s better to use env (e.g. `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) so you can point to different projects or rotate keys without code changes.
- **Analytics:** Set `NEXT_PUBLIC_GA_ID` in Netlify (and locally if you want GA in dev).
- **Action:** Add `apps/requity-group/.env.example` documenting `NEXT_PUBLIC_GA_ID` and any Supabase vars; use them in `lib/supabase.ts` and keep example values placeholder-only.

### 3.3 “Request Access” / “#access” behavior

- Several CTAs use `href="#access"` (e.g. on Invest, Fund). Ensure there is a matching `id="access"` on the same page (e.g. the “Request Access” / fund card section). On `/fund`, `id="access"` is already on the fund card; verify on `/invest` and any other pages that use `#access`.

---

## 4. Nice-to-Have Before or Soon After Launch

- **Lending form:** Add basic validation (e.g. email format) and a clear success state (and, if using a server action, error state). Consider honeypot or rate limit for spam.
- **Images:** ESLint warns on raw `<img>` in Nav and Footer. Consider switching to `next/image` for logo (and any other above-the-fold images) for LCP/bandwidth; ensure Supabase Storage domain is in `next.config.mjs` images.domains if needed.
- **Fonts:** Layout loads Inter via a `<link>` in the layout. Next.js recommends `next/font` for better behavior; optional but improves font loading.
- **Netlify:** Confirm in Netlify UI that the repo root and base directory (`apps/requity-group`) and build command match `netlify.toml`. With `@netlify/plugin-nextjs`, the plugin usually overrides `publish`; if the first deploy fails, check “Publish directory” and build logs.
- **Domain:** Point requitygroup.com to the Netlify site (DNS + Netlify domain config) and ensure HTTPS (Netlify + edge function handle this).

---

## 5. Content and Data Checklist

- **Supabase:** Populate (or verify) `site_navigation`, `site_company_info`, `site_stats` (e.g. `page_slug: 'home'`), `site_testimonials`, `site_page_sections` (e.g. `page_slug: 'invest'`, `lending`), `site_loan_programs`, `site_team_members`, `site_insights` so all pages render as intended. Empty tables are handled with fallbacks or hidden sections, but nav/footer and stats should have at least one row each.
- **Investor login:** If “Investor Login” is in nav, ensure the corresponding `site_navigation` row has the correct external URL (e.g. portal.requitygroup.com or RequityOS login).
- **Legal / compliance:** Add or link to Privacy Policy and Terms if required for investor/lending flows; link from footer if you have a “Resources” or “Legal” section.

---

## 6. Prioritized Go-Live Checklist

**Fixes already applied (this session):**

- **P0** Deal submission: form added with `action="mailto:lending@requitygroup.com"` and `method="get"`; hidden `subject` input set.
- **P0** `site_company_info`: `fetchSiteData` now skips `sort_order` for tables in `TABLES_WITHOUT_SORT_ORDER`; layout calls with `skipOrder: true`. Build no longer logs errors for this table.
- **P1** `/fund` page: Corrupted em-dash and star sequences replaced with correct UTF-8 (`—`, `★`). File is valid UTF-8 and build passes.

| Priority | Item | Owner / Notes |
|----------|------|----------------|
| P0 | ~~Fix deal submission~~ | Done: form + mailto |
| P0 | ~~Fix `site_company_info` fetch~~ | Done: skipOrder |
| P1 | ~~Fix UTF-8 on `/fund`~~ | Done |
| P1 | Move Supabase config to env; add `.env.example` | Dev |
| P1 | Set `NEXT_PUBLIC_GA_ID` in Netlify (and optionally locally) | Ops |
| P1 | Verify `#access` targets on Invest/Fund | Dev |
| P2 | Confirm Netlify build (base, command, publish) and first deploy | Ops |
| P2 | Point requitygroup.com to Netlify, verify HTTPS | Ops |
| P2 | Populate/verify Supabase `site_*` content | Content |
| P2 | Optional: next/image for logos, next/font for Inter | Dev |
| P3 | Privacy/Terms links if required | Legal / Content |

---

## 7. Post-Launch

- Monitor GA4 (if enabled) and Netlify analytics for 404s and errors.
- If you add a server action for the lending form, consider storing submissions in Supabase and notifying the team (e.g. email or internal tool).
- Consider a sitemap (e.g. `app/sitemap.ts`) and `robots.txt` if you want tighter control over indexing (Next.js can generate these).

---

*Generated from codebase review and build run. Last build: `pnpm --filter @repo/requity-group build` (succeeds with SSG errors for `site_company_info`).*
