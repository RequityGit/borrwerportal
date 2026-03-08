"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Ban,
  Upload,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { type DealCondition } from "@/components/pipeline-v2/pipeline-types";
import { updateConditionStatusAction } from "@/app/(authenticated)/admin/pipeline-v2/actions";

// ─── Category grouping ───

const CATEGORY_GROUPS: Record<string, string[]> = {
  ptf: [
    "borrower_documents",
    "non_us_citizen",
    "entity_documents",
    "deal_level_items",
    "appraisal_request",
    "insurance_request",
    "title_request",
    "title_fraud_protection",
    "fundraising",
    "prior_to_funding",
  ],
  ptc: ["closing_prep", "lender_package"],
  ptd: ["prior_to_approval"],
  post_closing: ["post_closing_items", "note_sell_process", "post_loan_payoff"],
};

function getCategoryGroup(category: string): string {
  for (const [group, cats] of Object.entries(CATEGORY_GROUPS)) {
    if (cats.includes(category)) return group;
  }
  return "ptf";
}

const GROUP_LABELS: Record<string, string> = {
  all: "All",
  ptf: "PTF",
  ptc: "PTC",
  ptd: "PTD",
  post_closing: "POST CLOSING",
};

const CATEGORY_LABELS: Record<string, string> = {
  borrower_documents: "Borrower Documents",
  non_us_citizen: "Non-US Citizen",
  entity_documents: "Entity Documents",
  deal_level_items: "Deal Level Items",
  appraisal_request: "Appraisal",
  insurance_request: "Insurance",
  title_request: "Title",
  title_fraud_protection: "Title / Fraud Protection",
  fundraising: "Fundraising",
  prior_to_funding: "Prior to Funding",
  closing_prep: "Closing Prep",
  lender_package: "Lender Package",
  prior_to_approval: "Prior to Approval",
  post_closing_items: "Post Closing",
  note_sell_process: "Note Sell",
  post_loan_payoff: "Post Loan Payoff",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  pending: { label: "Pending", color: "bg-muted text-muted-foreground", icon: Clock },
  submitted: { label: "Submitted", color: "bg-blue-500/10 text-blue-600", icon: FileText },
  under_review: { label: "Under Review", color: "bg-amber-500/10 text-amber-600", icon: Eye },
  approved: { label: "Approved", color: "bg-green-500/10 text-green-600", icon: CheckCircle2 },
  waived: { label: "Waived", color: "bg-slate-500/10 text-slate-500", icon: Ban },
  not_applicable: { label: "N/A", color: "bg-slate-500/10 text-slate-400", icon: Ban },
  rejected: { label: "Rejected", color: "bg-red-500/10 text-red-600", icon: AlertTriangle },
};

const STATUS_OPTIONS = ["pending", "submitted", "under_review", "approved", "waived", "not_applicable", "rejected"];

function formatDate(d: string | null | undefined): string {
  if (!d) return "\u2014";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface ConditionsTabProps {
  conditions: DealCondition[];
  dealId: string;
}

export function ConditionsTab({ conditions, dealId }: ConditionsTabProps) {
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [cpOnly, setCpOnly] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const filtered = conditions.filter((c) => {
    if (groupFilter !== "all" && getCategoryGroup(c.category) !== groupFilter) return false;
    if (cpOnly && !c.critical_path_item) return false;
    return true;
  });

  const cleared = conditions.filter(
    (c) => c.status === "approved" || c.status === "waived" || c.status === "not_applicable"
  ).length;
  const total = conditions.length;
  const pct = total > 0 ? Math.round((cleared / total) * 100) : 0;

  // Group by category
  const byCategory = new Map<string, DealCondition[]>();
  for (const c of filtered) {
    const cat = c.category;
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(c);
  }

  function toggleCategory(cat: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  // Expand all categories by default on first render
  const allExpanded = expandedCategories.size === 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Progress bar */}
      <div className="rounded-xl border bg-card px-5 py-4">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-sm font-semibold num">
            {cleared} of {total} cleared ({pct}%)
          </span>
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span className="num">{conditions.filter((c) => c.status === "pending").length} pending</span>
            <span className="num">{conditions.filter((c) => c.status === "submitted").length} submitted</span>
            <span className="num">{conditions.filter((c) => c.status === "under_review").length} in review</span>
          </div>
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
        {Object.entries(GROUP_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setGroupFilter(key)}
            className={cn(
              "cursor-pointer rounded-lg border px-3.5 py-1 text-xs font-medium transition-colors",
              groupFilter === key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:text-foreground"
            )}
          >
            {label}
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

      {/* Condition cards grouped by category */}
      {filtered.length === 0 && (
        <div className="rounded-xl border bg-card px-5 py-8 text-center text-sm text-muted-foreground">
          No conditions match the current filter.
        </div>
      )}

      {Array.from(byCategory.entries()).map(([category, items]) => {
        const catLabel = CATEGORY_LABELS[category] ?? category.replace(/_/g, " ");
        const catCleared = items.filter(
          (c) => c.status === "approved" || c.status === "waived" || c.status === "not_applicable"
        ).length;
        const isExpanded = allExpanded || expandedCategories.has(category);

        return (
          <div key={category} className="rounded-xl border bg-card overflow-hidden">
            {/* Category header */}
            <button
              onClick={() => toggleCategory(category)}
              className="flex w-full items-center justify-between px-5 py-3 bg-transparent border-0 cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm font-semibold capitalize">{catLabel}</span>
                <Badge variant="outline" className="text-[10px] uppercase">
                  {getCategoryGroup(category)}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground num">
                {catCleared}/{items.length}
              </span>
            </button>

            {/* Condition rows */}
            {isExpanded && (
              <div className="border-t divide-y">
                {items.map((c) => (
                  <ConditionRow key={c.id} condition={c} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Condition Row ───

function ConditionRow({ condition: c }: { condition: DealCondition }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const statusCfg = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.pending;
  const StatusIcon = statusCfg.icon;
  const isOverdue = c.status === "pending" && c.due_date && new Date(c.due_date) < new Date();

  function handleStatusChange(newStatus: string) {
    startTransition(async () => {
      const result = await updateConditionStatusAction(c.id, newStatus);
      if (result.error) {
        toast.error(`Failed to update: ${result.error}`);
      } else {
        toast.success(`Condition ${newStatus === "approved" ? "approved" : "updated"}`);
        router.refresh();
      }
    });
  }

  return (
    <div className="flex items-center gap-3.5 px-5 py-3">
      {/* Status icon */}
      <div className="shrink-0">
        <StatusIcon
          className={cn(
            "h-[18px] w-[18px]",
            c.status === "approved" && "text-green-500",
            c.status === "waived" && "text-slate-400",
            c.status === "rejected" && "text-red-500",
            c.status === "submitted" && "text-blue-500",
            c.status === "under_review" && "text-amber-500",
            c.status === "pending" && "text-muted-foreground",
            c.status === "not_applicable" && "text-slate-400"
          )}
          strokeWidth={1.5}
        />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "text-sm font-medium",
              (c.status === "approved" || c.status === "waived" || c.status === "not_applicable") &&
                "line-through opacity-60"
            )}
          >
            {c.condition_name}
          </span>
          {c.critical_path_item && (
            <Badge variant="destructive" className="text-[10px]">
              Critical
            </Badge>
          )}
          {c.responsible_party && (
            <span className="text-[10px] text-muted-foreground uppercase">
              {c.responsible_party}
            </span>
          )}
        </div>
        <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
          <span className="capitalize">{c.required_stage.replace(/_/g, " ")}</span>
          {c.due_date && (
            <span
              className={cn("num", isOverdue && "text-red-500 font-medium")}
            >
              Due: {formatDate(c.due_date)}
              {isOverdue ? " (OVERDUE)" : ""}
            </span>
          )}
          {(c.document_urls?.length ?? 0) > 0 && (
            <span className="flex items-center gap-0.5 num">
              <FileText className="h-3 w-3" strokeWidth={1.5} /> {c.document_urls!.length}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-2">
        <Badge className={cn("text-[10px] border-0", statusCfg.color)}>
          {statusCfg.label}
        </Badge>
        <Select
          value={c.status}
          onValueChange={handleStatusChange}
          disabled={isPending}
        >
          <SelectTrigger className="h-7 w-[130px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s} className="text-xs">
                {STATUS_CONFIG[s]?.label ?? s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
