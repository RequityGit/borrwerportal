import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { LendersList } from "@/components/admin/dscr/lenders-list";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default async function LendersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let lenders: any[] = [];
  try {
    const { data } = await (supabase as any)
      .from("dscr_lenders")
      .select("*")
      .order("name");
    lenders = data ?? [];
  } catch { /* table may not exist */ }

  return (
    <div className="space-y-6">
      <PageHeader
        title="DSCR Lender Partners"
        description="Manage wholesale lender partners for DSCR loan pricing"
        action={
          <Link href="/admin/dscr">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to DSCR
            </Button>
          </Link>
        }
      />
      <LendersList lenders={lenders} />
    </div>
  );
}
