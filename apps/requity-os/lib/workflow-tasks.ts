import { createClient } from "@/lib/supabase/client";

// ── Types ──────────────────────────────────────────────────────────────────

export interface WorkflowTask {
  id: string;
  title: string;
  description: string | null;
  type: "task" | "approval";
  category: string | null;
  priority: string;
  status: string;
  assignee_user_id: string | null;
  assignee_role: string | null;
  requestor_user_id: string | null;
  active_party: string;
  amount: number | null;
  amount_currency: string;
  decision_note: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  resubmitted_at: string | null;
  revision_count: number;
  workflow_rule_id: string | null;
  workflow_instance_id: string | null;
  entity_type: string | null;
  entity_id: string | null;
  parent_task_id: string | null;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

// ── Constants ──────────────────────────────────────────────────────────────

export const TASK_STATUSES = [
  "todo",
  "in_progress",
  "pending",
  "resubmitted",
  "awaiting_revision",
  "approved",
  "completed",
] as const;

export const COLUMN_MAP: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  pending: "In Progress",
  resubmitted: "In Progress",
  awaiting_revision: "To Do",
  approved: "Complete",
  completed: "Complete",
};

export const TASK_PRIORITIES = ["critical", "high", "medium", "low"] as const;

export const TASK_CATEGORIES = [
  "underwriting",
  "documentation",
  "communication",
  "third_party",
  "financial",
  "approval",
  "servicing",
] as const;

export const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  underwriting: {
    bg: "bg-violet-100 dark:bg-violet-950/30",
    text: "text-violet-700 dark:text-violet-400",
  },
  documentation: {
    bg: "bg-blue-100 dark:bg-blue-950/30",
    text: "text-blue-700 dark:text-blue-400",
  },
  communication: {
    bg: "bg-emerald-100 dark:bg-emerald-950/30",
    text: "text-emerald-700 dark:text-emerald-400",
  },
  third_party: {
    bg: "bg-amber-100 dark:bg-amber-950/30",
    text: "text-amber-700 dark:text-amber-400",
  },
  financial: {
    bg: "bg-pink-100 dark:bg-pink-950/30",
    text: "text-pink-700 dark:text-pink-400",
  },
  approval: {
    bg: "bg-orange-100 dark:bg-orange-950/30",
    text: "text-orange-700 dark:text-orange-400",
  },
  servicing: {
    bg: "bg-gray-100 dark:bg-gray-800/50",
    text: "text-gray-700 dark:text-gray-400",
  },
};

export const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-destructive",
  high: "bg-destructive",
  medium: "bg-amber-500",
  low: "bg-muted-foreground/40",
};

// ── Client-side mutations ─────────────────────────────────────────────────

export async function submitApprovalDecision(
  taskId: string,
  decision: "approve" | "reject" | "resubmit",
  userId: string,
  note?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("submit_approval_decision", {
    p_task_id: taskId,
    p_decision: decision,
    p_user_id: userId,
    p_note: note ?? undefined,
  });

  if (error) return { success: false, error: error.message };
  const result = data as { success: boolean; error?: string };
  if (!result.success) return { success: false, error: result.error };
  return { success: true };
}

export async function updateWorkflowTaskStatus(
  taskId: string,
  status: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (status === "completed") {
    updateData.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("tasks")
    .update(updateData)
    .eq("id", taskId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ── Utilities ──────────────────────────────────────────────────────────────

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function isDueOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  const d = new Date(dueDate + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return d < now;
}

/** Sort tasks within a column: rejected first, then pending/reviewing approvals, then tasks */
export function sortWorkflowTasks(tasks: WorkflowTask[]): WorkflowTask[] {
  return [...tasks].sort((a, b) => {
    const statusOrder: Record<string, number> = {
      awaiting_revision: 0,
      pending: 1,
      resubmitted: 2,
      todo: 3,
      in_progress: 4,
      approved: 5,
      completed: 6,
    };
    const aOrder = statusOrder[a.status] ?? 10;
    const bOrder = statusOrder[b.status] ?? 10;
    if (aOrder !== bOrder) return aOrder - bOrder;

    // Within same status, approvals before tasks
    if (a.type === "approval" && b.type !== "approval") return -1;
    if (a.type !== "approval" && b.type === "approval") return 1;

    // Then by creation date (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export function getColumnForStatus(status: string): string {
  return COLUMN_MAP[status] ?? "To Do";
}
