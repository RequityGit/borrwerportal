"use client";

import { useState, useMemo, useCallback, useTransition } from "react";
import { updateUwDataAction, updatePropertyDataAction } from "@/app/(authenticated)/admin/pipeline-v2/actions";
import {
  type UnifiedCardType,
  type UwFieldDef,
  computeUwOutput,
  formatCurrency,
  formatPercent,
  formatRatio,
} from "./pipeline-types";
import { UwField } from "./UwField";
import { useUwFieldConfigs } from "@/hooks/useUwFieldConfigs";
import { useDealLayout } from "@/hooks/useDealLayout";
import type { VisibilityContext } from "@/lib/visibility-engine";
import { evaluateFormula } from "@/lib/formula-engine";
import { toast } from "sonner";
import {
  SectionCard,
  MetricCard,
  FieldRow,
} from "@/components/crm/contact-360/contact-detail-shared";
import {
  BarChart3,
  DollarSign,
  Building2,
  User,
  Users,
  FileText,
  Calendar,
  Landmark,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ── Section icon mapping ──

const SECTION_ICONS: Record<string, LucideIcon> = {
  "Deal Summary": DollarSign,
  "Property": Building2,
  "Property Details": Building2,
  "Borrower": User,
  "Borrower Info": User,
  "Key Metrics": BarChart3,
  "Loan Terms": FileText,
  "Key Dates": Calendar,
  "Team": Users,
  "Capital & Funding": Landmark,
};

function getSectionIcon(label: string): LucideIcon {
  return SECTION_ICONS[label] ?? FileText;
}

// ── Value formatting for formula (read-only) fields ──

function formatFormulaValue(field: UwFieldDef, computed: number | null | undefined): React.ReactNode {
  if (computed == null) return "---";
  if (field.formulaOutputFormat === "currency") return formatCurrency(computed);
  if (field.formulaOutputFormat === "percent") return formatPercent(computed);
  return computed.toFixed(field.formulaDecimalPlaces ?? 2);
}

// ── Props ──

interface FieldRef {
  key: string;
  source: string | null;
}

interface EditableOverviewProps {
  dealId: string;
  uwData: Record<string, unknown>;
  propertyData: Record<string, unknown>;
  cardType: UnifiedCardType;
  visibilityContext?: VisibilityContext | null;
}

// ── Main Component ──

export function EditableOverview({
  dealId,
  uwData,
  propertyData,
  cardType,
  visibilityContext,
}: EditableOverviewProps) {
  const [localUwData, setLocalUwData] = useState<Record<string, unknown>>(uwData);
  const [localPropertyData, setLocalPropertyData] = useState<Record<string, unknown>>(propertyData);
  const [pending, startTransition] = useTransition();

  const { fieldMap: uwFieldMap } = useUwFieldConfigs(visibilityContext);
  const layout = useDealLayout();

  const effectiveFieldGroups = useMemo<{ label: string; fields: FieldRef[] }[]>(() => {
    if (!layout.loading && layout.fieldSections.length > 0) {
      const overviewFieldSections = layout.fieldSections.filter(
        (s) => (s.tab_key || "overview") === "overview"
      );

      if (overviewFieldSections.length > 0) {
        return overviewFieldSections.map((section) => {
          const layoutFields = layout.fieldsBySectionId[section.id] ?? [];
          return {
            label: section.section_label,
            fields: layoutFields
              .filter((f) => f.is_visible)
              .map((f) => ({ key: f.field_key, source: f.source_object_key })),
          };
        });
      }
    }

    if (cardType.detail_field_groups.length > 0) {
      return cardType.detail_field_groups.map((g) => ({
        label: g.label,
        fields: g.fields.map((k) => ({ key: k, source: null })),
      }));
    }

    return [];
  }, [layout.loading, layout.fieldSections, layout.fieldsBySectionId, cardType.detail_field_groups]);

  const getFieldValue = useCallback(
    (fieldRef: FieldRef): unknown => {
      if (fieldRef.source === "property") return localPropertyData[fieldRef.key];
      return localUwData[fieldRef.key];
    },
    [localUwData, localPropertyData]
  );

  const formulaValues = useMemo(() => {
    const values: Record<string, number | null> = {};
    const formulaFields = Array.from(uwFieldMap.values()).filter((f) => f.formulaExpression);
    if (formulaFields.length === 0) return values;
    const vars: Record<string, number> = {};
    for (const [k, v] of Object.entries(localUwData)) {
      if (typeof v === "number") vars[k] = v;
      else if (typeof v === "string" && v !== "" && !isNaN(Number(v))) vars[k] = Number(v);
    }
    for (const field of formulaFields) {
      try {
        const result = evaluateFormula(field.formulaExpression!, vars);
        values[field.key] = typeof result === "number" && isFinite(result) ? result : null;
      } catch {
        values[field.key] = null;
      }
    }
    return values;
  }, [uwFieldMap, localUwData]);

  const fieldSourceMap = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const group of effectiveFieldGroups) {
      for (const ref of group.fields) {
        map.set(ref.key, ref.source);
      }
    }
    return map;
  }, [effectiveFieldGroups]);

  function handleFieldChange(key: string, value: unknown, source: string | null) {
    if (source === "property") {
      setLocalPropertyData((prev) => ({ ...prev, [key]: value }));
    } else {
      setLocalUwData((prev) => ({ ...prev, [key]: value }));
    }
  }

  function handleFieldBlur(key: string, source: string | null) {
    const currentVal = source === "property" ? localPropertyData[key] : localUwData[key];
    const prevVal = source === "property" ? propertyData[key] : uwData[key];
    if (currentVal === prevVal) return;

    startTransition(async () => {
      const result = source === "property"
        ? await updatePropertyDataAction(dealId, key, currentVal)
        : await updateUwDataAction(dealId, key, currentVal);

      if (result.error) {
        toast.error(`Failed to save ${uwFieldMap.get(key)?.label ?? key}: ${result.error}`);
        if (source === "property") {
          setLocalPropertyData((prev) => ({ ...prev, [key]: prevVal }));
        } else {
          setLocalUwData((prev) => ({ ...prev, [key]: prevVal }));
        }
      }
    });
  }

  const computedOutputs = cardType.uw_outputs.map((output) => ({
    ...output,
    value: computeUwOutput(output.key, localUwData, cardType.uw_outputs),
  }));
  const activeOutputs = computedOutputs.filter((o) => o.value != null);

  return (
    <div className="space-y-5">
      {activeOutputs.length > 0 && (
        <SectionCard title="Key Metrics" icon={BarChart3}>
          <div className="flex gap-5 flex-wrap">
            {activeOutputs.map((output) => (
              <MetricCard
                key={output.key}
                label={output.label}
                value={
                  output.type === "currency"
                    ? formatCurrency(output.value)
                    : output.type === "percent"
                      ? formatPercent(output.value)
                      : formatRatio(output.value)
                }
                mono
              />
            ))}
          </div>
        </SectionCard>
      )}

      {effectiveFieldGroups.map((group) => (
        <SectionCard
          key={group.label}
          title={group.label}
          icon={getSectionIcon(group.label)}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2.5">
            {group.fields.map((fieldRef) => {
              const fieldDef = uwFieldMap.get(fieldRef.key);
              if (!fieldDef) return null;
              const source = fieldSourceMap.get(fieldRef.key) ?? null;

              if (fieldDef.formulaExpression) {
                return (
                  <FieldRow
                    key={fieldRef.key}
                    label={fieldDef.label}
                    value={formatFormulaValue(fieldDef, formulaValues[fieldRef.key])}
                    mono
                  />
                );
              }

              return (
                <UwField
                  key={fieldRef.key}
                  field={fieldDef}
                  value={getFieldValue(fieldRef)}
                  onChange={(val) => handleFieldChange(fieldRef.key, val, source)}
                  onBlur={() => handleFieldBlur(fieldRef.key, source)}
                  disabled={pending}
                />
              );
            })}
          </div>
        </SectionCard>
      ))}
    </div>
  );
}
