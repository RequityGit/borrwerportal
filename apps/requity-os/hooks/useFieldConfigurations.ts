"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  isVisible,
  type VisibilityCondition,
  type VisibilityContext,
} from "@/lib/visibility-engine";

/** A single rule from the conditional_rules JSONB array on a field. */
export interface ConditionalRule {
  source_field: string;
  operator: "equals" | "not_equals" | "contains" | "is_empty" | "is_not_empty" | "greater_than" | "less_than";
  value?: unknown;
  action: "show" | "hide" | "require" | "set_value";
  set_value?: unknown;
}

/** Role-level view/edit permissions stored in the permissions JSONB column. */
export interface FieldPermissions {
  [role: string]: { view: boolean; edit: boolean };
}

export interface FieldConfiguration {
  id: string;
  module: string;
  field_key: string;
  field_label: string;
  field_type: string;
  is_visible: boolean;
  is_archived: boolean;
  is_required: boolean;
  dropdown_options: string[] | null;
  display_order: number;
  help_text: string | null;
  visibility_condition: VisibilityCondition | null;
  formula_expression: string | null;
  formula_output_format: string | null;
  formula_decimal_places: number | null;
  conditional_rules: ConditionalRule[] | null;
  permissions: FieldPermissions | null;
  required_at_stage: string | null;
  blocks_stage_progression: boolean | null;
}

// Per-module cache (module -> { data, timestamp })
const moduleCache = new Map<
  string,
  { data: FieldConfiguration[]; timestamp: number }
>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const SELECT_COLS = [
  "id",
  "module",
  "field_key",
  "field_label",
  "field_type",
  "is_visible",
  "is_archived",
  "is_required",
  "dropdown_options",
  "display_order",
  "help_text",
  "visibility_condition",
  "formula_expression",
  "formula_output_format",
  "formula_decimal_places",
  "conditional_rules",
  "permissions",
  "required_at_stage",
  "blocks_stage_progression",
].join(", ");

/**
 * Fetches field configurations for a given module from the field_configurations table.
 * Returns only visible, non-archived fields, ordered by display_order.
 * Results are cached per module for 5 minutes.
 *
 * When visibilityContext is provided, fields whose visibility_condition
 * doesn't match the context are excluded (Phase 4: non-pipeline visibility).
 *
 * Used by CRM, loan detail, servicing, and other non-pipeline pages.
 * Pipeline pages use useResolvedCardType() instead.
 */
export function useFieldConfigurations(
  module: string,
  visibilityContext?: VisibilityContext | null
): {
  fields: FieldConfiguration[];
  isLoading: boolean;
  error: string | null;
} {
  const [fields, setFields] = useState<FieldConfiguration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stable key for visibility context to include in effect deps
  const ctxKey = visibilityContext
    ? `${visibilityContext.asset_class}:${JSON.stringify(visibilityContext.dealValues ?? {})}`
    : "";

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      const cached = moduleCache.get(module);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        if (!cancelled) {
          const filtered = visibilityContext
            ? cached.data.filter((f) =>
                isVisible(f.visibility_condition, visibilityContext)
              )
            : cached.data;
          setFields(filtered);
          setIsLoading(false);
        }
        return;
      }

      try {
        const supabase = createClient();
        const { data, error: err } = await supabase
          .from("field_configurations" as never)
          .select(SELECT_COLS as never)
          .eq("module" as never, module as never)
          .eq("is_archived" as never, false as never)
          .eq("is_visible" as never, true as never)
          .order("display_order" as never, { ascending: true });

        if (!cancelled) {
          if (err) {
            setError(err.message);
          } else {
            const records = (data ?? []) as unknown as FieldConfiguration[];
            moduleCache.set(module, { data: records, timestamp: Date.now() });
            const filtered = visibilityContext
              ? records.filter((f) =>
                  isVisible(f.visibility_condition, visibilityContext)
                )
              : records;
            setFields(filtered);
          }
          setIsLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "Failed to load field configurations"
          );
          setIsLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module, ctxKey]);

  return { fields, isLoading, error };
}

/**
 * Invalidate the field config cache for a specific module or all modules.
 * Call this after making changes to field_configurations via the Object Manager.
 */
export function invalidateFieldConfigCache(module?: string) {
  if (module) {
    moduleCache.delete(module);
  } else {
    moduleCache.clear();
  }
}
