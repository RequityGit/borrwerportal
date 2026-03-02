import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { DealPricingForm } from "@/components/admin/dscr/deal-pricing-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function PriceDealPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Price a DSCR Deal"
        description="Enter deal parameters to get quotes from all active lenders"
        action={
          <Link href="/admin/dscr">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to DSCR
            </Button>
          </Link>
        }
      />
      <DealPricingForm />
    </div>
  );
}
