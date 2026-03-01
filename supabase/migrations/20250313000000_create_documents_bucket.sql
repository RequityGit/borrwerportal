-- ===========================================================================
-- Create the general-purpose "documents" storage bucket
-- ===========================================================================
-- Several admin components (loan-detail-actions, document-upload-form,
-- investor-actions) upload to a bucket named "documents", but this bucket
-- was never created. Only "loan-documents" and "investor-documents" existed.
-- This migration creates the missing bucket and adds RLS policies.
-- ===========================================================================

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false);


-- ===========================================================================
-- RLS Policies for the "documents" bucket
-- ===========================================================================

-- Admins have full access (all uploads originate from admin components)
create policy "Admins full access to documents"
  on storage.objects for all
  using (
    bucket_id = 'documents'
    and exists (
      select 1 from public.user_roles
      where user_id = (select auth.uid())
      and role in ('admin', 'super_admin')
    )
  )
  with check (
    bucket_id = 'documents'
    and exists (
      select 1 from public.user_roles
      where user_id = (select auth.uid())
      and role in ('admin', 'super_admin')
    )
  );

-- Borrowers can view documents for their own loans
-- Storage path pattern: loans/{loanId}/{timestamp}_{filename}
create policy "Borrowers can view own loan documents"
  on storage.objects for select
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = 'loans'
    and exists (
      select 1 from public.loans l
      join public.borrowers b on b.id = l.borrower_id
      where b.user_id = (select auth.uid())
      and l.id::text = (storage.foldername(name))[2]
    )
  );

-- Investors can view their own documents
-- Storage path pattern: investors/{investorId}/{timestamp}_{filename}
create policy "Investors can view own investor documents"
  on storage.objects for select
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = 'investors'
    and exists (
      select 1 from public.investors i
      where i.user_id = (select auth.uid())
      and i.id::text = (storage.foldername(name))[2]
    )
  );
