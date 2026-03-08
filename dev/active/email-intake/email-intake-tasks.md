# Email Intake - Tasks

## Phase 1: Database
- [ ] Create migration for `email_intake_queue` table with RLS
- [ ] Push migration to Supabase
- [ ] Regenerate types

## Phase 2: Gmail Sync Extension
- [ ] Add `isIntakeEmail()` function
- [ ] Add `downloadGmailAttachment()` helper
- [ ] Add `processIntakeEmail()` function
- [ ] Modify `processMessage()` to bypass external match for intake emails
- [ ] Add `GmailMessagePart` attachment fields to type

## Phase 3: AI Extraction API
- [ ] Create `/api/intake/process` route
- [ ] Email body extraction prompt
- [ ] Attachment extraction (reuse extract-from-document pattern)
- [ ] Result merging logic
- [ ] Card type auto-detection
- [ ] Contact matching

## Phase 4: UI
- [ ] Intake queue page
- [ ] IntakeQueue list component
- [ ] IntakeReviewSheet component
- [ ] Sidebar nav item with badge

## Phase 5: Deal Resolution
- [ ] `resolveIntakeItemAction` server action
- [ ] Create deal flow
- [ ] Attach to existing deal flow
- [ ] Dismiss flow

## Phase 6: Verification
- [ ] Build passes
- [ ] Manual test flow

## Last Updated: 2026-03-08
