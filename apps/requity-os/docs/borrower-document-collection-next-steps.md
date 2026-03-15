# Borrower Document Collection — Next Steps

Prioritized ideas to improve the borrower document collection experience. Each section is ordered by impact vs effort.

---

## 1. Notify team when borrower uploads (high impact, medium effort)

**Current:** Team must check the pipeline or Drive to see if new docs arrived.

**Idea:** When a file is uploaded via a secure upload link, trigger an in-app notification (and optionally email) to the deal team or deal owner so they can review without polling.

**Implementation sketch:**
- In `app/api/upload-link/upload/route.ts`, after a successful upload (and after Drive sync if desired), call your existing notification helper or insert into `notifications` (or send to a “document received” notification type).
- Include deal name, document name(s), and link to the deal’s Diligence tab (or document list).
- Optionally add a notification type “Borrower document uploaded” and let users opt in/out of email in Control Center.

**Why first:** Reduces follow-up delay and gives borrowers confidence that “someone saw it.”

---

## 2. “Send link by email” from the Upload Link dialog (high impact, medium effort)

**Current:** Admin copies the link and pastes it into Gmail/Outlook/Slack manually.

**Idea:** In the Upload Link dialog, add a “Send by email” action that opens the email compose sheet (or a simple modal) with:
- Pre-filled subject, e.g. “Document upload link for [Deal Name]”
- Pre-filled body with short instructions and the upload URL (or use a user email template with merge fields like `{{upload_link}}`, `{{deal_name}}`, `{{expiry_date}}`).
- To: optional contact selector (primary contact or any contact linked to the deal).

**Implementation sketch:**
- Reuse `EmailComposeSheet` or a lighter “send link” modal.
- Resolve deal name and (optionally) primary contact from deal/CRM.
- If you have user email templates, add a “Document upload request” template with variables for link, deal name, expiry, instructions.

**Why:** Fewer steps for staff, consistent messaging, and a clear audit trail if you store sent emails in CRM.

---

## 3. Borrower confirmation after upload (medium impact, low effort)

**Current:** Borrower uploads and sees success in the UI but has no record that “Requity received my documents.”

**Idea:** After a successful upload (or when they close the page after uploading), show a clear confirmation state and/or send a short automated email: “We’ve received your documents for [Deal Name]. Our team will review and be in touch.”

**Implementation sketch:**
- **In-app:** On the upload page, after `uploaded.length > 0` and no errors, show a green “We’ve received your documents” message with deal name and optional “You can close this page.”
- **Email (optional):** Add an optional “Send confirmation email” when creating the link, or always trigger a transactional email from the upload API (e.g. Postmark/Resend) to a “reply-to” or contact email if you capture it. If you don’t capture borrower email on the upload page, you could add an optional “Email for confirmation (optional)” field on the upload page, or rely on the link having been sent to their email so you can reply-to that thread later.

**Why:** Reduces “Did you get it?” emails and builds trust.

---

## 4. Clearer upload page UX (medium impact, low–medium effort)

**Current:** Checklist with “Drop files or click to upload” per condition; remaining uploads count; no explicit “done” state per item.

**Ideas:**
- **Per-condition “done” state:** When a condition has at least one document uploaded (for checklist mode), show a small check or “Received” so the borrower sees progress (e.g. “Borrower ID – 1 file received”).
- **Summary at top:** “We need X items. You’ve uploaded for Y of them” (and “Z files in Other Documents” if general upload is used).
- **Reminder of expiry:** “This link expires on [date]. Please upload by then.”
- **Mobile:** Ensure the upload page is touch-friendly (large tap targets, one-column layout already helps).

**Why:** Borrowers complete checklists faster when they see what’s done and what’s left.

---

## 5. Optional “request documents” email template (medium impact, low effort)

**Current:** Staff write ad-hoc emails when requesting documents.

**Idea:** In Control Center user email templates (or pipeline-specific templates), add a “Document upload request” template with merge fields such as:
- `{{upload_link}}` – the secure upload URL
- `{{deal_name}}`
- `{{expiry_date}}`
- `{{instructions}}` or custom instructions

Then, when creating an upload link, staff can “Copy link” or “Send by email” and pick this template so the link and wording are consistent and compliant.

**Why:** Consistent, on-brand requests and easier onboarding of new staff.

---

## 6. Expiry reminder (optional) (medium impact, medium effort)

**Current:** Links expire; borrowers may only realize when they open the link.

**Idea:** If you send the link by email (see #2) and store the recipient (e.g. contact_id or email) with the link, you could run a daily job: “Links expiring in 24–48 hours that have not reached max_uploads” and send a one-time reminder email (“Your document upload link for [Deal] expires on [date]. Upload here: [link]”).

**Implementation sketch:**
- Add optional `sent_to_email` (or link to `crm_contacts`) on `secure_upload_links` if you want to track who was sent the link.
- Cron or scheduled Supabase Edge Function: query links where `expires_at` is in 24–48h and `upload_count` &lt; `max_uploads` (or any link that’s still active), then send reminder via your email provider.

**Why:** Fewer “my link expired” support requests and more documents in on time.

---

## 7. Dashboard or list of “pending borrower uploads” (lower priority, higher effort)

**Current:** Staff go deal-by-deal to see what’s outstanding.

**Idea:** A simple view (e.g. “Document requests” or a filter on pipeline) listing: Deal, “Upload link sent,” “Expires,” “Uploads received,” “Last upload.” Helps ops prioritize follow-up.

**Implementation sketch:**
- Query `secure_upload_links` (and optionally `unified_deal_documents` where `visibility = 'external'`) joined to deals, filter `status = 'active'` and `expires_at > now()`.
- Expose as a table or a section in pipeline home / a dedicated “Document requests” page.

**Why:** Better visibility at scale when many deals have links out.

---

## 8. Optional extra security (only if required by compliance or policy)

**Ideas (only if needed):**
- **Optional link password:** Store a hashed password on the link; validate before showing the upload form. Adds friction; use only if required.
- **Virus/malware scan:** Integrate a scan-on-upload (e.g. ClamAV or a cloud scanner) before accepting the file. Useful for strict compliance.
- **Audit log:** Log “link viewed” / “upload started” / “upload completed” with timestamp and IP (and optionally user-agent) in a small `secure_upload_link_events` table for compliance.

**Why:** Only pursue if a specific regulation or policy demands it.

---

## Suggested order

| Priority | Item                                      | Rationale |
|----------|-------------------------------------------|-----------|
| 1        | Notify team when borrower uploads         | Immediate ops benefit; uses existing notification patterns. |
| 2        | Send link by email from dialog            | Less manual work; consistent messaging. |
| 3        | Borrower confirmation (in-app + optional email) | Trust and fewer “Did you get it?” emails. |
| 4        | Upload page UX (done state, summary, expiry)   | Better completion rates. |
| 5        | Email template for document request       | Quick win if you already have template system. |
| 6        | Expiry reminder job                       | Helpful as volume grows. |
| 7        | Pending uploads dashboard                 | When you have many links out. |
| 8        | Extra security (password, scan, audit)   | Only if required. |

---

*Last updated: 2026-03-15*
