"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Upload, Pencil, Plus, Loader2 } from "lucide-react";
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
import { UploadT12Dialog } from "@/components/admin/commercial-uw/upload-t12-dialog";
import type { T12Data } from "@/lib/commercial-uw/types";
import {
  computeT12NetRevenue,
  computeT12TotalExpenses,
} from "@/lib/commercial-uw/deal-computations";
import type {
  DealIncomeRow,
  DealExpenseRow,
} from "@/lib/commercial-uw/deal-computations";
import { TableShell, TH, SubLabel, n, fmtCurrency } from "./shared";

interface T12SubTabProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  income: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expenses: any[];
  uwId: string | null;
}

export function T12SubTab({ income, expenses, uwId }: T12SubTabProps) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editIncomeOpen, setEditIncomeOpen] = useState(false);
  const [editExpenseOpen, setEditExpenseOpen] = useState(false);
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

  const netRevenue = useMemo(
    () => computeT12NetRevenue(incomeRows),
    [incomeRows]
  );
  const totalExpenses = useMemo(
    () => computeT12TotalExpenses(expenseRows),
    [expenseRows]
  );
  const noi = netRevenue - totalExpenses;

  const handleT12Import = useCallback(
    async (data: T12Data) => {
      if (!uwId) return;

      const newIncome = [
        {
          line_item: "Gross Potential Income",
          t12_amount: data.gpi,
          year_1_amount: data.gpi,
          growth_rate: 0,
          is_deduction: false,
          sort_order: 0,
        },
        {
          line_item: "Vacancy Loss",
          t12_amount: data.gpi * (data.vacancy_pct / 100),
          year_1_amount: data.gpi * (data.vacancy_pct / 100),
          growth_rate: 0,
          is_deduction: true,
          sort_order: 1,
        },
        {
          line_item: "Bad Debt",
          t12_amount: data.gpi * (data.bad_debt_pct / 100),
          year_1_amount: data.gpi * (data.bad_debt_pct / 100),
          growth_rate: 0,
          is_deduction: true,
          sort_order: 2,
        },
      ];

      const newExpenses = [
        { category: "Management Fee", t12_amount: data.mgmt_fee, year_1_amount: data.mgmt_fee, growth_rate: 0, is_percentage: false, sort_order: 0 },
        { category: "Real Estate Taxes", t12_amount: data.taxes, year_1_amount: data.taxes, growth_rate: 0, is_percentage: false, sort_order: 1 },
        { category: "Insurance", t12_amount: data.insurance, year_1_amount: data.insurance, growth_rate: 0, is_percentage: false, sort_order: 2 },
        { category: "Utilities", t12_amount: data.utilities, year_1_amount: data.utilities, growth_rate: 0, is_percentage: false, sort_order: 3 },
        { category: "Repairs & Maintenance", t12_amount: data.repairs, year_1_amount: data.repairs, growth_rate: 0, is_percentage: false, sort_order: 4 },
        { category: "Contract Services", t12_amount: data.contract_services, year_1_amount: data.contract_services, growth_rate: 0, is_percentage: false, sort_order: 5 },
        { category: "Payroll", t12_amount: data.payroll, year_1_amount: data.payroll, growth_rate: 0, is_percentage: false, sort_order: 6 },
        { category: "Marketing", t12_amount: data.marketing, year_1_amount: data.marketing, growth_rate: 0, is_percentage: false, sort_order: 7 },
        { category: "General & Administrative", t12_amount: data.ga, year_1_amount: data.ga, growth_rate: 0, is_percentage: false, sort_order: 8 },
        { category: "Replacement Reserve", t12_amount: data.replacement_reserve, year_1_amount: data.replacement_reserve, growth_rate: 0, is_percentage: false, sort_order: 9 },
      ];

      const [incRes, expRes] = await Promise.all([
        upsertIncomeRows(uwId, newIncome),
        upsertExpenseRows(uwId, newExpenses),
      ]);

      if (incRes.error || expRes.error) {
        toast.error(
          `Failed to import T12: ${incRes.error || expRes.error}`
        );
      } else {
        toast.success("T12 data imported successfully");
        router.refresh();
      }
    },
    [uwId, router]
  );

  const hasData = incomeRows.length > 0 || expenseRows.length > 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <SubLabel>Trailing 12-Month Operating Statement</SubLabel>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => setUploadOpen(true)}
          >
            <Upload className="h-3 w-3" />
            Upload T12
          </Button>
        </div>
      </div>

      {/* NOI Summary */}
      {hasData && (
        <div className="grid grid-cols-3 gap-3">
          <KPI label="Net Revenue" value={fmtCurrency(netRevenue)} />
          <KPI label="Total Expenses" value={fmtCurrency(totalExpenses)} />
          <KPI
            label="NOI"
            value={fmtCurrency(noi)}
            accent={noi > 0 ? "green" : noi < 0 ? "red" : undefined}
          />
        </div>
      )}

      {!hasData ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            No T12 data yet. Upload an operating statement or enter data
            manually.
          </p>
          <div className="flex items-center gap-2 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUploadOpen(true)}
            >
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              Upload T12
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditIncomeOpen(true)}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Enter Manually
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Income Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Income
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 gap-1 text-[11px] text-muted-foreground"
                onClick={() => setEditIncomeOpen(true)}
              >
                <Pencil className="h-2.5 w-2.5" />
                Edit
              </Button>
            </div>
            <TableShell>
              <thead>
                <tr>
                  <TH>Line Item</TH>
                  <TH align="right">T12 Amount</TH>
                </tr>
              </thead>
              <tbody>
                {incomeRows.map((row, i) => (
                  <tr key={row.id || i} className="border-b">
                    <td className="text-[13px] px-3 py-2">{row.line_item}</td>
                    <td
                      className={cn(
                        "text-right text-[13px] num px-3 py-2",
                        row.is_deduction && "text-red-500"
                      )}
                    >
                      {row.is_deduction
                        ? `(${fmtCurrency(Math.abs(row.t12_amount))})`
                        : fmtCurrency(row.t12_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted/50 border-t">
                  <td className="text-[13px] font-semibold px-3 py-2">
                    Net Revenue
                  </td>
                  <td className="text-right text-[13px] font-semibold num px-3 py-2">
                    {fmtCurrency(netRevenue)}
                  </td>
                </tr>
              </tfoot>
            </TableShell>
          </div>

          {/* Expense Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Expenses
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 gap-1 text-[11px] text-muted-foreground"
                onClick={() => setEditExpenseOpen(true)}
              >
                <Pencil className="h-2.5 w-2.5" />
                Edit
              </Button>
            </div>
            <TableShell>
              <thead>
                <tr>
                  <TH>Category</TH>
                  <TH align="right">T12 Amount</TH>
                </tr>
              </thead>
              <tbody>
                {expenseRows.map((row, i) => (
                  <tr key={row.id || i} className="border-b">
                    <td className="text-[13px] px-3 py-2">{row.category}</td>
                    <td className="text-right text-[13px] num px-3 py-2">
                      {fmtCurrency(row.t12_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted/50 border-t">
                  <td className="text-[13px] font-semibold px-3 py-2">
                    Total Expenses
                  </td>
                  <td className="text-right text-[13px] font-semibold num px-3 py-2">
                    {fmtCurrency(totalExpenses)}
                  </td>
                </tr>
                <tr className="bg-muted/50 border-t-2">
                  <td className="text-[13px] font-semibold px-3 py-2">
                    Net Operating Income
                  </td>
                  <td className="text-right text-[13px] font-semibold num px-3 py-2">
                    {fmtCurrency(noi)}
                  </td>
                </tr>
              </tfoot>
            </TableShell>
          </div>
        </>
      )}

      {/* Upload Dialog */}
      <UploadT12Dialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onImport={handleT12Import}
      />

      {/* Edit Income Dialog */}
      <EditIncomeDialog
        open={editIncomeOpen}
        onOpenChange={setEditIncomeOpen}
        incomeRows={incomeRows}
        uwId={uwId}
      />

      {/* Edit Expense Dialog */}
      <EditExpenseDialog
        open={editExpenseOpen}
        onOpenChange={setEditExpenseOpen}
        expenseRows={expenseRows}
        uwId={uwId}
      />
    </div>
  );
}

function KPI({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "green" | "red";
}) {
  return (
    <div className="rounded-lg border bg-card px-3 py-2.5">
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
        {label}
      </p>
      <p
        className={cn(
          "text-sm font-semibold num mt-0.5",
          accent === "green" && "text-green-600",
          accent === "red" && "text-red-500"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function EditIncomeDialog({
  open,
  onOpenChange,
  incomeRows,
  uwId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incomeRows: DealIncomeRow[];
  uwId: string | null;
}) {
  const [rows, setRows] = useState<
    {
      line_item: string;
      t12_amount: number;
      year_1_amount: number;
      growth_rate: number;
      is_deduction: boolean;
      sort_order: number;
    }[]
  >([]);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setRows(
        incomeRows.length > 0
          ? incomeRows.map((r, i) => ({
              line_item: r.line_item,
              t12_amount: r.t12_amount,
              year_1_amount: r.year_1_amount,
              growth_rate: r.growth_rate,
              is_deduction: r.is_deduction,
              sort_order: i,
            }))
          : [
              { line_item: "Gross Potential Rent", t12_amount: 0, year_1_amount: 0, growth_rate: 0, is_deduction: false, sort_order: 0 },
              { line_item: "Vacancy Loss", t12_amount: 0, year_1_amount: 0, growth_rate: 0, is_deduction: true, sort_order: 1 },
              { line_item: "Concessions", t12_amount: 0, year_1_amount: 0, growth_rate: 0, is_deduction: true, sort_order: 2 },
            ]
      );
    }
    onOpenChange(isOpen);
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        line_item: "",
        t12_amount: 0,
        year_1_amount: 0,
        growth_rate: 0,
        is_deduction: false,
        sort_order: prev.length,
      },
    ]);
  };

  const handleSubmit = async () => {
    if (!uwId) return;
    setSaving(true);
    try {
      const result = await upsertIncomeRows(
        uwId,
        rows.map((r, i) => ({ ...r, sort_order: i }))
      );
      if (result.error) {
        toast.error(`Failed to save income: ${result.error}`);
      } else {
        toast.success("Income data saved");
        router.refresh();
        onOpenChange(false);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit T12 Income</DialogTitle>
        </DialogHeader>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b">
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">
                  Line Item
                </th>
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">
                  T12 Amount
                </th>
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">
                  Deduction?
                </th>
                <th className="px-2 py-1.5" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b">
                  <td className="px-2 py-1">
                    <Input
                      className="h-8"
                      value={row.line_item}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((r, j) =>
                            j === i
                              ? { ...r, line_item: e.target.value }
                              : r
                          )
                        )
                      }
                    />
                  </td>
                  <td className="px-2 py-1">
                    <Input
                      className="h-8 w-28"
                      type="number"
                      value={row.t12_amount || ""}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((r, j) =>
                            j === i
                              ? {
                                  ...r,
                                  t12_amount: Number(e.target.value) || 0,
                                  year_1_amount: Number(e.target.value) || 0,
                                }
                              : r
                          )
                        )
                      }
                    />
                  </td>
                  <td className="px-2 py-1 text-center">
                    <input
                      type="checkbox"
                      checked={row.is_deduction}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((r, j) =>
                            j === i
                              ? { ...r, is_deduction: e.target.checked }
                              : r
                          )
                        )
                      }
                    />
                  </td>
                  <td className="px-2 py-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() =>
                        setRows((prev) => prev.filter((_, j) => j !== i))
                      }
                    >
                      <span className="text-muted-foreground text-xs">×</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-fit gap-1"
          onClick={addRow}
        >
          <Plus className="h-3 w-3" />
          Add Line Item
        </Button>
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
            Save Income
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditExpenseDialog({
  open,
  onOpenChange,
  expenseRows,
  uwId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expenseRows: DealExpenseRow[];
  uwId: string | null;
}) {
  const [rows, setRows] = useState<
    {
      category: string;
      t12_amount: number;
      year_1_amount: number;
      growth_rate: number;
      is_percentage: boolean;
      sort_order: number;
    }[]
  >([]);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setRows(
        expenseRows.length > 0
          ? expenseRows.map((r, i) => ({
              category: r.category,
              t12_amount: r.t12_amount,
              year_1_amount: r.year_1_amount,
              growth_rate: r.growth_rate,
              is_percentage: r.is_percentage,
              sort_order: i,
            }))
          : [
              { category: "Property Taxes", t12_amount: 0, year_1_amount: 0, growth_rate: 0, is_percentage: false, sort_order: 0 },
              { category: "Insurance", t12_amount: 0, year_1_amount: 0, growth_rate: 0, is_percentage: false, sort_order: 1 },
              { category: "Utilities", t12_amount: 0, year_1_amount: 0, growth_rate: 0, is_percentage: false, sort_order: 2 },
              { category: "Repairs & Maintenance", t12_amount: 0, year_1_amount: 0, growth_rate: 0, is_percentage: false, sort_order: 3 },
              { category: "Management Fee", t12_amount: 0, year_1_amount: 0, growth_rate: 0, is_percentage: false, sort_order: 4 },
              { category: "G&A / Other", t12_amount: 0, year_1_amount: 0, growth_rate: 0, is_percentage: false, sort_order: 5 },
            ]
      );
    }
    onOpenChange(isOpen);
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        category: "",
        t12_amount: 0,
        year_1_amount: 0,
        growth_rate: 0,
        is_percentage: false,
        sort_order: prev.length,
      },
    ]);
  };

  const handleSubmit = async () => {
    if (!uwId) return;
    setSaving(true);
    try {
      const result = await upsertExpenseRows(
        uwId,
        rows.map((r, i) => ({ ...r, sort_order: i }))
      );
      if (result.error) {
        toast.error(`Failed to save expenses: ${result.error}`);
      } else {
        toast.success("Expense data saved");
        router.refresh();
        onOpenChange(false);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit T12 Expenses</DialogTitle>
        </DialogHeader>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b">
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">
                  Category
                </th>
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">
                  T12 Amount
                </th>
                <th className="px-2 py-1.5" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b">
                  <td className="px-2 py-1">
                    <Input
                      className="h-8"
                      value={row.category}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((r, j) =>
                            j === i
                              ? { ...r, category: e.target.value }
                              : r
                          )
                        )
                      }
                    />
                  </td>
                  <td className="px-2 py-1">
                    <Input
                      className="h-8 w-28"
                      type="number"
                      value={row.t12_amount || ""}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((r, j) =>
                            j === i
                              ? {
                                  ...r,
                                  t12_amount: Number(e.target.value) || 0,
                                  year_1_amount: Number(e.target.value) || 0,
                                }
                              : r
                          )
                        )
                      }
                    />
                  </td>
                  <td className="px-2 py-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() =>
                        setRows((prev) => prev.filter((_, j) => j !== i))
                      }
                    >
                      <span className="text-muted-foreground text-xs">×</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-fit gap-1"
          onClick={addRow}
        >
          <Plus className="h-3 w-3" />
          Add Expense
        </Button>
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
            Save Expenses
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
