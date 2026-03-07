"use client";

import { useState, useCallback, useTransition } from "react";
import { Plus, Calendar, ChevronDown, ChevronRight, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  createDealTaskV2,
  updateDealTaskV2,
  deleteDealTaskV2,
} from "@/app/(authenticated)/admin/pipeline-v2/[id]/actions";

export interface DealTask {
  id: string;
  deal_id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigned_to: string | null;
  due_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface TasksTabProps {
  tasks: DealTask[];
  dealId: string;
  currentUserId: string;
  teamMembers: { id: string; full_name: string }[];
}

const STATUS_COLORS: Record<string, string> = {
  open: "bg-muted text-muted-foreground",
  in_progress: "bg-blue-500/10 text-blue-500",
  done: "bg-green-500/10 text-green-500",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-amber-500/10 text-amber-600",
  high: "bg-orange-500/10 text-orange-500",
  urgent: "bg-red-500/10 text-red-500",
};

function formatDate(d: string | null | undefined): string {
  if (!d) return "\u2014";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function TasksTab({ tasks, dealId, currentUserId, teamMembers }: TasksTabProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  const activeTasks = tasks.filter((t) => t.status !== "done");
  const completedTasks = tasks.filter((t) => t.status === "done");

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          {activeTasks.length} open task{activeTasks.length !== 1 ? "s" : ""}
        </span>
        <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add Task
        </Button>
      </div>

      {/* Active tasks */}
      {activeTasks.length === 0 && (
        <div className="rounded-xl border bg-card px-5 py-8 text-center text-sm text-muted-foreground">
          No open tasks. Add one to get started.
        </div>
      )}
      {activeTasks.map((task) => (
        <TaskCard key={task.id} task={task} teamMembers={teamMembers} />
      ))}

      {/* Completed tasks */}
      {completedTasks.length > 0 && (
        <button
          onClick={() => setShowCompleted(!showCompleted)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer bg-transparent border-0 hover:text-foreground transition-colors"
        >
          {showCompleted ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
          {completedTasks.length} completed
        </button>
      )}
      {showCompleted &&
        completedTasks.map((task) => (
          <TaskCard key={task.id} task={task} teamMembers={teamMembers} completed />
        ))}

      {/* Create dialog */}
      <CreateTaskDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        dealId={dealId}
        currentUserId={currentUserId}
        teamMembers={teamMembers}
      />
    </div>
  );
}

function TaskCard({
  task,
  teamMembers,
  completed,
}: {
  task: DealTask;
  teamMembers: { id: string; full_name: string }[];
  completed?: boolean;
}) {
  const [deleting, startDelete] = useTransition();
  const [toggling, startToggle] = useTransition();
  const assigneeName = teamMembers.find((t) => t.id === task.assigned_to)?.full_name;
  const isOverdue = !completed && task.due_date && new Date(task.due_date) < new Date();

  function handleToggleStatus() {
    const newStatus = task.status === "done" ? "open" : task.status === "open" ? "in_progress" : "done";
    startToggle(async () => {
      const result = await updateDealTaskV2(task.id, { status: newStatus });
      if (result.error) toast.error(`Failed to update: ${result.error}`);
    });
  }

  function handleDelete() {
    startDelete(async () => {
      const result = await deleteDealTaskV2(task.id);
      if (result.error) {
        toast.error(`Failed to delete: ${result.error}`);
      } else {
        toast.success("Task deleted");
      }
    });
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border bg-card px-4 py-3",
        completed && "opacity-60"
      )}
    >
      {/* Status toggle */}
      <button
        onClick={handleToggleStatus}
        disabled={toggling}
        className={cn(
          "mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 cursor-pointer transition-colors",
          task.status === "done"
            ? "border-green-500 bg-green-500"
            : task.status === "in_progress"
              ? "border-blue-500"
              : "border-border"
        )}
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "text-sm font-medium",
              completed && "line-through"
            )}
          >
            {task.title}
          </span>
          <Badge variant="outline" className={cn("text-[10px]", STATUS_COLORS[task.status])}>
            {task.status.replace("_", " ")}
          </Badge>
          <Badge variant="outline" className={cn("text-[10px]", PRIORITY_COLORS[task.priority])}>
            {task.priority}
          </Badge>
        </div>
        {task.description && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}
        <div className="mt-1.5 flex gap-3 text-[11px] text-muted-foreground">
          {assigneeName && <span>{assigneeName}</span>}
          {task.due_date && (
            <span className={cn("num flex items-center gap-1", isOverdue && "text-red-500 font-medium")}>
              <Calendar className="h-3 w-3" />
              {formatDate(task.due_date)}
              {isOverdue && " (overdue)"}
            </span>
          )}
        </div>
      </div>

      <button
        onClick={handleDelete}
        disabled={deleting}
        className="p-1 text-muted-foreground hover:text-destructive transition-colors cursor-pointer bg-transparent border-0 shrink-0"
      >
        {deleting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
        )}
      </button>
    </div>
  );
}

function CreateTaskDialog({
  open,
  onOpenChange,
  dealId,
  currentUserId,
  teamMembers,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealId: string;
  currentUserId: string;
  teamMembers: { id: string; full_name: string }[];
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [creating, startCreate] = useTransition();

  function handleCreate() {
    if (!title.trim()) return;
    startCreate(async () => {
      const result = await createDealTaskV2(dealId, {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        assigned_to: assignedTo || null,
        due_date: dueDate || null,
        created_by: currentUserId,
      });
      if (result.error) {
        toast.error(`Failed to create task: ${result.error}`);
      } else {
        toast.success("Task created");
        onOpenChange(false);
        setTitle("");
        setDescription("");
        setPriority("medium");
        setAssignedTo("");
        setDueDate("");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Task</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2">
          <div>
            <Label className="text-sm mb-1 block">Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title..."
            />
          </div>
          <div>
            <Label className="text-sm mb-1 block">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm mb-1 block">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm mb-1 block">Assign To</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-sm mb-1 block">Due Date</Label>
            <DatePicker value={dueDate} onChange={setDueDate} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!title.trim() || creating}>
            {creating && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
            Create Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
