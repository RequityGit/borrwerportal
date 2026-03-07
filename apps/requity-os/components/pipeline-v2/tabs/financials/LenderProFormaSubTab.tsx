"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { updateCommercialUW } from "@/app/(authenticated)/admin/pipeline-v2/[id]/commercial-uw-actions";
import {
  computeT12NetRevenue,
  computeT12TotalExpenses,
  computeAnnualDebtService,
} from "@/lib/commercial-uw/deal-computations";
import type {
  DealIncomeRow,
  DealExpenseRow,
  DealUWRecord,
} from "@/lib/commercial-uw/deal-computations";
import { TableShell, TH, SubLabel, n, fmtCurrency, fmtPct } from "./shared";

interface LenderProFormaSubTabProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  income: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expenses: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uw: any;
  uwId: string | null;
}

export function LenderProFormaSubTab({
  income,
  expenses,
  uw,
  uwId,
}: LenderProFormaSubTabProps) {
  const [editOpen, setEditOpen] = useState(false);
  const router = useRouter();

  const incomeRows: DealIncomeRow[] = useMemo(
    () =>
      income.map((r: DealIncomeRow) => ({
        ...r,
        t12_amount: n(r.t12_amount),
        year_1_amount: n(r.year_1_amount),
        growth_rate: n(r.growth_rate),
      })),
    [income]
  );

  const expenseRows: DealExpenseRow[] = useMemo(
    () =>
      expenses.map((r: DealExpenseRow) => ({
        ...r,
        t12_amount: n(r.t12_amount),
        year_1_amount: n(r.year_1_amount),
        growth_rate: n(r.growth_rate),
      })),
    [expenses]
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
    [uw]
  );

  // Lender applies haircuts: higher vacancy, lower rent growth, conservative expenses
  const lenderVacancyHaircut = n(uw?.lender_vacancy_haircut) || 0.05;
  const lenderExpenseGrowth = n(uw?.lender_expense_growth) || 0.03;
  const lenderRentGrowth = n(uw?.lender_rent_growth) || 0.02;
  const lenderCapRate = n(uw?.lender_cap_rate) || uwRecord.exit_cap_rate;

  const netRevenue = useMemo(
    () => computeT12NetRevenue(incomeRows),
    [incomeRows]
  );
  const totalExpenses = useMemo(
    () => computeT12TotalExpenses(expenseRows),
    [expenseRows]
  );
  const t12NOI = netRevenue - totalExpenses;

  const annualDS = useMemo(
    () => computeAnnualDebtService(uwRecord),
    [uwRecord]
  );

  // Lender's conservative underwrite: apply haircuts to T12
  const lenderGPI = useMemo(() => {
    const gpiRow = incomeRows.find(
      (r) => !r.is_deduction && r.t12_amount > 0
    );
    return gpiRow?.t12_amount ?? 0;
  }, [incomeRows]);

  const lenderNetRevenue = lenderGPI * (1 - lenderVacancyHaircut);
  const lenderTotalExpenses = totalExpenses * (1 + lenderExpenseGrowth);
  const lenderNOI = lenderNetRevenue - lenderTotalExpenses;
  const lenderDSCR = annualDS > 0 ? lenderNOI / annualDS : 0;
  const lenderLTV =
    uwRecord.purchase_price > 0
      ? uwRecord.loan_amount / uwRecord.purchase_price
      : 0;
  const lenderDebtYield =
    uwRecord.loan_amount > 0 ? lenderNOI / uwRecord.loan_amount : 0;

  // Lender valuation
  const lenderValue = lenderCapRate > 0 ? lenderNOI / lenderCapRate : 0;
  const lenderImpliedLTV =
    lenderValue > 0 ? uwRecord.loan_amount / lenderValue : 0;

  const hasData = incomeRows.length > 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <SubLabel>Lender Pro Forma</SubLabel>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={() => setEditOpen(true)}
        >
          <Pencil className="h-3 w-3" />
          Edit Lender Assumptions
        </Button>
      </div>

      {!hasData ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Add T12 data first. The lender pro forma applies conservative
            haircuts to the borrower&apos;s numbers.
          </p>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-4 gap-3">
            <MetricCard
              label="Lender DSCR"
              value={lenderDSCR > 0 ? `${lenderDSCR.toFixed(2)}x` : "—"}
              color={
                lenderDSCR >= 1.25
                  ? "green"
                  : lenderDSCR >= 1.0
                    ? "amber"
                    : "red"
              }
            />
            <MetricCard
              label="LTV"
              value={lenderLTV > 0 ? `${(lenderLTV * 100).toFixed(1)}%` : "—"}
              color={
                lenderLTV <= 0.7
                  ? "green"
                  : lenderLTV <= 0.8
                    ? "amber"
                    : "red"
              }
            />
            <MetricCard
              label="Debt Yield"
              value={
                lenderDebtYield > 0
                  ? `${(lenderDebtYield * 100).toFixed(1)}%`
                  : "—"
              }
              color={
                lenderDebtYield >= 0.1
                  ? "green"
                  : lenderDebtYield >= 0.08
                    ? "amber"
                    : "red"
              }
            />
            <MetricCard
              label="Implied LTV (Value)"
              value={
                lenderImpliedLTV > 0
                  ? `${(lenderImpliedLTV * 100).toFixed(1)}%`
                  : "—"
              }
              color={
                lenderImpliedLTV <= 0.75
                  ? "green"
                  : lenderImpliedLTV <= 0.85
                    ? "amber"
                    : "red"
              }
            />
          </div>

          {/* Side by side comparison */}
          <TableShell>
            <thead>
              <tr>
                <TH>Metric</TH>
                <TH align="right">Borrower</TH>
                <TH align="right">Lender UW</TH>
                <TH align="right">Variance</TH>
              </tr>
            </thead>
            <tbody>
              <CompRow
                label="Gross Potential Income"
                borrower={lenderGPI}
                lender={lenderGPI}
              />
              <CompRow
                label="Vacancy / Credit Loss"
                borrower={netRevenue - lenderGPI}
                lender={lenderNetRevenue - lenderGPI}
                isDeduction
              />
              <CompRow
                label="Effective Gross Income"
                borrower={netRevenue}
                lender={lenderNetRevenue}
                bold
              />
              <CompRow
                label="Total Expenses"
                borrower={totalExpenses}
                lender={lenderTotalExpenses}
              />
              <CompRow
                label="Net Operating Income"
                borrower={t12NOI}
                lender={lenderNOI}
                bold
              />
              <CompRow
                label="Debt Service"
                borrower={annualDS}
                lender={annualDS}
              />
              <CompRow
                label="Cash Flow"
                borrower={t12NOI - annualDS}
                lender={lenderNOI - annualDS}
                bold
              />
            </tbody>
          </TableShell>

          {/* Lender Assumptions */}
          <div className="rounded-xl border bg-card p-4">
            <SubLabel>Lender Assumptions Applied</SubLabel>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Vacancy Haircut</p>
                <p className="text-sm num mt-0.5">
                  {(lenderVacancyHaircut * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Expense Growth Adjustment
                </p>
                <p className="text-sm num mt-0.5">
                  {(lenderExpenseGrowth * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Rent Growth</p>
                <p className="text-sm num mt-0.5">
                  {(lenderRentGrowth * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cap Rate</p>
                <p className="text-sm num mt-0.5">
                  {(lenderCapRate * 100).toFixed(2)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Loan Amount</p>
                <p className="text-sm num mt-0.5">
                  {fmtCurrency(uwRecord.loan_amount)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Lender Valuation
                </p>
                <p className="text-sm num mt-0.5">{fmtCurrency(lenderValue)}</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Edit Dialog */}
      <EditLenderAssumptionsDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        uw={uw}
        uwId={uwId}
      />
    </div>
  );
}

function MetricCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: "green" | "amber" | "red";
}) {
  return (
    <div className="rounded-lg border bg-card px-3 py-2.5">
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
        {label}
      </p>
      <p
        className={cn(
          "text-sm font-semibold num mt-0.5",
          color === "green" && "text-green-600",
          color === "amber" && "text-amber-500",
          color === "red" && "text-red-500"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function CompRow({
  label,
  borrower,
  lender,
  bold,
  isDeduction,
}: {
  label: string;
  borrower: number;
  lender: number;
  bold?: boolean;
  isDeduction?: boolean;
}) {
  const variance = lender - borrower;
  const variancePct =
    borrower !== 0 ? ((lender - borrower) / Math.abs(borrower)) * 100 : 0;

  return (
    <tr className={cn("border-b", bold && "bg-muted/30")}>
      <td
        className={cn(
          "text-[13px] px-3 py-2",
          bold && "font-semibold",
          !bold && "text-muted-foreground"
        )}
      >
        {label}
      </td>
      <td
        className={cn(
          "text-right text-[13px] num px-3 py-2",
          bold && "font-semibold",
          isDeduction && "text-red-500"
        )}
      >
        {isDeduction
          ? `(${fmtCurrency(Math.abs(borrower))})`
          : fmtCurrency(borrower)}
      </td>
      <td
        className={cn(
          "text-right text-[13px] num px-3 py-2",
          bold && "font-semibold",
          isDeduction && "text-red-500"
        )}
      >
        {isDeduction
          ? `(${fmtCurrency(Math.abs(lender))})`
          : fmtCurrency(lender)}
      </td>
      <td
        className={cn(
          "text-right text-[13px] num px-3 py-2",
          variance > 0 && "text-green-600",
          variance < 0 && "text-red-500"
        )}
      >
        {variance !== 0
          ? `${variance > 0 ? "+" : ""}${fmtCurrency(variance)} (${variancePct > 0 ? "+" : ""}${variancePct.toFixed(1)}%)`
          : "—"}
      </td>
    </tr>
  );
}

function EditLenderAssumptionsDialog({
  open,
  onOpenChange,
  uw,
  uwId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uw: any;
  uwId: string | null;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    lender_vacancy_haircut: "",
    lender_expense_growth: "",
    lender_rent_growth: "",
    lender_cap_rate: "",
  });
  const router = useRouter();

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setForm({
        lender_vacancy_haircut: uw?.lender_vacancy_haircut
          ? String(uw.lender_vacancy_haircut)
          : "0.05",
        lender_expense_growth: uw?.lender_expense_growth
          ? String(uw.lender_expense_growth)
          : "0.03",
        lender_rent_growth: uw?.lender_rent_growth
          ? String(uw.lender_rent_growth)
          : "0.02",
        lender_cap_rate: uw?.lender_cap_rate
          ? String(uw.lender_cap_rate)
          : uw?.exit_cap_rate
            ? String(uw.exit_cap_rate)
            : "0.06",
      });
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = async () => {
    if (!uwId) return;
    setSaving(true);
    try {
      const result = await updateCommercialUW(uwId, {
        lender_vacancy_haircut: Number(form.lender_vacancy_haircut) || 0.05,
        lender_expense_growth: Number(form.lender_expense_growth) || 0.03,
        lender_rent_growth: Number(form.lender_rent_growth) || 0.02,
        lender_cap_rate: Number(form.lender_cap_rate) || 0.06,
      });
      if (result.error) {
        toast.error(`Failed to save: ${result.error}`);
      } else {
        toast.success("Lender assumptions saved");
        router.refresh();
        onOpenChange(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    {
      key: "lender_vacancy_haircut",
      label: "Vacancy Haircut",
      hint: "e.g. 0.05 = 5%",
    },
    {
      key: "lender_expense_growth",
      label: "Expense Growth Adj.",
      hint: "e.g. 0.03 = 3%",
    },
    {
      key: "lender_rent_growth",
      label: "Rent Growth",
      hint: "e.g. 0.02 = 2%",
    },
    {
      key: "lender_cap_rate",
      label: "Cap Rate",
      hint: "e.g. 0.06 = 6%",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Lender Underwriting Assumptions</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          These haircuts are applied to the borrower&apos;s T12 to produce the
          lender&apos;s conservative underwrite. All values as decimals.
        </p>
        <div className="grid gap-3 py-2">
          {fields.map((f) => (
            <div key={f.key} className="grid grid-cols-4 items-center gap-3">
              <label className="text-right text-sm text-muted-foreground col-span-1">
                {f.label}
              </label>
              <div className="col-span-3">
                <Input
                  type="number"
                  step="0.001"
                  value={form[f.key as keyof typeof form]}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      [f.key]: e.target.value,
                    }))
                  }
                  placeholder={f.hint}
                />
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {f.hint}
                </p>
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
