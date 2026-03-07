"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Check,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WorkflowTask, TaskProfile } from "@/lib/workflow-tasks";
import {
  getInitials,
  isDueOverdue,
  CATEGORY_COLORS,
  PRIORITY_COLORS,
} from "@/lib/workflow-tasks";

interface WorkflowTaskCardProps {
  task: WorkflowTask;
  profiles: TaskProfile[];
  currentUserId: string;
  onApprove: (taskId: string) => void;
  onReject: (taskId: string) => void;
  onResubmit: (taskId: string) => void;
  onComplete: (taskId: string) => void;
  onClick: (task: WorkflowTask) => void;
}

export function WorkflowTaskCard({
  task,
  profiles,
  currentUserId,
  onApprove,
  onReject,
  onResubmit,
  onComplete,
  onClick,
}: WorkflowTaskCardProps) {
  const [isCompleting, setIsCompleting] = useState(false);

  const isApproval = task.type === "approval";
  const isRejected = task.status === "awaiting_revision";
  const isResubmitted = task.status === "resubmitted";
  const isPending = task.status === "pending";
  const isRequestor = task.requestor_user_id === currentUserId;
  const isAssignee = task.assignee_user_id === currentUserId;

  // Determine who to show as active party
  const activeProfile =
    task.active_party === "requestor"
      ? profiles.find((p) => p.id === task.requestor_user_id)
      : profiles.find((p) => p.id === task.assignee_user_id);

  const activePersonName = activeProfile?.full_name ?? task.assignee_role ?? "Unassigned";
  const overdue = isDueOverdue(task.due_date);
  const catColor = task.category ? CATEGORY_COLORS[task.category] : null;
  const prioColor = PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS.medium;

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCompleting || isApproval) return;
    setIsCompleting(true);
    onComplete(task.id);
  };

  return (
    <div
      onClick={() => onClick(task)}
      className={cn(
        "bg-card rounded-lg border p-3 cursor-pointer transition-[border-color,box-shadow] hover:shadow-sm",
        isRejected
          ? "border-destructive/40 hover:border-destructive/60"
          : "border-border hover:border-border/80"
      )}
    >
      {/* Rejected banner */}
      {isRejected && (
        <div className="flex items-center gap-1.5 mb-2 px-2 py-1 rounded-md bg-destructive/10 text-destructive text-[11px] font-medium">
          <AlertTriangle className="h-3 w-3" strokeWidth={2} />
          Rejected — awaiting revision
        </div>
      )}

      {/* Resubmitted banner */}
      {isResubmitted && (
        <div className="flex items-center gap-1.5 mb-2 px-2 py-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-medium">
          <RotateCcw className="h-3 w-3" strokeWidth={2} />
          Resubmitted for review
        </div>
      )}

      <div className="flex items-start gap-2.5">
        {/* Checkbox (only for non-approval tasks) */}
        {!isApproval && (
          <button
            type="button"
            onClick={handleCheckboxClick}
            className={cn(
              "mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[4px] border-2 transition-all duration-150",
              isCompleting
                ? "border-green-600 bg-green-600"
                : "border-border hover:border-muted-foreground"
            )}
          >
            {isCompleting && (
              <Check className="h-3 w-3 text-white" strokeWidth={3} />
            )}
          </button>
        )}

        {/* Approval icon */}
        {isApproval && (
          <div className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center">
            <ShieldCheck
              className={cn(
                "h-4 w-4",
                isPending || isResubmitted
                  ? "text-orange-500"
                  : isRejected
                    ? "text-destructive"
                    : "text-green-600"
              )}
              strokeWidth={1.5}
            />
          </div>
        )}

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-1.5">
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0",
                prioColor
              )}
            />
            <span
              className={cn(
                "text-sm font-medium leading-snug flex-1",
                isCompleting && "line-through opacity-60"
              )}
            >
              {task.title}
            </span>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {catColor && (
              <span
                className={cn(
                  "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium capitalize",
                  catColor.bg,
                  catColor.text
                )}
              >
                {task.category?.replace(/_/g, " ")}
              </span>
            )}
            {isApproval && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400">
                Approval
              </span>
            )}
            {activePersonName && (
              <div className="flex items-center gap-1">
                <div
                  className={cn(
                    "w-5 h-5 rounded-lg flex items-center justify-center text-[9px] font-semibold flex-shrink-0",
                    task.active_party === "requestor"
                      ? "bg-amber-600 text-white"
                      : "bg-primary text-primary-foreground"
                  )}
                >
                  {getInitials(activePersonName)}
                </div>
              </div>
            )}
            <div className="flex-1" />
            {task.due_date && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-xs num",
                  overdue
                    ? "text-destructive font-medium"
                    : "text-muted-foreground"
                )}
              >
                <Calendar className="h-3 w-3" strokeWidth={1.5} />
                {new Date(task.due_date + "T00:00:00").toLocaleDateString(
                  "en-US",
                  { month: "short", day: "numeric" }
                )}
              </span>
            )}
          </div>

          {/* Approval action buttons */}
          {isApproval && !isRejected && (isPending || isResubmitted) && isAssignee && (
            <div className="flex items-center gap-2 mt-2.5">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[11px] border-green-600/40 text-green-700 dark:text-green-400 hover:bg-green-600/10"
                onClick={(e) => {
                  e.stopPropagation();
                  onApprove(task.id);
                }}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[11px] border-destructive/40 text-destructive hover:bg-destructive/10"
                onClick={(e) => {
                  e.stopPropagation();
                  onReject(task.id);
                }}
              >
                Reject
              </Button>
            </div>
          )}

          {/* Resubmit button for requestor on rejected tasks */}
          {isRejected && isRequestor && (
            <div className="flex items-center gap-2 mt-2.5">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[11px]"
                onClick={(e) => {
                  e.stopPropagation();
                  onResubmit(task.id);
                }}
              >
                <RotateCcw className="h-3 w-3 mr-1" strokeWidth={1.5} />
                Resubmit
              </Button>
            </div>
          )}

          {/* Decision note */}
          {task.decision_note && isRejected && (
            <p className="text-xs text-muted-foreground mt-1.5 italic line-clamp-2">
              &ldquo;{task.decision_note}&rdquo;
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
