"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface TasksPageTabsProps {
  opsBoard: React.ReactNode;
  workflowBoard: React.ReactNode;
  workflowCount: number;
}

export function TasksPageTabs({
  opsBoard,
  workflowBoard,
  workflowCount,
}: TasksPageTabsProps) {
  const [tab, setTab] = useState<"ops" | "workflow">(
    workflowCount > 0 ? "workflow" : "ops"
  );

  return (
    <div>
      <div className="border-b border-border px-6 md:px-8 pt-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setTab("workflow")}
            className={cn(
              "pb-2.5 text-[13px] font-medium border-b-2 transition-colors",
              tab === "workflow"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Workflow Tasks
            {workflowCount > 0 && (
              <span className="ml-1.5 text-[11px] text-muted-foreground num">
                {workflowCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("ops")}
            className={cn(
              "pb-2.5 text-[13px] font-medium border-b-2 transition-colors",
              tab === "ops"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Ops Tasks
          </button>
        </div>
      </div>
      {tab === "workflow" ? workflowBoard : opsBoard}
    </div>
  );
}
