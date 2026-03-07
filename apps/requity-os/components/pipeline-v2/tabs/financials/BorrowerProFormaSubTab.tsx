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
import {
  upsertIncomeRows,
  upsertExpenseRows,
} from "@/app/(authenticated)/admin/pipeline-v2/[id]/commercial-uw-actions";
import {
  computeT12NetRevenue,
  computeT12TotalExpenses,
  computeProForma,
} from "@/lib/commercial-uw/deal-computations";
import type {
  DealIncomeRow,
  DealExpenseRow,
  DealUWRecord,
  ProFormaYearResult,
} from "@/lib/commercial-uw/deal-computations";
import { TableShell, TH, SubLabel, n, fmtCurrency, fmtPct } from "./shared";

interface BorrowerProFormaSubTabProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  income: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expenses: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uw: any;
  uwId: string | null;
}

export function BorrowerProFormaSubTab({
  income,
  expenses,
  uw,
  uwId,
}: BorrowerProFormaSubTabProps) {
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

  const proForma: ProFormaYearResult[] = useMemo(
    () => computeProForma(incomeRows, expenseRows, uwRecord),
    [incomeRows, expenseRows, uwRecord]
  );

  const hasData = incomeRows.length > 0;
  const holdYears = uwRecord.hold_period_years || 5;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <SubLabel>Borrower Pro Forma</SubLabel>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={() => setEditOpen(true)}
        >
          <Pencil className="h-3 w-3" />
          Edit Assumptions
        </Button>
      </div>

      {!hasData ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Add T12 income and expense data first, then the pro forma will be
            computed automatically.
          </p>
        </div>
      ) : (
        <>
          {/* Pro Forma Table */}
          <div className="overflow-x-auto">
            <TableShell>
              <thead>
                <tr>
                  <TH>Line Item</TH>
                  {proForma.map((pf) => (
                    <TH key={pf.year} align="right">
                      {pf.year === 0 ? "T12" : `Year ${pf.year}`}
                    </TH>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Income rows */}
                {proForma[0]?.incomeRows.map((incRow, idx) => (
                  <tr key={`inc-${idx}`} className="border-b">
                    <td
                      className={cn(
                        "text-[13px] px-3 py-2",
                        incRow.isDeduction && "text-muted-foreground"
                      )}
                    >
                      {incRow.label}
                    </td>
                    {proForma.map((pf) => {
                      const row = pf.incomeRows[idx];
                      return (
                        <td
                          key={pf.year}
                          className={cn(
                            "text-right text-[13px] num px-3 py-2",
                            row?.isDeduction && "text-red-500"
                          )}
                        >
                          {row?.isDeduction
                            ? `(${fmtCurrency(Math.abs(row.amount))})`
                            : fmtCurrency(row?.amount ?? 0)}
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* Net Revenue */}
                <tr className="bg-muted/30 border-t font-semibold">
                  <td className="text-[13px] px-3 py-2 font-semibold">
                    Net Revenue
                  </td>
                  {proForma.map((pf) => (
                    <td
                      key={pf.year}
                      className="text-right text-[13px] font-semibold num px-3 py-2"
                    >
                      {fmtCurrency(pf.netRevenue)}
                    </td>
                  ))}
                </tr>

                {/* Expense rows */}
                {proForma[0]?.expenseRows.map((expRow, idx) => (
                  <tr key={`exp-${idx}`} className="border-b">
                    <td className="text-[13px] px-3 py-2 text-muted-foreground">
                      {expRow.label}
                    </td>
                    {proForma.map((pf) => (
                      <td
                        key={pf.year}
                        className="text-right text-[13px] num px-3 py-2"
                      >
                        {fmtCurrency(pf.expenseRows[idx]?.amount ?? 0)}
                      </td>
                    ))}
                  </tr>
                ))}

                {/* Total Expenses */}
                <tr className="bg-muted/30 border-t">
                  <td className="text-[13px] px-3 py-2 font-semibold">
                    Total Expenses
                  </td>
                  {proForma.map((pf) => (
                    <td
                      key={pf.year}
                      className="text-right text-[13px] font-semibold num px-3 py-2"
                    >
                      {fmtCurrency(pf.totalExpenses)}
                    </td>
                  ))}
                </tr>

                {/* NOI */}
                <tr className="bg-muted/50 border-t-2">
                  <td className="text-[13px] px-3 py-2 font-bold">NOI</td>
                  {proForma.map((pf) => (
                    <td
                      key={pf.year}
                      className="text-right text-[13px] font-bold num px-3 py-2"
                    >
                      {fmtCurrency(pf.noi)}
                    </td>
                  ))}
                </tr>

                {/* Debt Service */}
                <tr className="border-b">
                  <td className="text-[13px] px-3 py-2 text-muted-foreground">
                    Debt Service
                  </td>
                  {proForma.map((pf) => (
                    <td
                      key={pf.year}
                      className="text-right text-[13px] num px-3 py-2"
                    >
                      {pf.debtService > 0
                        ? `(${fmtCurrency(pf.debtService)})`
                        : "—"}
                    </td>
                  ))}
                </tr>

                {/* Cash Flow */}
                <tr className="bg-muted/50 border-t">
                  <td className="text-[13px] px-3 py-2 font-semibold">
                    Cash Flow Before Tax
                  </td>
                  {proForma.map((pf) => (
                    <td
                      key={pf.year}
                      className={cn(
                        "text-right text-[13px] font-semibold num px-3 py-2",
                        pf.cashFlowBeforeTax < 0 && "text-red-500"
                      )}
                    >
                      {fmtCurrency(pf.cashFlowBeforeTax)}
                    </td>
                  ))}
                </tr>

                {/* DSCR */}
                <tr className="border-t">
                  <td className="text-[13px] px-3 py-2 text-muted-foreground">
                    DSCR
                  </td>
                  {proForma.map((pf) => (
                    <td
                      key={pf.year}
                      className={cn(
                        "text-right text-[13px] num px-3 py-2 font-medium",
                        pf.dscr > 0 && pf.dscr < 1.2 && "text-amber-500",
                        pf.dscr >= 1.2 && "text-green-600",
                        pf.dscr > 0 && pf.dscr < 1.0 && "text-red-500"
                      )}
                    >
                      {pf.dscr > 0 ? pf.dscr.toFixed(2) + "x" : "—"}
                    </td>
                  ))}
                </tr>
              </tbody>
            </TableShell>
          </div>

          {/* Assumptions summary */}
          <div className="rounded-xl border bg-card p-4">
            <SubLabel>Growth Assumptions</SubLabel>
            <div className="overflow-x-auto">
              <TableShell>
                <thead>
                  <tr>
                    <TH>Line Item</TH>
                    <TH align="right">Year 1 Amount</TH>
                    <TH align="right">Annual Growth</TH>
                  </tr>
                </thead>
                <tbody>
                  {incomeRows.map((row, i) => (
                    <tr key={`inc-${i}`} className="border-b">
                      <td className="text-[13px] px-3 py-2">
                        {row.line_item}
                      </td>
                      <td
                        className={cn(
                          "text-right text-[13px] num px-3 py-2",
                          row.is_deduction && "text-red-500"
                        )}
                      >
                        {row.is_deduction
                          ? `(${fmtCurrency(Math.abs(row.year_1_amount))})`
                          : fmtCurrency(row.year_1_amount)}
                      </td>
                      <td className="text-right text-[13px] num px-3 py-2 text-muted-foreground">
                        {row.growth_rate > 0 ? fmtPct(row.growth_rate) : "—"}
                      </td>
                    </tr>
                  ))}
                  {expenseRows.map((row, i) => (
                    <tr key={`exp-${i}`} className="border-b">
                      <td className="text-[13px] px-3 py-2 text-muted-foreground">
                        {row.category}
                      </td>
                      <td className="text-right text-[13px] num px-3 py-2">
                        {row.is_percentage
                          ? fmtPct(row.year_1_amount)
                          : fmtCurrency(row.year_1_amount)}
                      </td>
                      <td className="text-right text-[13px] num px-3 py-2 text-muted-foreground">
                        {row.growth_rate > 0 ? fmtPct(row.growth_rate) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </TableShell>
            </div>
          </div>
        </>
      )}

      {/* Edit Assumptions Dialog */}
      <EditAssumptionsDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        incomeRows={incomeRows}
        expenseRows={expenseRows}
        uwId={uwId}
      />
    </div>
  );
}

function EditAssumptionsDialog({
  open,
  onOpenChange,
  incomeRows,
  expenseRows,
  uwId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incomeRows: DealIncomeRow[];
  expenseRows: DealExpenseRow[];
  uwId: string | null;
}) {
  const [incRows, setIncRows] = useState<DealIncomeRow[]>([]);
  const [expRows, setExpRows] = useState<DealExpenseRow[]>([]);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setIncRows([...incomeRows]);
      setExpRows([...expenseRows]);
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = async () => {
    if (!uwId) return;
    setSaving(true);
    try {
      const [incRes, expRes] = await Promise.all([
        upsertIncomeRows(
          uwId,
          incRows.map((r, i) => ({
            line_item: r.line_item,
            t12_amount: r.t12_amount,
            year_1_amount: r.year_1_amount,
            growth_rate: r.growth_rate,
            is_deduction: r.is_deduction,
            sort_order: i,
          }))
        ),
        upsertExpenseRows(
          uwId,
          expRows.map((r, i) => ({
            category: r.category,
            t12_amount: r.t12_amount,
            year_1_amount: r.year_1_amount,
            growth_rate: r.growth_rate,
            is_percentage: r.is_percentage,
            sort_order: i,
          }))
        ),
      ]);
      if (incRes.error || expRes.error) {
        toast.error(
          `Failed to save: ${incRes.error || expRes.error}`
        );
      } else {
        toast.success("Pro forma assumptions saved");
        router.refresh();
        onOpenChange(false);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Borrower Pro Forma Assumptions</DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground">
          Set Year 1 amounts and annual growth rates. The pro forma will project
          these forward.
        </p>

        {/* Income */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Income
          </p>
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b">
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">
                  Line Item
                </th>
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">
                  Year 1
                </th>
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">
                  Growth %
                </th>
              </tr>
            </thead>
            <tbody>
              {incRows.map((row, i) => (
                <tr key={i} className="border-b">
                  <td className="px-2 py-1 text-[13px]">{row.line_item}</td>
                  <td className="px-2 py-1">
                    <Input
                      className="h-8 w-28"
                      type="number"
                      value={row.year_1_amount || ""}
                      onChange={(e) =>
                        setIncRows((prev) =>
                          prev.map((r, j) =>
                            j === i
                              ? {
                                  ...r,
                                  year_1_amount:
                                    Number(e.target.value) || 0,
                                }
                              : r
                          )
                        )
                      }
                    />
                  </td>
                  <td className="px-2 py-1">
                    <Input
                      className="h-8 w-20"
                      type="number"
                      step="0.001"
                      value={row.growth_rate || ""}
                      placeholder="0.03"
                      onChange={(e) =>
                        setIncRows((prev) =>
                          prev.map((r, j) =>
                            j === i
                              ? {
                                  ...r,
                                  growth_rate:
                                    Number(e.target.value) || 0,
                                }
                              : r
                          )
                        )
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Expenses */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Expenses
          </p>
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b">
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">
                  Category
                </th>
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">
                  Year 1
                </th>
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">
                  Growth %
                </th>
              </tr>
            </thead>
            <tbody>
              {expRows.map((row, i) => (
                <tr key={i} className="border-b">
                  <td className="px-2 py-1 text-[13px]">{row.category}</td>
                  <td className="px-2 py-1">
                    <Input
                      className="h-8 w-28"
                      type="number"
                      value={row.year_1_amount || ""}
                      onChange={(e) =>
                        setExpRows((prev) =>
                          prev.map((r, j) =>
                            j === i
                              ? {
                                  ...r,
                                  year_1_amount:
                                    Number(e.target.value) || 0,
                                }
                              : r
                          )
                        )
                      }
                    />
                  </td>
                  <td className="px-2 py-1">
                    <Input
                      className="h-8 w-20"
                      type="number"
                      step="0.001"
                      value={row.growth_rate || ""}
                      placeholder="0.03"
                      onChange={(e) =>
                        setExpRows((prev) =>
                          prev.map((r, j) =>
                            j === i
                              ? {
                                  ...r,
                                  growth_rate:
                                    Number(e.target.value) || 0,
                                }
                              : r
                          )
                        )
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
            Save Assumptions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
