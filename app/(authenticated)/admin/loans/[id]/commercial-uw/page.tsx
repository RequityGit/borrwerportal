import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { CommercialUWClient } from "@/components/admin/commercial-uw/commercial-uw-client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  params: { id: string };
}

export default async function CommercialUWPage({ params }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id: loanId } = await params;

  // Fetch loan
  const { data: loan } = await supabase
    .from("loans")
    .select(
      "id, loan_number, property_address, property_type, type, purchase_price, loan_amount, borrower:borrowers!loans_borrower_id_fkey(first_name, last_name)"
    )
    .eq("id", loanId)
    .single();

  if (!loan) notFound();

  // Fetch existing underwriting (if any)
  const { data: uw } = await supabase
    .from("commercial_underwriting")
    .select("*")
    .eq("loan_id", loanId)
    .single();

  // Fetch rent roll, occupancy, ancillary, proforma, upload mappings if UW exists
  let rentRoll: unknown[] = [];
  let occupancyRows: unknown[] = [];
  let ancillaryRows: unknown[] = [];
  let proformaYears: unknown[] = [];
  let uploadMappings: unknown[] = [];

  if (uw) {
    const [rrResult, occResult, ancResult, pfResult, umResult] = await Promise.all([
      supabase
        .from("commercial_rent_roll")
        .select("*")
        .eq("underwriting_id", uw.id)
        .order("sort_order"),
      supabase
        .from("commercial_occupancy_income")
        .select("*")
        .eq("underwriting_id", uw.id)
        .order("sort_order"),
      supabase
        .from("commercial_ancillary_income")
        .select("*")
        .eq("underwriting_id", uw.id)
        .order("sort_order"),
      supabase
        .from("commercial_proforma_years")
        .select("*")
        .eq("underwriting_id", uw.id)
        .order("year"),
      supabase
        .from("commercial_upload_mappings")
        .select("id, upload_type, original_filename, column_mapping, row_count, parsed_data, created_at")
        .eq("underwriting_id", uw.id)
        .order("created_at", { ascending: false }),
    ]);
    rentRoll = rrResult.data ?? [];
    occupancyRows = occResult.data ?? [];
    ancillaryRows = ancResult.data ?? [];
    proformaYears = pfResult.data ?? [];
    uploadMappings = umResult.data ?? [];
  }

  // Fetch expense defaults
  const { data: expenseDefaults } = await supabase
    .from("commercial_expense_defaults")
    .select("*")
    .order("property_type");

  const borrowerRaw = (loan as Record<string, unknown>).borrower as Record<string, string> | null;
  const borrowerName = borrowerRaw
    ? `${borrowerRaw.first_name ?? ""} ${borrowerRaw.last_name ?? ""}`.trim() || "—"
    : "—";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href={`/admin/loans/${loanId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Loan
          </Button>
        </Link>
      </div>

      <PageHeader
        title={`Commercial Underwriting — ${loan.loan_number ?? "New"}`}
        description={`${loan.property_address ?? "No address"} — ${borrowerName}`}
      />

      <CommercialUWClient
        loanId={loanId}
        loan={{
          loan_number: loan.loan_number,
          property_address: loan.property_address,
          property_type: loan.property_type,
          purchase_price: loan.purchase_price,
          loan_amount: loan.loan_amount,
        }}
        existingUW={uw}
        existingRentRoll={rentRoll}
        existingOccupancy={occupancyRows}
        existingAncillary={ancillaryRows}
        existingProforma={proformaYears}
        existingUploadMappings={uploadMappings}
        expenseDefaults={expenseDefaults ?? []}
      />
    </div>
  );
}
