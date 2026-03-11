"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  User,
  Building2,
  Home,
  DollarSign,
  Plus,
  Merge,
  ChevronDown,
  ChevronRight,
  Search,
  ArrowLeftRight,
} from "lucide-react";
import { FieldMergeRow } from "./FieldMergeRow";
import {
  type IntakeEntityKey,
  type EntityMode,
  type FieldChoice,
  type EntityMatchResult,
  type IntakeParsedData,
  type IntakeFieldDef,
  ENTITY_META,
  ENTITY_FIELD_MAP,
  INCOMING_DATA_MAP,
  isEmpty,
  valsMatch,
} from "@/lib/intake/types";

interface EntityMergeSectionProps {
  entityKey: IntakeEntityKey;
  autoMatch: EntityMatchResult | null | undefined;
  parsed: IntakeParsedData;
  mode: EntityMode;
  onModeChange: (mode: EntityMode) => void;
  fieldChoices: Record<string, FieldChoice>;
  onFieldChoice: (entity: IntakeEntityKey, field: string, choice: FieldChoice) => void;
}

const ENTITY_ICONS: Record<IntakeEntityKey, React.ReactNode> = {
  contact: <User className="h-3.5 w-3.5" />,
  company: <Building2 className="h-3.5 w-3.5" />,
  property: <Home className="h-3.5 w-3.5" />,
  opportunity: <DollarSign className="h-3.5 w-3.5" />,
};

const ENTITY_COLOR_CLASSES: Record<IntakeEntityKey, {
  icon: string;
  bg: string;
  border: string;
  text: string;
  toggleActive: string;
}> = {
  contact: {
    icon: "text-blue-500",
    bg: "bg-blue-500/5",
    border: "border-blue-500/20",
    text: "text-blue-600 dark:text-blue-400",
    toggleActive: "bg-blue-500/15 text-blue-600",
  },
  company: {
    icon: "text-violet-500",
    bg: "bg-violet-500/5",
    border: "border-violet-500/20",
    text: "text-violet-600 dark:text-violet-400",
    toggleActive: "bg-violet-500/15 text-violet-600",
  },
  property: {
    icon: "text-emerald-500",
    bg: "bg-emerald-500/5",
    border: "border-emerald-500/20",
    text: "text-emerald-600 dark:text-emerald-400",
    toggleActive: "bg-emerald-500/15 text-emerald-600",
  },
  opportunity: {
    icon: "text-amber-500",
    bg: "bg-amber-500/5",
    border: "border-amber-500/20",
    text: "text-amber-600 dark:text-amber-400",
    toggleActive: "bg-amber-500/15 text-amber-600",
  },
};

export function EntityMergeSection({
  entityKey,
  autoMatch,
  parsed,
  mode,
  onModeChange,
  fieldChoices,
  onFieldChoice,
}: EntityMergeSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const meta = ENTITY_META[entityKey];
  const colors = ENTITY_COLOR_CLASSES[entityKey];
  const fields = ENTITY_FIELD_MAP[entityKey];
  const hasMatch = !!autoMatch;
  const conf = autoMatch ? Math.round(autoMatch.confidence * 100) : 0;
  const incomingData = INCOMING_DATA_MAP[entityKey](parsed);
  const existingData = autoMatch?.snapshot || {};

  // Field stats for merge mode
  const fieldStats = useMemo(() => {
    if (mode !== "merge" || !hasMatch) return null;
    let conflicts = 0;
    let autoFills = 0;
    let matches = 0;
    fields.forEach((f) => {
      const inc = incomingData[f.key];
      const ext = existingData[f.key];
      if (isEmpty(inc) && isEmpty(ext)) return;
      if (valsMatch(inc, ext)) { matches++; return; }
      if (isEmpty(inc) || isEmpty(ext)) { autoFills++; return; }
      conflicts++;
    });
    return { conflicts, autoFills, matches };
  }, [mode, hasMatch, fields, incomingData, existingData]);

  // Count unresolved conflicts
  const unresolvedCount = useMemo(() => {
    if (mode !== "merge" || !hasMatch) return 0;
    let count = 0;
    fields.forEach((f) => {
      const inc = incomingData[f.key];
      const ext = existingData[f.key];
      if (!isEmpty(inc) && !isEmpty(ext) && !valsMatch(inc, ext) && !fieldChoices[f.key]) count++;
    });
    return count;
  }, [mode, hasMatch, fieldChoices, fields, incomingData, existingData]);

  const showFields = mode === "merge" && hasMatch;

  return (
    <div
      className={cn(
        "rounded-lg border transition-all",
        showFields ? [colors.bg, colors.border] : "border-border"
      )}
    >
      {/* Header */}
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <div className="flex items-center justify-between px-3 py-2.5">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-md",
                colors.bg, colors.border, "border"
              )}
            >
              <span className={colors.icon}>{ENTITY_ICONS[entityKey]}</span>
            </div>
            <div>
              <div className={cn("text-[11px] font-bold uppercase tracking-wider", colors.text)}>
                {meta.label}
              </div>
              {hasMatch && mode === "merge" && (
                <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      conf >= 90 ? "bg-emerald-500" : conf >= 70 ? "bg-amber-500" : "bg-orange-500"
                    )}
                  />
                  {conf}% match
                  {autoMatch.snapshot.name ? ` \u2192 ${String(autoMatch.snapshot.name)}` : null}
                  {autoMatch.snapshot.address_line1 ? ` \u2192 ${String(autoMatch.snapshot.address_line1)}` : null}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Stats pills */}
            {showFields && fieldStats && (
              <div className="flex gap-1.5 mr-1">
                {fieldStats.conflicts > 0 && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[9px] py-0 px-1.5",
                      unresolvedCount > 0
                        ? "border-amber-500/50 text-amber-600"
                        : "border-emerald-500/50 text-emerald-600"
                    )}
                  >
                    {unresolvedCount > 0 ? `${unresolvedCount} conflict${unresolvedCount > 1 ? "s" : ""}` : "resolved"}
                  </Badge>
                )}
                {fieldStats.autoFills > 0 && (
                  <Badge variant="outline" className="text-[9px] py-0 px-1.5 border-blue-500/50 text-blue-600">
                    {fieldStats.autoFills} fill{fieldStats.autoFills > 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
            )}

            {/* Mode toggle */}
            <div className="flex gap-0.5 rounded-md border bg-muted/30 p-0.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onModeChange("new")}
                className={cn(
                  "h-6 px-2 text-[10px] font-semibold gap-1",
                  mode === "new" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                )}
              >
                <Plus className="h-2.5 w-2.5" /> New
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onModeChange("merge")}
                className={cn(
                  "h-6 px-2 text-[10px] font-semibold gap-1",
                  mode === "merge" ? cn("shadow-sm", colors.toggleActive) : "text-muted-foreground"
                )}
              >
                {hasMatch ? (
                  <><Merge className="h-2.5 w-2.5" /> Merge</>
                ) : (
                  <><Search className="h-2.5 w-2.5" /> Find</>
                )}
              </Button>
            </div>

            {showFields && (
              <CollapsibleTrigger asChild>
                <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground">
                  {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                </Button>
              </CollapsibleTrigger>
            )}
          </div>
        </div>

        {/* Field-level merge UI */}
        <CollapsibleContent>
          {showFields && (
            <div className="px-3 pb-3 border-t border-border/30">
              {/* Column headers */}
              <div className="grid items-center gap-2 py-2 [grid-template-columns:100px_1fr_28px_1fr]">
                <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Field</div>
                <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground text-center">Existing</div>
                <div />
                <div className="text-[9px] font-semibold uppercase tracking-wider text-amber-600 text-center">Incoming</div>
              </div>
              {fields.map((f) => (
                <FieldMergeRow
                  key={f.key}
                  fieldDef={f}
                  incomingVal={incomingData[f.key]}
                  existingVal={existingData[f.key]}
                  choice={fieldChoices[f.key]}
                  onChoice={(val) => onFieldChoice(entityKey, f.key, val)}
                />
              ))}
              {entityKey === "contact" && (
                <div className="flex items-center gap-1.5 mt-2 text-[10px] text-muted-foreground">
                  <ArrowLeftRight className="h-3 w-3" />
                  <span>= Keep both (adds incoming as secondary value)</span>
                </div>
              )}
            </div>
          )}

          {/* No match in merge mode */}
          {mode === "merge" && !hasMatch && (
            <div className="px-3 pb-3">
              <div className="rounded-md border border-dashed p-4 text-center">
                <Search className="h-4 w-4 mx-auto text-muted-foreground" />
                <p className="text-[11px] text-muted-foreground mt-2">
                  No auto-match found. Search to find an existing {meta.label.toLowerCase()} to merge with,
                  or switch to &ldquo;New&rdquo; to create a new record.
                </p>
              </div>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
