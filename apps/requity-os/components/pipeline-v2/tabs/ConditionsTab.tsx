"use client";

import { useState } from "react";
import {
  CheckSquare,
  Square,
  Paperclip,
  Upload,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ConditionItem {
  id: string;
  deal_id: string;
  label: string;
  category?: string | null;
  completed: boolean;
  due_date?: string | null;
  assigned_to?: string | null;
  critical_path?: boolean | null;
  notes?: string | null;
  created_at: string;
  _assigned_name?: string | null;
  _doc_count?: number;
}

interface ConditionsTabProps {
  conditions: ConditionItem[];
}

const CATEGORY_FILTERS = ["all", "ptf", "ptc", "ptd", "post_closing"] as const;

function formatDate(d: string | null | undefined): string {
  if (!d) return "\u2014";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ConditionsTab({ conditions }: ConditionsTabProps) {
  const [filter, setFilter] = useState<string>("all");
  const [cpOnly, setCpOnly] = useState(false);

  const filtered = conditions.filter((c) => {
    if (filter !== "all" && c.category !== filter) return false;
    if (cpOnly && !c.critical_path) return false;
    return true;
  });

  const cleared = conditions.filter((c) => c.completed).length;
  const total = conditions.length;
  const pct = total > 0 ? Math.round((cleared / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Progress bar */}
      <div className="rounded-xl border bg-card px-5 py-4">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-sm font-semibold num">
            {cleared} of {total} cleared ({pct}%)
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-500"
            style={{ width: pct + "%" }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {CATEGORY_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "cursor-pointer rounded-lg border px-3.5 py-1 text-xs font-medium transition-colors",
              filter === f
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:text-foreground"
            )}
          >
            {f === "all" ? "All" : f.toUpperCase().replace("_", " ")}
          </button>
        ))}
        <button
          className="ml-2 flex cursor-pointer items-center gap-1.5 bg-transparent border-0"
          onClick={() => setCpOnly(!cpOnly)}
        >
          <div
            className={cn(
              "flex h-4 w-4 items-center justify-center rounded border-2 transition-colors",
              cpOnly ? "border-primary bg-primary" : "border-border"
            )}
          >
            {cpOnly && <CheckCircle2 className="h-2.5 w-2.5 text-primary-foreground" />}
          </div>
          <span className="text-xs text-muted-foreground">Critical Path</span>
        </button>
      </div>

      {/* Condition cards */}
      {filtered.length === 0 && (
        <div className="rounded-xl border bg-card px-5 py-8 text-center text-sm text-muted-foreground">
          No conditions match the current filter.
        </div>
      )}
      {filtered.map((c) => {
        const isOverdue = !c.completed && c.due_date && new Date(c.due_date) < new Date();

        return (
          <div
            key={c.id}
            className="flex items-center gap-3.5 rounded-xl border bg-card px-5 py-3.5"
          >
            <div className="shrink-0">
              {c.completed ? (
                <CheckSquare className="h-[18px] w-[18px] text-green-500" strokeWidth={1.5} />
              ) : (
                <Square className="h-[18px] w-[18px] text-border" strokeWidth={1.5} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "text-sm font-medium",
                    c.completed && "line-through opacity-60"
                  )}
                >
                  {c.label}
                </span>
                {c.category && (
                  <Badge variant="outline" className="text-[10px] uppercase">
                    {c.category}
                  </Badge>
                )}
                {c.critical_path && (
                  <Badge variant="destructive" className="text-[10px]">
                    Critical
                  </Badge>
                )}
              </div>
              <div className="mt-1.5 flex gap-4 text-xs text-muted-foreground">
                {c._assigned_name && <span>{c._assigned_name}</span>}
                {c.due_date && (
                  <span
                    className={cn(
                      "num",
                      isOverdue && "text-red-500 font-medium"
                    )}
                  >
                    Due: {formatDate(c.due_date)}
                    {isOverdue ? " (OVERDUE)" : ""}
                  </span>
                )}
                {(c._doc_count ?? 0) > 0 && (
                  <span className="flex items-center gap-0.5 num">
                    <Paperclip className="h-3 w-3" strokeWidth={1.5} /> {c._doc_count}
                  </span>
                )}
              </div>
            </div>
            <div className="flex shrink-0 gap-1.5">
              <Button size="sm" variant="outline" className="h-7 text-xs">
                <Upload className="h-3 w-3 mr-1" />
                Upload
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs">
                <Eye className="h-3 w-3 mr-1" />
                Review
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
