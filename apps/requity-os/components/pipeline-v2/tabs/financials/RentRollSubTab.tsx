"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Upload,
  Trash2,
  ChevronDown,
  Pencil,
  Loader2,
} from "lucide-react";
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
import { upsertRentRoll } from "@/app/(authenticated)/admin/pipeline-v2/[id]/commercial-uw-actions";
import { UploadRentRollDialog } from "@/components/admin/commercial-uw/upload-rent-roll-dialog";
import type { RentRollRow } from "@/lib/commercial-uw/types";
import { TableShell, TH, StatusDot, SubLabel, n, fmtCurrency } from "./shared";

interface RentRollSubTabProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rentRoll: any[];
  uwId: string | null;
}

export function RentRollSubTab({ rentRoll, uwId }: RentRollSubTabProps) {
  const [showAllUnits, setShowAllUnits] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const router = useRouter();

  const INITIAL_UNITS = 10;
  const visibleUnits = showAllUnits
    ? rentRoll
    : rentRoll.slice(0, INITIAL_UNITS);
  const hiddenCount = rentRoll.length - INITIAL_UNITS;

  const totalCurrentRent = useMemo(
    () =>
      rentRoll.reduce(
        (sum: number, r: { current_rent: number }) => sum + n(r.current_rent),
        0
      ),
    [rentRoll]
  );
  const totalMarketRent = useMemo(
    () =>
      rentRoll.reduce(
        (sum: number, r: { market_rent: number }) => sum + n(r.market_rent),
        0
      ),
    [rentRoll]
  );
  const occupiedCount = useMemo(
    () =>
      rentRoll.filter((r: { status: string }) => r.status === "occupied")
        .length,
    [rentRoll]
  );
  const totalSF = useMemo(
    () =>
      rentRoll.reduce(
        (sum: number, r: { sq_ft: number }) => sum + n(r.sq_ft),
        0
      ),
    [rentRoll]
  );

  const handleImport = useCallback(
    async (rows: RentRollRow[]) => {
      if (!uwId) return;
      const result = await upsertRentRoll(
        uwId,
        rows.map((r, i) => ({
          unit_number: r.unit_number || `${i + 1}`,
          bedrooms: null,
          bathrooms: null,
          sq_ft: r.sf || null,
          current_rent: r.current_monthly_rent || 0,
          market_rent: r.market_rent || 0,
          status: r.is_vacant ? "vacant" : "occupied",
          lease_start: r.lease_start || null,
          lease_end: r.lease_end || null,
          tenant_name: r.tenant_name || null,
          sort_order: i,
        }))
      );
      if (result.error) {
        toast.error(`Failed to import rent roll: ${result.error}`);
      } else {
        toast.success(`Imported ${rows.length} units from rent roll`);
        router.refresh();
      }
    },
    [uwId, router]
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <SubLabel>
          Rent Roll{" "}
          {rentRoll.length > 0 && (
            <span className="normal-case font-normal">
              — {rentRoll.length} units
            </span>
          )}
        </SubLabel>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => setUploadOpen(true)}
          >
            <Upload className="h-3 w-3" />
            Upload
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="h-3 w-3" />
            {rentRoll.length > 0 ? "Edit" : "Add Manually"}
          </Button>
        </div>
      </div>

      {/* Summary KPIs */}
      {rentRoll.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          <KPI label="Total Units" value={String(rentRoll.length)} />
          <KPI
            label="Occupancy"
            value={`${((occupiedCount / rentRoll.length) * 100).toFixed(0)}%`}
          />
          <KPI label="Current Rent" value={`${fmtCurrency(totalCurrentRent)}/mo`} />
          <KPI label="Total SF" value={totalSF > 0 ? totalSF.toLocaleString() : "—"} />
        </div>
      )}

      {/* Table */}
      {rentRoll.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            No rent roll data yet. Upload a spreadsheet or enter units manually.
          </p>
          <div className="flex items-center gap-2 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUploadOpen(true)}
            >
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              Upload Rent Roll
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditOpen(true)}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Manually
            </Button>
          </div>
        </div>
      ) : (
        <TableShell>
          <thead>
            <tr>
              <TH>Unit</TH>
              <TH>Tenant</TH>
              <TH>BD/BA</TH>
              <TH align="right">SF</TH>
              <TH align="right">Current Rent</TH>
              <TH align="right">Market Rent</TH>
              <TH>Status</TH>
            </tr>
          </thead>
          <tbody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {visibleUnits.map((unit: any, i: number) => (
              <tr key={unit.id || i} className="border-b">
                <td className="text-[13px] px-3 py-2 font-medium">
                  {unit.unit_number}
                </td>
                <td className="text-[13px] px-3 py-2 text-muted-foreground truncate max-w-[140px]">
                  {unit.tenant_name || "—"}
                </td>
                <td className="text-[13px] px-3 py-2 text-muted-foreground">
                  {unit.bedrooms != null
                    ? `${unit.bedrooms}/${unit.bathrooms ?? 1}`
                    : "—"}
                </td>
                <td className="text-right text-[13px] num px-3 py-2 text-muted-foreground">
                  {unit.sq_ft ? Number(unit.sq_ft).toLocaleString() : "—"}
                </td>
                <td className="text-right text-[13px] num px-3 py-2">
                  {fmtCurrency(unit.current_rent)}
                </td>
                <td className="text-right text-[13px] num px-3 py-2">
                  {fmtCurrency(unit.market_rent)}
                </td>
                <td className="text-[13px] px-3 py-2">
                  <StatusDot status={unit.status} />
                </td>
              </tr>
            ))}
            {!showAllUnits && hiddenCount > 0 && (
              <tr>
                <td colSpan={7} className="text-center py-2">
                  <button
                    onClick={() => setShowAllUnits(true)}
                    className="text-[13px] font-medium cursor-pointer border-0 bg-transparent flex items-center gap-1 mx-auto text-primary"
                  >
                    <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Show {hiddenCount} more units
                  </button>
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="bg-muted/50 border-t">
              <td colSpan={4} className="text-[13px] font-semibold px-3 py-2">
                Total ({occupiedCount}/{rentRoll.length} occupied ·{" "}
                {((occupiedCount / rentRoll.length) * 100).toFixed(0)}%)
              </td>
              <td className="text-right text-[13px] font-semibold num px-3 py-2">
                {fmtCurrency(totalCurrentRent)}/mo
              </td>
              <td className="text-right text-[13px] font-semibold num px-3 py-2">
                {fmtCurrency(totalMarketRent)}/mo
              </td>
              <td />
            </tr>
          </tfoot>
        </TableShell>
      )}

      {/* Upload Dialog */}
      <UploadRentRollDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onImport={handleImport}
      />

      {/* Manual Edit Dialog */}
      <RentRollEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        rentRoll={rentRoll}
        uwId={uwId}
      />
    </div>
  );
}

function KPI({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card px-3 py-2.5">
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
        {label}
      </p>
      <p className="text-sm font-semibold num mt-0.5">{value}</p>
    </div>
  );
}

function RentRollEditDialog({
  open,
  onOpenChange,
  rentRoll,
  uwId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rentRoll: any[];
  uwId: string | null;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rows, setRows] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setRows(
        rentRoll.length > 0
          ? rentRoll.map((r, i) => ({ ...r, sort_order: i }))
          : [
              {
                unit_number: "1",
                bedrooms: null,
                bathrooms: null,
                sq_ft: null,
                current_rent: 0,
                market_rent: 0,
                status: "occupied",
                lease_start: null,
                lease_end: null,
                tenant_name: null,
                sort_order: 0,
              },
            ]
      );
    }
    onOpenChange(isOpen);
  };

  const addUnit = () => {
    setRows((prev) => [
      ...prev,
      {
        unit_number: `${prev.length + 1}`,
        bedrooms: null,
        bathrooms: null,
        sq_ft: null,
        current_rent: 0,
        market_rent: 0,
        status: "occupied",
        lease_start: null,
        lease_end: null,
        tenant_name: null,
        sort_order: prev.length,
      },
    ]);
  };

  const removeUnit = (idx: number) => {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateRow = (idx: number, field: string, value: string) => {
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r))
    );
  };

  const handleSubmit = async () => {
    if (!uwId) return;
    setSaving(true);
    try {
      const result = await upsertRentRoll(
        uwId,
        rows.map((r, i) => ({
          unit_number: r.unit_number || `${i + 1}`,
          bedrooms: r.bedrooms ? Number(r.bedrooms) : null,
          bathrooms: r.bathrooms ? Number(r.bathrooms) : null,
          sq_ft: r.sq_ft ? Number(r.sq_ft) : null,
          current_rent: Number(r.current_rent) || 0,
          market_rent: Number(r.market_rent) || 0,
          status: r.status || "occupied",
          lease_start: r.lease_start || null,
          lease_end: r.lease_end || null,
          tenant_name: r.tenant_name || null,
          sort_order: i,
        }))
      );
      if (result.error) {
        toast.error(`Failed to save rent roll: ${result.error}`);
      } else {
        toast.success(`Rent roll saved (${rows.length} units)`);
        router.refresh();
        onOpenChange(false);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Rent Roll</DialogTitle>
        </DialogHeader>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b">
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">
                  Unit
                </th>
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">
                  Tenant
                </th>
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">
                  BD
                </th>
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">
                  BA
                </th>
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">
                  SF
                </th>
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">
                  Current Rent
                </th>
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">
                  Market Rent
                </th>
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-2 py-1.5" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b">
                  <td className="px-2 py-1">
                    <Input
                      className="h-8 w-14"
                      value={row.unit_number || ""}
                      onChange={(e) =>
                        updateRow(i, "unit_number", e.target.value)
                      }
                    />
                  </td>
                  <td className="px-2 py-1">
                    <Input
                      className="h-8 w-28"
                      value={row.tenant_name || ""}
                      onChange={(e) =>
                        updateRow(i, "tenant_name", e.target.value)
                      }
                    />
                  </td>
                  <td className="px-2 py-1">
                    <Input
                      className="h-8 w-14"
                      type="number"
                      value={row.bedrooms ?? ""}
                      onChange={(e) =>
                        updateRow(i, "bedrooms", e.target.value)
                      }
                    />
                  </td>
                  <td className="px-2 py-1">
                    <Input
                      className="h-8 w-14"
                      type="number"
                      step="0.5"
                      value={row.bathrooms ?? ""}
                      onChange={(e) =>
                        updateRow(i, "bathrooms", e.target.value)
                      }
                    />
                  </td>
                  <td className="px-2 py-1">
                    <Input
                      className="h-8 w-20"
                      type="number"
                      value={row.sq_ft ?? ""}
                      onChange={(e) => updateRow(i, "sq_ft", e.target.value)}
                    />
                  </td>
                  <td className="px-2 py-1">
                    <Input
                      className="h-8 w-24"
                      type="number"
                      value={row.current_rent ?? ""}
                      onChange={(e) =>
                        updateRow(i, "current_rent", e.target.value)
                      }
                    />
                  </td>
                  <td className="px-2 py-1">
                    <Input
                      className="h-8 w-24"
                      type="number"
                      value={row.market_rent ?? ""}
                      onChange={(e) =>
                        updateRow(i, "market_rent", e.target.value)
                      }
                    />
                  </td>
                  <td className="px-2 py-1">
                    <select
                      className="h-8 rounded border px-2 text-[13px] bg-background"
                      value={row.status || "occupied"}
                      onChange={(e) => updateRow(i, "status", e.target.value)}
                    >
                      <option value="occupied">Occupied</option>
                      <option value="vacant">Vacant</option>
                      <option value="down">Down</option>
                      <option value="model">Model</option>
                    </select>
                  </td>
                  <td className="px-2 py-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => removeUnit(i)}
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground" />
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
          onClick={addUnit}
        >
          <Plus className="h-3 w-3" />
          Add Unit
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
            Save Rent Roll
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
