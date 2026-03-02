import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { RateSheetManager } from "@/components/admin/dscr/rate-sheet-manager";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default async function RateSheetsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let lenders: any[] = [];
  let products: any[] = [];
  let uploads: any[] = [];

  try {
    const { data } = await (supabase as any)
      .from("dscr_lenders")
      .select("*")
      .eq("is_active", true)
      .order("name");
    lenders = data ?? [];
  } catch { /* */ }

  try {
    const { data } = await (supabase as any)
      .from("dscr_lender_products")
      .select("*, dscr_lenders(name, short_name)")
      .order("product_name");
    products = data ?? [];
  } catch { /* */ }

  try {
    const { data } = await (supabase as any)
      .from("dscr_rate_sheet_uploads")
      .select("*, dscr_lenders(name, short_name)")
      .order("created_at", { ascending: false })
      .limit(50);
    uploads = data ?? [];
  } catch { /* */ }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rate Sheet Management"
        description="Upload, parse, and commit lender rate sheets"
        action={
          <Link href="/admin/dscr">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to DSCR
            </Button>
          </Link>
        }
      />
      <RateSheetManager
        lenders={lenders}
        products={products}
        uploads={uploads}
      />
    </div>
  );
}
