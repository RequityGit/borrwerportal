import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { SavedPricingResults } from "@/components/admin/dscr/saved-pricing-results";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default async function PricingResultsPage({
  searchParams,
}: {
  searchParams: { run?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const runId = searchParams.run;
  if (!runId) {
    redirect("/admin/dscr/pipeline");
  }

  const { data: run } = await (supabase as any)
    .from("dscr_pricing_runs")
    .select("*")
    .eq("id", runId)
    .single();

  if (!run) {
    redirect("/admin/dscr/pipeline");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pricing Results"
        description={`${run.borrower_name || "Deal"} — ${run.property_state} — ${run.loan_purpose}`}
        action={
          <Link href="/admin/dscr/pipeline">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Pipeline
            </Button>
          </Link>
        }
      />
      <SavedPricingResults run={run} />
    </div>
  );
}
