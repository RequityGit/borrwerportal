import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { LenderDetail } from "@/components/admin/dscr/lender-detail";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default async function LenderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: lender } = await (supabase as any)
    .from("dscr_lenders")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!lender) notFound();

  let products: any[] = [];
  let uploads: any[] = [];

  try {
    const { data } = await (supabase as any)
      .from("dscr_lender_products")
      .select("*")
      .eq("lender_id", params.id)
      .order("product_name");
    products = data ?? [];
  } catch { /* */ }

  try {
    const { data } = await (supabase as any)
      .from("dscr_rate_sheet_uploads")
      .select("*")
      .eq("lender_id", params.id)
      .order("created_at", { ascending: false })
      .limit(20);
    uploads = data ?? [];
  } catch { /* */ }

  return (
    <div className="space-y-6">
      <PageHeader
        title={lender.name}
        description={`${lender.short_name}${lender.nmls_id ? ` | NMLS: ${lender.nmls_id}` : ""}${lender.account_executive ? ` | AE: ${lender.account_executive}` : ""}`}
        action={
          <Link href="/admin/dscr/lenders">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Lenders
            </Button>
          </Link>
        }
      />
      <LenderDetail lender={lender} products={products} uploads={uploads} />
    </div>
  );
}
