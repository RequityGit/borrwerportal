"use client";

import { useState, useMemo, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Mail, Check, X, Plus, Merge } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { EntityMergeSection } from "./EntityMergeSection";
import { processIntakeItemAction } from "@/app/(authenticated)/admin/pipeline-v2/actions";
import {
  type IntakeItem,
  type IntakeEntityKey,
  type EntityMode,
  type FieldChoice,
  type IntakeDecisions,
  ENTITY_META,
  ENTITY_FIELD_MAP,
  INCOMING_DATA_MAP,
  isEmpty,
  valsMatch,
} from "@/lib/intake/types";

interface IntakeReviewModalProps {
  item: IntakeItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatMoney(n: number | undefined | null): string {
  if (!n) return "--";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

const ENTITY_KEYS: IntakeEntityKey[] = ["contact", "company", "property", "opportunity"];

export function IntakeReviewModal({ item, open, onOpenChange }: IntakeReviewModalProps) {
  const [entityModes, setEntityModes] = useState<Partial<Record<IntakeEntityKey, EntityMode>>>({});
  const [fieldChoices, setFieldChoices] = useState<Partial<Record<IntakeEntityKey, Record<string, FieldChoice>>>>({});
  const [pending, startTransition] = useTransition();

  const p = item?.parsed_data;

  const getMode = (k: IntakeEntityKey): EntityMode => {
    if (!item) return "new";
    return entityModes[k] ?? (item.auto_matches[k] ? "merge" : "new");
  };

  const setMode = (k: IntakeEntityKey, v: EntityMode) => {
    setEntityModes((prev) => ({ ...prev, [k]: v }));
  };

  const getFieldChoicesForEntity = (k: IntakeEntityKey): Record<string, FieldChoice> => {
    return fieldChoices[k] || {};
  };

  const setFieldChoice = (entity: IntakeEntityKey, field: string, val: FieldChoice) => {
    setFieldChoices((prev) => ({
      ...prev,
      [entity]: { ...(prev[entity] || {}), [field]: val },
    }));
  };

  // Check if all entities resolved and all conflicts decided
  const allResolved = useMemo(() => {
    if (!item) return false;
    for (const ek of ENTITY_KEYS) {
      const mode = getMode(ek);
      if (mode === "merge" && item.auto_matches[ek]) {
        const fields = ENTITY_FIELD_MAP[ek];
        const incoming = INCOMING_DATA_MAP[ek](item.parsed_data);
        const existing = item.auto_matches[ek]!.snapshot;
        const ec = getFieldChoicesForEntity(ek);
        for (const f of fields) {
          const inc = incoming[f.key];
          const ext = existing[f.key];
          if (!isEmpty(inc) && !isEmpty(ext) && !valsMatch(inc, ext) && !ec[f.key]) {
            return false;
          }
        }
      }
    }
    return true;
  }, [entityModes, fieldChoices, item]);

  // Build action summary
  const summary = useMemo(() => {
    if (!item) return [];
    const actions: { label: string; isNew: boolean }[] = [];
    ENTITY_KEYS.forEach((ek) => {
      const mode = getMode(ek);
      const meta = ENTITY_META[ek];
      if (mode === "new") {
        actions.push({ label: `Create new ${meta.label}`, isNew: true });
      } else if (mode === "merge" && item.auto_matches[ek]) {
        const fields = ENTITY_FIELD_MAP[ek];
        const incoming = INCOMING_DATA_MAP[ek](item.parsed_data);
        const existing = item.auto_matches[ek]!.snapshot;
        const fc = getFieldChoicesForEntity(ek);
        const overwrites: string[] = [];
        const fills: string[] = [];
        const boths: string[] = [];
        fields.forEach((f) => {
          const inc = incoming[f.key];
          const ext = existing[f.key];
          if (isEmpty(inc) && isEmpty(ext)) return;
          if (valsMatch(inc, ext)) return;
          if (isEmpty(ext) && !isEmpty(inc)) { fills.push(f.label); return; }
          if (isEmpty(inc) && !isEmpty(ext)) return;
          if (fc[f.key] === "incoming") overwrites.push(f.label);
          if (fc[f.key] === "both") boths.push(f.label);
        });
        const parts: string[] = [];
        if (fills.length) parts.push(`fill ${fills.length} empty field${fills.length > 1 ? "s" : ""}`);
        if (overwrites.length) parts.push(`overwrite ${overwrites.join(", ")}`);
        if (boths.length) parts.push(`keep both for ${boths.join(", ")}`);
        const matchName = String(existing.name || existing.address_line1 || "");
        actions.push({
          label: `Merge ${meta.label} \u2192 ${matchName}${parts.length ? ": " + parts.join("; ") : ""}`,
          isNew: false,
        });
      }
    });
    return actions;
  }, [entityModes, fieldChoices, item]);

  const handleConfirm = () => {
    if (!item || !allResolved) return;
    const decisions: IntakeDecisions = {
      entityModes: Object.fromEntries(ENTITY_KEYS.map((k) => [k, getMode(k)])) as Record<IntakeEntityKey, EntityMode>,
      fieldChoices: fieldChoices as Partial<Record<IntakeEntityKey, Record<string, FieldChoice>>>,
    };
    startTransition(async () => {
      const result = await processIntakeItemAction(item.id, decisions);
      if (result?.error) {
        console.error("Failed to process intake item:", result.error);
      } else {
        onOpenChange(false);
        // Reset state
        setEntityModes({});
        setFieldChoices({});
      }
    });
  };

  const handleDismiss = () => {
    if (!item) return;
    startTransition(async () => {
      const result = await processIntakeItemAction(item.id, null);
      if (result?.error) {
        console.error("Failed to dismiss intake item:", result.error);
      } else {
        onOpenChange(false);
        setEntityModes({});
        setFieldChoices({});
      }
    });
  };

  if (!item || !p) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[680px] max-h-[92vh] p-0 flex flex-col gap-0">
        {/* Header */}
        <div className="p-5 pb-3 border-b">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="text-[9px] font-bold px-1.5 py-0 bg-gradient-to-r from-amber-500 to-amber-600 text-black border-0">
                INTAKE REVIEW
              </Badge>
              <span className="text-[11px] text-muted-foreground">
                {formatDistanceToNow(new Date(item.received_at), { addSuffix: true })}
              </span>
            </div>
            <DialogTitle className="text-base truncate">
              {item.subject || "(no subject)"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
            <Mail className="h-3.5 w-3.5" />
            <span>{item.from_name ? `${item.from_name} <${item.from_email}>` : item.from_email}</span>
          </div>
        </div>

        {/* Scrollable content */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-5 space-y-5">
            {/* Extracted Fields summary */}
            <div>
              <Label className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                Extracted Fields
              </Label>
              <div className="grid grid-cols-3 gap-x-4 gap-y-1.5 mt-2">
                {([
                  ["Contact", p.contactName],
                  ["Email", p.contactEmail],
                  ["Phone", p.contactPhone],
                  ["Company", p.companyName || "--"],
                  ["Property", p.propertyAddress],
                  ["Type", p.propertyType],
                  ["Loan Amount", p.loanAmount ? formatMoney(p.loanAmount) : "--"],
                  ["Loan Type", p.loanType],
                  ["ARV", p.arv ? formatMoney(p.arv) : "--"],
                ] as [string, string | undefined][]).map(([label, val]) => (
                  <div key={label}>
                    <div className="text-[9px] text-muted-foreground/50">{label}</div>
                    <div className="text-[11px] text-foreground font-medium mt-0.5 truncate">
                      {val || "--"}
                    </div>
                  </div>
                ))}
              </div>
              {p.notes && (
                <div className="mt-3 rounded-md border p-2.5">
                  <div className="text-[9px] text-muted-foreground/50 mb-0.5">Notes</div>
                  <div className="text-[11px] text-muted-foreground leading-relaxed">{p.notes}</div>
                </div>
              )}
            </div>

            {/* Entity Merge Decisions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Entity Merge Decisions
                </Label>
                <span className="text-[10px] text-muted-foreground">
                  Expand merged entities to review fields
                </span>
              </div>
              <div className="space-y-2">
                {ENTITY_KEYS.map((ek) => (
                  <EntityMergeSection
                    key={ek}
                    entityKey={ek}
                    autoMatch={item.auto_matches[ek]}
                    parsed={p}
                    mode={getMode(ek)}
                    onModeChange={(v) => setMode(ek, v)}
                    fieldChoices={getFieldChoicesForEntity(ek)}
                    onFieldChoice={setFieldChoice}
                  />
                ))}
              </div>
            </div>

            {/* Action Summary */}
            {allResolved && summary.length > 0 && (
              <div className="rounded-lg border bg-muted/20 p-3">
                <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Action Summary
                </div>
                {summary.map((s, i) => (
                  <div key={i} className="flex items-start gap-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {s.isNew ? (
                      <Plus className="h-3 w-3 shrink-0 mt-0.5 text-muted-foreground" />
                    ) : (
                      <Merge className="h-3 w-3 shrink-0 mt-0.5 text-primary" />
                    )}
                    <span>{s.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Bottom action bar */}
        <div className="p-4 border-t flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={handleDismiss}
            disabled={pending}
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Dismiss
          </Button>
          <Button
            type="button"
            size="sm"
            className="text-xs bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:from-amber-600 hover:to-amber-700"
            onClick={handleConfirm}
            disabled={!allResolved || pending}
          >
            <Check className="h-3.5 w-3.5 mr-1" />
            Confirm &amp; Process
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
