"use client";

import { useState, useCallback } from "react";
import {
  Check,
  Clock,
  GitBranch,
  FileUp,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  ClipboardCheck,
  FileText,
  HardHat,
  PenLine,
  CircleDot,
  DollarSign,
  Landmark,
  TrendingUp,
  CalendarCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { timeAgo } from "@/lib/format";
import type { ActionDashboardData, DashboardTask, LoanKPIs } from "./actions";
import { toggleTask, approveRequest } from "./actions";

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

const catMeta: Record<string, { icon: typeof ClipboardCheck; label: string }> = {
  underwriting: { icon: ClipboardCheck, label: "UW" },
  document: { icon: FileText, label: "Doc" },
  inspection: { icon: HardHat, label: "Insp" },
  closing: { icon: PenLine, label: "Close" },
};

function CatTag({ category }: { category: string }) {
  const m = catMeta[category] || { icon: CircleDot, label: category };
  const Icon = m.icon;
  return (
    <span className="inline-flex items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
      <Icon className="h-2.5 w-2.5" strokeWidth={1.5} />
      {m.label}
    </span>
  );
}

const logConfig: Record<string, { icon: typeof GitBranch; color: string }> = {
  stage_change: { icon: GitBranch, color: "text-[#2E6EA6]" },
  document_upload: { icon: FileUp, color: "text-[#1B7A44]" },
  missing_doc: { icon: AlertCircle, color: "text-[#B23225]" },
  condition_update: { icon: FileUp, color: "text-[#2E6EA6]" },
};

// ── KPI Card ────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: typeof DollarSign;
}) {
  return (
    <Card className="flex items-center gap-3 px-4 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-medium text-muted-foreground">{label}</div>
        <div className="text-lg font-bold tracking-tight text-foreground num">{value}</div>
        {sub && <div className="text-[11px] text-muted-foreground num">{sub}</div>}
      </div>
    </Card>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

interface Props {
  initialData: ActionDashboardData;
}

const VISIBLE_TASKS = 5;
const VISIBLE_APPROVALS = 3;
const VISIBLE_ACTIVITY = 6;

export function ActionDashboardV2({ initialData }: Props) {
  const [data, setData] = useState(initialData);
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [showAllApprovals, setShowAllApprovals] = useState(false);
  const [showAllActivity, setShowAllActivity] = useState(false);

  const handleToggleTask = useCallback(
    (taskId: string) => {
      const task = data.tasks.find((t) => t.id === taskId);
      if (!task) return;
      const isCompleting = task.status !== "Complete";
      setData((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId
            ? { ...t, status: isCompleting ? "Complete" : "To Do", completed_at: isCompleting ? new Date().toISOString() : null }
            : t
        ),
      }));
      toggleTask(taskId, isCompleting).then((result) => {
        if ("error" in result) {
          setData((prev) => ({
            ...prev,
            tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, status: task.status, completed_at: task.completed_at } : t)),
          }));
        }
      });
    },
    [data.tasks]
  );

  const handleApprove = useCallback((approvalId: string) => {
    setData((prev) => ({
      ...prev,
      pendingApprovals: prev.pendingApprovals.filter((a) => a.id !== approvalId),
    }));
    approveRequest(approvalId);
  }, []);

  // Computed
  const today = new Date().toISOString().slice(0, 10);
  const tasks = data.tasks;
  const pastDueTasks = tasks.filter((t) => t.due_date != null && t.due_date < today && t.status !== "Complete");
  const activeTasks = tasks.filter((t) => t.status !== "Complete" && !(t.due_date != null && t.due_date < today));

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const kpi = data.loanKPIs;

  const dueLabel = (t: DashboardTask) => {
    if (!t.due_date) return "No date";
    if (t.due_date === today) return "Today";
    const tmrw = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    if (t.due_date === tmrw) return "Tmrw";
    return new Date(t.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="flex h-[calc(100vh-57px)] flex-col overflow-hidden px-6 py-5">
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="mb-4">
        <h1 className="text-xl font-bold tracking-[-0.04em] text-foreground">
          {greeting}, {data.userName}
        </h1>
        <p className="text-xs text-muted-foreground">{dateStr}</p>
      </div>

      {/* ── KPI Row ───────────────────────────────────────────────── */}
      <div className="mb-4 grid grid-cols-4 gap-3">
        <KpiCard
          label="Loans Originated"
          value={String(kpi.totalOriginated)}
          icon={Landmark}
        />
        <KpiCard
          label="Loans Outstanding"
          value={String(kpi.totalOutstanding)}
          icon={TrendingUp}
        />
        <KpiCard
          label="Closed This Month"
          value={String(kpi.closedThisMonthCount)}
          sub={formatCurrency(kpi.closedThisMonthVolume)}
          icon={CalendarCheck}
        />
        <KpiCard
          label="Closed This Year"
          value={String(kpi.closedThisYearCount)}
          sub={formatCurrency(kpi.closedThisYearVolume)}
          icon={DollarSign}
        />
      </div>

      {/* ── Two Column Layout ─────────────────────────────────────── */}
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-4">
        {/* ── Left: Pending Operations ────────────────────────────── */}
        <Card className="flex flex-col overflow-hidden p-0">
          <div className="border-b border-border px-4 py-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Pending Operations
            </span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {/* Approvals Section */}
            <div className="px-4 pt-3 pb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Approvals</span>
              {data.pendingApprovals.length > 0 && (
                <span className="ml-2 rounded-full bg-[#B8822A]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#B8822A] num">
                  {data.pendingApprovals.length}
                </span>
              )}
            </div>
            <div className="px-2">
              {data.pendingApprovals.length === 0 ? (
                <div className="py-4 text-center text-[13px] text-muted-foreground">No pending approvals</div>
              ) : (
                <>
                  {(showAllApprovals ? data.pendingApprovals : data.pendingApprovals.slice(0, VISIBLE_APPROVALS)).map((a) => {
                    const snapshot = a.deal_snapshot || {};
                    const dealName = (snapshot.property_address as string) || (snapshot.loan_number as string) || "Unknown Deal";
                    const amount = snapshot.loan_amount ? `$${(Number(snapshot.loan_amount) / 1000).toFixed(0)}K` : "";

                    return (
                      <div
                        key={a.id}
                        className="group flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-muted/50"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-[13px] font-semibold text-foreground">{dealName}</span>
                            {amount && <span className="shrink-0 text-xs font-bold text-foreground num">{amount}</span>}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <Clock
                              className={`h-3 w-3 ${a.wait_days >= 5 ? "text-[#B23225]" : "text-[#B8822A]"}`}
                              strokeWidth={1.5}
                            />
                            <span className={a.wait_days >= 5 ? "text-[#B23225]" : ""}>Waiting {a.wait_days}d</span>
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            onClick={() => handleApprove(a.id)}
                            className="rounded-md bg-[#1B7A44] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#1B7A44]/90"
                          >
                            Approve
                          </button>
                          <button className="rounded-md border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted">
                            Review
                          </button>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/30 group-hover:hidden" strokeWidth={1.5} />
                      </div>
                    );
                  })}
                  {data.pendingApprovals.length > VISIBLE_APPROVALS && (
                    <button
                      onClick={() => setShowAllApprovals(!showAllApprovals)}
                      className="mt-1 flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-border py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted/50"
                    >
                      <ChevronDown className={`h-3 w-3 transition-transform ${showAllApprovals ? "rotate-180" : ""}`} strokeWidth={1.5} />
                      {showAllApprovals ? "Show less" : `View all ${data.pendingApprovals.length} approvals`}
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Divider */}
            <div className="mx-4 my-2 h-px bg-border" />

            {/* Tasks Section */}
            <div className="px-4 pb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Tasks</span>
              {pastDueTasks.length > 0 && (
                <span className="ml-2 rounded-full bg-[#B23225]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#B23225] num">
                  {pastDueTasks.length} overdue
                </span>
              )}
            </div>
            <div className="px-2 pb-3">
              {(() => {
                const allTasks = [...pastDueTasks, ...activeTasks];
                const visibleTasks = showAllTasks ? allTasks : allTasks.slice(0, VISIBLE_TASKS);
                const hiddenCount = allTasks.length - VISIBLE_TASKS;

                return (
                  <>
                    {visibleTasks.map((tk) => {
                      const isPastDue = tk.due_date != null && tk.due_date < today && tk.status !== "Complete";
                      return (
                        <div
                          key={tk.id}
                          onClick={() => handleToggleTask(tk.id)}
                          className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 transition-colors ${
                            isPastDue ? "hover:bg-[#B23225]/5" : "hover:bg-muted/50"
                          } ${tk.status === "Complete" ? "opacity-40" : ""}`}
                        >
                          <div
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-all ${
                              tk.status === "Complete"
                                ? "border-[#1B7A44] bg-[#1B7A44]"
                                : isPastDue
                                  ? "border-[#B23225]/50"
                                  : "border-muted-foreground/30"
                            }`}
                          >
                            {tk.status === "Complete" && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                          </div>
                          <span
                            className={`min-w-0 flex-1 truncate text-[13px] font-medium ${
                              tk.status === "Complete" ? "text-muted-foreground line-through" : "text-foreground"
                            }`}
                          >
                            {tk.title}
                          </span>
                          {tk.category && <CatTag category={tk.category} />}
                          <span
                            className={`shrink-0 text-[11px] num ${
                              isPastDue
                                ? "font-semibold text-[#B23225]"
                                : tk.due_date === today
                                  ? "font-semibold text-[#B8822A]"
                                  : "text-muted-foreground"
                            }`}
                          >
                            {isPastDue
                              ? `${Math.max(0, Math.floor((Date.now() - new Date(tk.due_date + "T00:00:00").getTime()) / 86400000))}d late`
                              : dueLabel(tk)}
                          </span>
                        </div>
                      );
                    })}
                    {allTasks.length === 0 && (
                      <div className="py-4 text-center text-[13px] text-muted-foreground">No tasks</div>
                    )}
                    {hiddenCount > 0 && (
                      <button
                        onClick={() => setShowAllTasks(!showAllTasks)}
                        className="mt-1 flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-border py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted/50"
                      >
                        <ChevronDown className={`h-3 w-3 transition-transform ${showAllTasks ? "rotate-180" : ""}`} strokeWidth={1.5} />
                        {showAllTasks ? "Show less" : `View all ${allTasks.length} tasks`}
                      </button>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </Card>

        {/* ── Right: Deal Activity ────────────────────────────────── */}
        <Card className="flex flex-col overflow-hidden p-0">
          <div className="border-b border-border px-4 py-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Deal Activity
            </span>
          </div>
          <div className={`flex-1 px-2 py-2 ${showAllActivity ? "overflow-y-auto" : "overflow-hidden"}`}>
            {data.dealLog.length === 0 ? (
              <div className="flex h-full items-center justify-center text-[13px] text-muted-foreground">
                No recent activity
              </div>
            ) : (
              <>
                {(showAllActivity ? data.dealLog : data.dealLog.slice(0, VISIBLE_ACTIVITY)).map((entry) => {
                  const config = logConfig[entry.action] || logConfig.stage_change;
                  const Icon = config.icon;
                  const dealLabel = entry.property_address || entry.loan_number || "Unknown";

                  return (
                    <div key={entry.id} className="flex items-start gap-2.5 rounded-md px-2 py-2.5 transition-colors hover:bg-muted/50">
                      <div className={`mt-0.5 shrink-0 ${config.color}`}>
                        <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`truncate text-[13px] font-medium ${entry.action === "missing_doc" ? "text-[#B23225]" : "text-foreground"}`}>
                            {dealLabel}
                          </span>
                          <span className="shrink-0 text-[10px] text-muted-foreground num">{timeAgo(entry.created_at)}</span>
                        </div>
                        <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">
                          {entry.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {data.dealLog.length > VISIBLE_ACTIVITY && (
                  <button
                    onClick={() => setShowAllActivity(!showAllActivity)}
                    className="mt-1 flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-border py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted/50"
                  >
                    <ChevronDown className={`h-3 w-3 transition-transform ${showAllActivity ? "rotate-180" : ""}`} strokeWidth={1.5} />
                    {showAllActivity ? "Show less" : `View all ${data.dealLog.length} entries`}
                  </button>
                )}
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
