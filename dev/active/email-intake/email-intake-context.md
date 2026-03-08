# Email Intake - Context

## Key Files
- `apps/requity-os/lib/gmail-sync.ts` - Gmail sync engine, `processMessage()` at line 374
- `apps/requity-os/app/api/deals/extract-from-document/route.ts` - Claude extraction pattern
- `apps/requity-os/components/pipeline-v2/NewDealDialog.tsx` - UI pattern for extracted fields review
- `apps/requity-os/app/(authenticated)/admin/pipeline-v2/actions.ts` - Server actions for deal creation
- `apps/requity-os/lib/document-upload-utils.ts` - File validation utilities
- `apps/requity-os/components/layout/sidebar.tsx` - Navigation sidebar

## Decisions Made
- Use Gmail sync extension (not Make.com) for simplicity
- `intake@requitygroup.com` as alias on Dylan's Gmail
- Extract from both attachments AND email body
- No sender restriction - any forwarded email gets queued
- Reuse `loan-documents` bucket with `email-intake/` prefix

## Dependencies
- Gmail sync cron must be running
- `intake@requitygroup.com` alias must be created in Google Workspace

## Last Updated: 2026-03-08
## Next Steps: Start with Phase 1 database migration
