import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/format";
import Link from "next/link";
import { Plus, Calculator, FileText, BarChart3 } from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default async function DSCRDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let lenders: any[] = [];
  let products: any[] = [];
  let recentRuns: any[] = [];

  try {
    const { data } = await (supabase as any)
      .from("dscr_lenders")
      .select("*")
      .eq("is_active", true)
      .order("name");
    lenders = data ?? [];
  } catch { /* table may not exist */ }

  try {
    const { data } = await (supabase as any)
      .from("dscr_lender_products")
      .select("*, dscr_lenders(name, short_name)")
      .eq("is_active", true)
      .order("product_name");
    products = data ?? [];
  } catch { /* table may not exist */ }

  try {
    const { data } = await (supabase as any)
      .from("dscr_pricing_runs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);
    recentRuns = data ?? [];
  } catch { /* table may not exist */ }

  const productsWithRates = products.filter((p: any) => p.rate_sheet_date);
  const staleProducts = productsWithRates.filter((p: any) => {
    if (!p.rate_sheet_date) return false;
    const sheetDate = new Date(p.rate_sheet_date);
    const daysSince = (Date.now() - sheetDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince > 1;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="DSCR Pricing Engine"
        description="Run deals through wholesale lender pricing grids, manage rate sheets, and find best execution"
        action={
          <div className="flex gap-2">
            <Link href="/admin/dscr/rate-sheets">
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Rate Sheets
              </Button>
            </Link>
            <Link href="/admin/dscr/price">
              <Button>
                <Calculator className="h-4 w-4 mr-2" />
                Price a Deal
              </Button>
            </Link>
          </div>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Active Lenders" value={lenders.length} />
        <KpiCard title="Active Products" value={productsWithRates.length} />
        <KpiCard
          title="Stale Rate Sheets"
          value={staleProducts.length}
        />
        <KpiCard title="Deals Priced" value={recentRuns.length} />
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link href="/admin/dscr/price">
          <Card className="hover:border-teal-400 transition-colors cursor-pointer h-full">
            <CardContent className="pt-6 flex items-start gap-4">
              <div className="p-3 bg-teal-50 rounded-lg">
                <Calculator className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                <h3 className="font-semibold">Price a Deal</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter deal parameters and get quotes from all active lenders
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/dscr/rate-sheets">
          <Card className="hover:border-teal-400 transition-colors cursor-pointer h-full">
            <CardContent className="pt-6 flex items-start gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">Manage Rate Sheets</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload, parse, and commit lender rate sheets
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/dscr/pipeline">
          <Card className="hover:border-teal-400 transition-colors cursor-pointer h-full">
            <CardContent className="pt-6 flex items-start gap-4">
              <div className="p-3 bg-purple-50 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold">DSCR Pipeline</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  View all priced deals and their status
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Active Lenders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Active Lender Partners</CardTitle>
          <Link href="/admin/dscr/lenders">
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Manage Lenders
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {lenders.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No lender partners configured.{" "}
              <Link href="/admin/dscr/lenders" className="text-teal-600 hover:underline">
                Add your first lender
              </Link>
              .
            </p>
          ) : (
            <div className="space-y-3">
              {lenders.map((l: any) => {
                const lenderProducts = products.filter(
                  (p: any) => p.lender_id === l.id
                );
                return (
                  <div
                    key={l.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{l.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {l.short_name}
                        {l.account_executive && ` — AE: ${l.account_executive}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {lenderProducts.length > 0 ? (
                        <div className="text-right">
                          <div className="text-sm">
                            {lenderProducts.length} product
                            {lenderProducts.length !== 1 ? "s" : ""}
                          </div>
                          {lenderProducts[0]?.rate_sheet_date && (
                            <div className="text-xs text-muted-foreground">
                              Sheet: {formatDate(lenderProducts[0].rate_sheet_date)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <Badge variant="outline">No products</Badge>
                      )}
                      <Link href={`/admin/dscr/lenders/${l.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Pricing Runs */}
      {recentRuns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Pricing Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentRuns.map((r: any) => (
                <Link
                  key={r.id}
                  href={`/admin/dscr/price/results?run=${r.id}`}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <div className="font-medium">
                      {r.borrower_name || "Unnamed"} — {r.property_state}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(r.loan_amount)} | {r.ltv?.toFixed(1)}% LTV |
                      FICO {r.fico_score} | {r.loan_purpose}
                    </div>
                  </div>
                  <div className="text-right">
                    {r.best_execution_rate && (
                      <div className="font-medium text-teal-600">
                        {r.best_execution_rate}% via {r.best_execution_lender}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {formatDate(r.created_at)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
