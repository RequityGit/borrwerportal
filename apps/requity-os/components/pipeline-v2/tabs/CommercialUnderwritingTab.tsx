"use client";

import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  computeProForma,
  computeDealAnalysis,
  computeExitAnalysis,
  computeReturnSummary,
  computeSensitivity,
  computeWaterfallDistributions,
  computeAnnualDebtService,
  type DealIncomeRow,
  type DealExpenseRow,
  type DealUWRecord,
  type DealSourceUseRow,
  type DealWaterfallTier,
  type ProFormaYearResult,
} from "@/lib/commercial-uw/deal-computations";

// ── Types ──

export interface CommercialUWData {
  uw: Record<string, unknown>;
  income: Record<string, unknown>[];
  expenses: Record<string, unknown>[];
  rentRoll: Record<string, unknown>[];
  scopeOfWork: Record<string, unknown>[];
  sourcesUses: Record<string, unknown>[];
  debt: Record<string, unknown>[];
  waterfall: Record<string, unknown>[];
  allVersions: Record<string, unknown>[];
}

interface CommercialUnderwritingTabProps {
  data: CommercialUWData;
  dealId: string;
}

// ── Formatting Helpers ──

function n(v: unknown): number {
  if (v == null || v === "") return 0;
  const num = Number(v);
  return isNaN(num) ? 0 : num;
}

function fC(v: number | null | undefined): string {
  if (v == null) return "\u2014";
  if (v < 0)
    return `($${Math.abs(v).toLocaleString("en-US", { maximumFractionDigits: 0 })})`;
  return "$" + v.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function fCk(v: number | null | undefined): string {
  if (v == null) return "\u2014";
  const abs = Math.abs(v);
  const str =
    abs >= 1_000_000
      ? `$${(abs / 1_000_000).toFixed(2)}M`
      : abs >= 1_000
        ? `$${(abs / 1_000).toFixed(0)}K`
        : `$${abs.toFixed(0)}`;
  return v < 0 ? `(${str})` : str;
}

function fPct(v: number | null | undefined): string {
  if (v == null) return "\u2014";
  return `${(v * 100).toFixed(2)}%`;
}

function fX(v: number | null | undefined): string {
  if (v == null) return "\u2014";
  return `${v.toFixed(2)}x`;
}

// ── Main Component ──

export function CommercialUnderwritingTab({
  data,
  dealId,
}: CommercialUnderwritingTabProps) {
  const { uw, income, expenses, sourcesUses, waterfall } = data;

  // ── Parse raw data into typed rows ──

  const incomeRows: DealIncomeRow[] = useMemo(
    () =>
      income.map((r) => ({
        id: String(r.id ?? ""),
        line_item: String(r.line_item ?? ""),
        t12_amount: n(r.t12_amount),
        year_1_amount: n(r.year_1_amount),
        growth_rate: n(r.growth_rate),
        is_deduction: Boolean(r.is_deduction),
        sort_order: n(r.sort_order),
      })),
    [income],
  );

  const expenseRows: DealExpenseRow[] = useMemo(
    () =>
      expenses.map((r) => ({
        id: String(r.id ?? ""),
        category: String(r.category ?? ""),
        t12_amount: n(r.t12_amount),
        year_1_amount: n(r.year_1_amount),
        growth_rate: n(r.growth_rate),
        is_percentage: Boolean(r.is_percentage),
        sort_order: n(r.sort_order),
      })),
    [expenses],
  );

  const uwRecord: DealUWRecord = useMemo(
    () => ({
      purchase_price: n(uw?.purchase_price),
      closing_costs: n(uw?.closing_costs),
      capex_reserve: n(uw?.capex_reserve),
      working_capital: n(uw?.working_capital),
      num_units: n(uw?.num_units),
      total_sf: n(uw?.total_sf),
      loan_amount: n(uw?.loan_amount),
      interest_rate: n(uw?.interest_rate),
      amortization_years: n(uw?.amortization_years),
      loan_term_years: n(uw?.loan_term_years),
      io_period_months: n(uw?.io_period_months),
      origination_fee_pct: n(uw?.origination_fee_pct),
      exit_cap_rate: n(uw?.exit_cap_rate),
      hold_period_years: n(uw?.hold_period_years) || 5,
      sale_costs_pct: n(uw?.sale_costs_pct),
      disposition_fee_pct: n(uw?.disposition_fee_pct),
    }),
    [uw],
  );

  const suRows: DealSourceUseRow[] = useMemo(
    () =>
      sourcesUses.map((r) => ({
        type: (r.type as "source" | "use") ?? "use",
        line_item: String(r.line_item ?? ""),
        amount: n(r.amount),
      })),
    [sourcesUses],
  );

  const wfTiers: DealWaterfallTier[] = useMemo(
    () =>
      waterfall.map((r) => ({
        tier_order: n(r.tier_order),
        tier_name: String(r.tier_name ?? ""),
        hurdle_rate: r.hurdle_rate != null ? n(r.hurdle_rate) : null,
        sponsor_split: r.sponsor_split != null ? n(r.sponsor_split) : null,
        investor_split: r.investor_split != null ? n(r.investor_split) : null,
        is_catch_up: Boolean(r.is_catch_up),
      })),
    [waterfall],
  );

  // ── Computations ──

  const proForma = useMemo(
    () => computeProForma(incomeRows, expenseRows, uwRecord),
    [incomeRows, expenseRows, uwRecord],
  );

  const totalEquity = useMemo(() => {
    const equitySources = suRows
      .filter(
        (s) =>
          s.type === "source" &&
          s.line_item.toLowerCase().includes("equity"),
      )
      .reduce((sum, s) => sum + s.amount, 0);
    return equitySources > 0
      ? equitySources
      : uwRecord.purchase_price - uwRecord.loan_amount;
  }, [suRows, uwRecord]);

  const dealAnalysis = useMemo(
    () => computeDealAnalysis(uwRecord, proForma, suRows),
    [uwRecord, proForma, suRows],
  );

  const exitResult = useMemo(
    () => computeExitAnalysis(uwRecord, proForma, totalEquity),
    [uwRecord, proForma, totalEquity],
  );

  const returnSummary = useMemo(
    () => computeReturnSummary(uwRecord, proForma, totalEquity, exitResult),
    [uwRecord, proForma, totalEquity, exitResult],
  );

  const sensitivity = useMemo(
    () => computeSensitivity(uwRecord, proForma, totalEquity),
    [uwRecord, proForma, totalEquity],
  );

  const holdYears = uwRecord.hold_period_years || 5;

  const cashFlowsForWaterfall = useMemo(() => {
    const flows = [-totalEquity];
    for (let yr = 1; yr <= holdYears; yr++) {
      const pf = proForma.find((p) => p.year === yr);
      flows.push(pf?.cashFlowBeforeTax ?? 0);
    }
    return flows;
  }, [totalEquity, holdYears, proForma]);

  const waterfallResult = useMemo(
    () =>
      computeWaterfallDistributions(
        wfTiers,
        cashFlowsForWaterfall,
        exitResult.equityReturned,
        totalEquity,
      ),
    [wfTiers, cashFlowsForWaterfall, exitResult, totalEquity],
  );

  // Sources & Uses derived
  const sources = suRows.filter((s) => s.type === "source");
  const uses = suRows.filter((s) => s.type === "use");
  const sourcesTotal = sources.reduce((sum, s) => sum + s.amount, 0);
  const usesTotal = uses.reduce((sum, s) => sum + s.amount, 0);
  const suGap = sourcesTotal - usesTotal;

  // Avg growth rates for version bar
  const avgIncGr = useMemo(() => {
    const rows = incomeRows.filter(
      (r) => !r.is_deduction && r.growth_rate > 0,
    );
    return rows.length > 0
      ? rows.reduce((s, r) => s + r.growth_rate, 0) / rows.length
      : 0;
  }, [incomeRows]);

  const avgExpGr = useMemo(() => {
    const rows = expenseRows.filter((r) => r.growth_rate > 0);
    return rows.length > 0
      ? rows.reduce((s, r) => s + r.growth_rate, 0) / rows.length
      : 0;
  }, [expenseRows]);

  const vacancyRow = incomeRows.find((r) =>
    r.line_item.toLowerCase().includes("vacancy"),
  );

  return (
    <div className="flex flex-col gap-6">
      {/* ── 1. Version Bar ── */}
      <div className="rounded-xl border bg-card px-4 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold">
            v{String(uw?.version ?? 1)}
          </span>
          <VersionBadge status={String(uw?.status ?? "draft")} />
        </div>
        <span className="text-xs text-muted-foreground">
          Rent growth {(avgIncGr * 100).toFixed(1)}%
          {" \u00b7 "}Expense growth {(avgExpGr * 100).toFixed(1)}% avg
          {vacancyRow
            ? ` \u00b7 Vacancy ${(vacancyRow.growth_rate * 100).toFixed(1)}%`
            : ""}
          {uwRecord.exit_cap_rate > 0
            ? ` \u00b7 Exit cap ${(uwRecord.exit_cap_rate * 100).toFixed(2)}%`
            : ""}
        </span>
      </div>

      {/* ── 2. Deal Analysis KPIs ── */}
      <Section title="Deal Analysis">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <KPICard label="Current NOI" value={fC(dealAnalysis.currentNOI)} />
          <KPICard
            label="Going-In Cap"
            value={fPct(dealAnalysis.goingInCap)}
          />
          <KPICard
            label="Year 1 DSCR"
            value={fX(dealAnalysis.year1DSCR)}
            negative={
              dealAnalysis.year1DSCR != null && dealAnalysis.year1DSCR < 1
            }
          />
          <KPICard
            label="Cash-on-Cash"
            value={fPct(dealAnalysis.cashOnCash)}
            negative={
              dealAnalysis.cashOnCash != null && dealAnalysis.cashOnCash < 0
            }
          />
          <KPICard label="Debt Yield" value={fPct(dealAnalysis.debtYield)} />
          <KPICard
            label="Price / Unit"
            value={fC(dealAnalysis.pricePerUnit)}
            subtitle={
              uwRecord.num_units > 0
                ? `${uwRecord.num_units} units`
                : undefined
            }
          />
          <KPICard
            label="Price / SF"
            value={fC(dealAnalysis.pricePerSF)}
            subtitle={
              uwRecord.total_sf > 0
                ? `${Number(uwRecord.total_sf).toLocaleString()} SF`
                : undefined
            }
          />
          <KPICard label="NOI / Unit" value={fC(dealAnalysis.noiPerUnit)} />
          <KPICard
            label="Yield-on-Cost"
            value={fPct(dealAnalysis.yieldOnCost)}
          />
          <KPICard
            label="Equity Multiple"
            value={
              returnSummary.equityMultiple != null
                ? fX(returnSummary.equityMultiple)
                : "\u2014"
            }
          />
        </div>
      </Section>

      {/* ── 3. 5-Year Pro Forma ── */}
      <Section title="5-Year Pro Forma" noPadding>
        <p className="text-xs text-muted-foreground px-5 pt-4 pb-2">
          Lender assumptions — Year 1 actuals projected at lender growth rates
        </p>
        <div className="overflow-x-auto px-1 pb-1">
          <ProFormaTable proForma={proForma} holdYears={holdYears} />
        </div>
      </Section>

      {/* ── 4. Return Summary ── */}
      <Section title={`Return Summary \u2014 ${holdYears} Year Hold`}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <KPICard
            label="Levered IRR"
            value={
              returnSummary.leveredIRR != null
                ? `${(returnSummary.leveredIRR * 100).toFixed(1)}%`
                : "\u2014"
            }
          />
          <KPICard
            label="Equity Multiple"
            value={
              returnSummary.equityMultiple != null
                ? fX(returnSummary.equityMultiple)
                : "\u2014"
            }
          />
          <KPICard
            label="Avg Cash-on-Cash"
            value={
              returnSummary.avgCashOnCash != null
                ? `${(returnSummary.avgCashOnCash * 100).toFixed(1)}%`
                : "\u2014"
            }
          />
          <KPICard
            label="Total Profit"
            value={fC(returnSummary.totalProfit)}
          />
          <KPICard
            label="Total Equity In"
            value={fC(returnSummary.totalEquityIn)}
          />
          <KPICard
            label="Total Distributions"
            value={fC(returnSummary.totalDistributions)}
          />
        </div>
      </Section>

      {/* ── 5. Sources & Uses ── */}
      <Section title="Sources & Uses">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Sources */}
          <div className="pr-0 md:pr-5 md:border-r border-border">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Sources
            </h4>
            {sources.length === 0 && (
              <p className="text-sm text-muted-foreground py-2">
                No sources entered
              </p>
            )}
            {sources.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-1.5 border-b border-border"
              >
                <span className="text-sm">{s.line_item}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm num">{fC(s.amount)}</span>
                  {sourcesTotal > 0 && (
                    <span className="text-xs text-muted-foreground num">
                      {((s.amount / sourcesTotal) * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
            {sources.length > 0 && (
              <div className="flex items-center justify-between py-2 font-semibold">
                <span className="text-sm">Total</span>
                <span className="text-sm num">{fC(sourcesTotal)}</span>
              </div>
            )}
          </div>

          {/* Uses */}
          <div className="pl-0 md:pl-5 mt-4 md:mt-0">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Uses
            </h4>
            {uses.length === 0 && (
              <p className="text-sm text-muted-foreground py-2">
                No uses entered
              </p>
            )}
            {uses.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-1.5 border-b border-border"
              >
                <span className="text-sm">{s.line_item}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm num">{fC(s.amount)}</span>
                  {usesTotal > 0 && (
                    <span className="text-xs text-muted-foreground num">
                      {((s.amount / usesTotal) * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
            {uses.length > 0 && (
              <div className="flex items-center justify-between py-2 font-semibold">
                <span className="text-sm">Total</span>
                <span className="text-sm num">{fC(usesTotal)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Gap warning */}
        {sources.length > 0 && uses.length > 0 && Math.abs(suGap) > 1 && (
          <div className="mt-4 flex items-center gap-2 rounded-md border-l-4 border-amber-500 bg-amber-500/10 px-4 py-3 text-sm text-amber-600 dark:text-amber-400">
            <AlertTriangle size={14} strokeWidth={1.5} />
            Gap: {fC(suGap)} \u2014{" "}
            {suGap < 0 ? "Uses exceed Sources" : "Sources exceed Uses"}
          </div>
        )}
      </Section>

      {/* ── 6. Distribution Waterfall ── */}
      <Section title="Distribution Waterfall">
        {wfTiers.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No waterfall tiers configured yet
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-2">
                      Tier
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-2">
                      Structure
                    </th>
                    <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-2">
                      Hurdle
                    </th>
                    <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-2">
                      Sponsor
                    </th>
                    <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-2">
                      Investor
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...wfTiers]
                    .sort((a, b) => a.tier_order - b.tier_order)
                    .map((tier, i) => (
                      <tr key={i} className="border-b border-border">
                        <td className="px-3 py-2 font-medium">
                          {tier.tier_name}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {tier.is_catch_up
                            ? "Catch-up"
                            : tier.hurdle_rate
                              ? "Pref Return"
                              : "Remaining Split"}
                        </td>
                        <td className="text-right px-3 py-2 num">
                          {tier.hurdle_rate != null
                            ? fPct(tier.hurdle_rate)
                            : "\u2014"}
                        </td>
                        <td className="text-right px-3 py-2 num">
                          {tier.sponsor_split != null
                            ? fPct(tier.sponsor_split)
                            : "\u2014"}
                        </td>
                        <td className="text-right px-3 py-2 num">
                          {tier.investor_split != null
                            ? fPct(tier.investor_split)
                            : "\u2014"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Modeled distributions */}
            <div className="mt-4 pt-4 border-t border-border">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Modeled Distributions ({holdYears}yr)
              </h4>
              <div className="grid grid-cols-2 gap-x-8 gap-y-1.5">
                <div className="flex justify-between py-1">
                  <span className="text-sm text-muted-foreground">
                    Investor Total
                  </span>
                  <span className="text-sm font-medium num">
                    {fC(waterfallResult.investorTotal)}
                    {totalEquity > 0 && (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({fX(waterfallResult.investorTotal / totalEquity)} on{" "}
                        {fC(totalEquity)})
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-sm text-muted-foreground">
                    Sponsor Total
                  </span>
                  <span className="text-sm font-medium num">
                    {fC(waterfallResult.sponsorTotal)}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </Section>

      {/* ── 7. Exit Analysis + Sensitivity ── */}
      <Section title="Exit Analysis">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-5">
          <KPICard
            label="Exit Cap Rate"
            value={
              uwRecord.exit_cap_rate > 0
                ? fPct(uwRecord.exit_cap_rate)
                : "\u2014"
            }
          />
          <KPICard label="Exit Price" value={fC(exitResult.exitPrice)} />
          <KPICard label="Sale Costs" value={fC(exitResult.saleCosts)} />
          <KPICard
            label="Net Proceeds"
            value={fC(exitResult.netProceeds)}
          />
          <KPICard label="Loan Payoff" value={fC(exitResult.loanPayoff)} />
          <KPICard
            label="Equity Returned"
            value={fC(exitResult.equityReturned)}
          />
          <KPICard
            label="Total Profit"
            value={fC(exitResult.totalProfit)}
            negative={exitResult.totalProfit < 0}
          />
        </div>

        {/* Sensitivity Table */}
        {sensitivity.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Exit Cap Sensitivity
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-2">
                      Exit Cap
                    </th>
                    {sensitivity.map((s, i) => (
                      <th
                        key={i}
                        className={cn(
                          "text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-2",
                          s.isBase && "bg-muted",
                        )}
                      >
                        {(s.exitCap * 100).toFixed(2)}%
                        {s.isBase && " *"}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="px-3 py-2 text-muted-foreground">
                      Exit Price
                    </td>
                    {sensitivity.map((s, i) => (
                      <td
                        key={i}
                        className={cn(
                          "text-right px-3 py-2 num",
                          s.isBase && "bg-muted font-semibold",
                        )}
                      >
                        {fCk(s.exitPrice)}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-3 py-2 text-muted-foreground">
                      Equity Mult
                    </td>
                    {sensitivity.map((s, i) => (
                      <td
                        key={i}
                        className={cn(
                          "text-right px-3 py-2 num",
                          s.isBase && "bg-muted font-semibold",
                        )}
                      >
                        {fX(s.equityMultiple)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-muted-foreground">
                      Levered IRR
                    </td>
                    {sensitivity.map((s, i) => (
                      <td
                        key={i}
                        className={cn(
                          "text-right px-3 py-2 num",
                          s.isBase && "bg-muted font-semibold",
                        )}
                      >
                        {s.leveredIRR !== 0
                          ? `${(s.leveredIRR * 100).toFixed(1)}%`
                          : "\u2014"}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}

// ── Section Card ──

function Section({
  title,
  children,
  noPadding,
}: {
  title: string;
  children: React.ReactNode;
  noPadding?: boolean;
}) {
  return (
    <div className="rounded-xl border bg-card">
      <div className={noPadding ? "px-5 pt-5" : "p-5"}>
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          {title}
        </h3>
      </div>
      <div className={noPadding ? "" : "px-5 pb-5"}>{children}</div>
    </div>
  );
}

// ── KPI Card ──

function KPICard({
  label,
  value,
  subtitle,
  negative,
}: {
  label: string;
  value: string;
  subtitle?: string;
  negative?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border bg-muted/30 px-3.5 py-3">
      <span className="text-[11px] uppercase tracking-[0.05em] font-medium text-muted-foreground">
        {label}
      </span>
      <span
        className={cn(
          "num text-lg font-semibold tracking-tight",
          negative && "text-destructive",
        )}
      >
        {value}
      </span>
      {subtitle && (
        <span className="text-[11px] text-muted-foreground mt-0.5">
          {subtitle}
        </span>
      )}
    </div>
  );
}

// ── Version Badge ──

function VersionBadge({ status }: { status: string }) {
  if (status === "active") {
    return (
      <span className="rounded px-1.5 py-px text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
        Active
      </span>
    );
  }
  if (status === "draft") {
    return (
      <span className="rounded px-1.5 py-px text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400">
        Draft
      </span>
    );
  }
  return null;
}

// ── Pro Forma Table ──

function ProFormaTable({
  proForma,
  holdYears,
}: {
  proForma: ProFormaYearResult[];
  holdYears: number;
}) {
  const t12 = proForma.find((p) => p.year === 0);
  const years = proForma.filter((p) => p.year >= 1 && p.year <= holdYears);

  const firstYear = t12 || years[0];
  if (!firstYear) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No pro forma data available
      </p>
    );
  }

  const incomeLabels = firstYear.incomeRows.map((r) => r.label);
  const expenseLabels = firstYear.expenseRows.map((r) => r.label);
  const colHeaders = [
    ...(t12 ? ["T12"] : []),
    ...years.map((y) => `Year ${y.year}`),
  ];
  const allPFs = [...(t12 ? [t12] : []), ...years];

  function getVal(
    pf: ProFormaYearResult,
    type: "income" | "expense",
    key: string,
  ): number | null {
    if (type === "income") {
      return pf.incomeRows.find((r) => r.label === key)?.amount ?? null;
    }
    return pf.expenseRows.find((r) => r.label === key)?.amount ?? null;
  }

  return (
    <table className="w-full text-sm min-w-[600px]">
      <thead>
        <tr className="bg-muted/50">
          <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-2 sticky left-0 z-10 bg-muted/50">
            &nbsp;
          </th>
          {colHeaders.map((h, i) => (
            <th
              key={i}
              className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-2"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {/* Income section label */}
        <tr>
          <td
            colSpan={colHeaders.length + 1}
            className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-1.5 bg-card"
          >
            Income
          </td>
        </tr>

        {incomeLabels.map((label) => {
          const isDeduction = firstYear.incomeRows.find(
            (r) => r.label === label,
          )?.isDeduction;
          return (
            <tr key={label} className="border-b border-border/30">
              <td className="px-3 py-1.5 sticky left-0 z-10 bg-card">
                {isDeduction ? `(${label})` : label}
              </td>
              {allPFs.map((pf, i) => {
                const val = getVal(pf, "income", label);
                return (
                  <td
                    key={i}
                    className={cn(
                      "text-right px-3 py-1.5 num",
                      isDeduction && "text-destructive",
                    )}
                  >
                    {val != null
                      ? val < 0
                        ? `(${fC(Math.abs(val))})`
                        : fC(val)
                      : "\u2014"}
                  </td>
                );
              })}
            </tr>
          );
        })}

        {/* Net Revenue */}
        <tr className="border-y border-border">
          <td className="px-3 py-1.5 font-semibold sticky left-0 z-10 bg-card">
            Net Revenue
          </td>
          {allPFs.map((pf, i) => (
            <td
              key={i}
              className="text-right px-3 py-1.5 font-semibold num"
            >
              {fC(pf.netRevenue)}
            </td>
          ))}
        </tr>

        {/* Expenses section label */}
        <tr>
          <td
            colSpan={colHeaders.length + 1}
            className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-1.5 bg-card"
          >
            Expenses
          </td>
        </tr>

        {expenseLabels.map((label) => (
          <tr key={label} className="border-b border-border/30">
            <td className="px-3 py-1.5 sticky left-0 z-10 bg-card">
              {label}
            </td>
            {allPFs.map((pf, i) => {
              const val = getVal(pf, "expense", label);
              return (
                <td key={i} className="text-right px-3 py-1.5 num">
                  {val != null ? fC(val) : "\u2014"}
                </td>
              );
            })}
          </tr>
        ))}

        {/* Total Expenses */}
        <tr className="border-t border-border">
          <td className="px-3 py-1.5 font-semibold sticky left-0 z-10 bg-card">
            Total Expenses
          </td>
          {allPFs.map((pf, i) => (
            <td
              key={i}
              className="text-right px-3 py-1.5 font-semibold num"
            >
              {fC(pf.totalExpenses)}
            </td>
          ))}
        </tr>

        {/* NOI — highlighted */}
        <tr className="border-t-2 border-border bg-muted">
          <td className="px-3 py-2 font-bold sticky left-0 z-10 bg-muted">
            Net Operating Income
          </td>
          {allPFs.map((pf, i) => (
            <td key={i} className="text-right px-3 py-2 font-bold num">
              {fC(pf.noi)}
            </td>
          ))}
        </tr>

        {/* Debt Service section label */}
        <tr>
          <td
            colSpan={colHeaders.length + 1}
            className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-1.5 bg-card"
          >
            Debt Service
          </td>
        </tr>

        <tr className="border-b border-border">
          <td className="px-3 py-1.5 sticky left-0 z-10 bg-card">
            Annual Debt Service
          </td>
          {allPFs.map((pf, i) => (
            <td key={i} className="text-right px-3 py-1.5 num">
              {pf.year === 0 ? "\u2014" : fC(pf.debtService)}
            </td>
          ))}
        </tr>

        {/* Cash Flow Before Tax */}
        <tr className="border-t border-border">
          <td className="px-3 py-1.5 font-semibold sticky left-0 z-10 bg-card">
            Cash Flow Before Tax
          </td>
          {allPFs.map((pf, i) => (
            <td
              key={i}
              className={cn(
                "text-right px-3 py-1.5 font-semibold num",
                pf.year > 0 &&
                  pf.cashFlowBeforeTax < 0 &&
                  "text-destructive",
              )}
            >
              {pf.year === 0 ? "\u2014" : fC(pf.cashFlowBeforeTax)}
            </td>
          ))}
        </tr>

        {/* DSCR */}
        <tr className="border-t border-border">
          <td className="px-3 py-2 font-bold sticky left-0 z-10 bg-card">
            DSCR
          </td>
          {allPFs.map((pf, i) => (
            <td
              key={i}
              className={cn(
                "text-right px-3 py-2 font-bold num",
                pf.year > 0 && pf.dscr < 1 && "text-destructive",
              )}
            >
              {pf.year === 0 ? "\u2014" : `${pf.dscr.toFixed(2)}x`}
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  );
}
