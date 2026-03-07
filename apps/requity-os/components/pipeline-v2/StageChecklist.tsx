"use client";

import { useState, useTransition } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { ProgressRing } from "./ProgressRing";
import { toggleChecklistItemAction } from "@/app/(authenticated)/admin/pipeline-v2/actions";
import type { ChecklistItem } from "./pipeline-types";
import { toast } from "sonner";

interface StageChecklistProps {
  items: ChecklistItem[];
  onItemToggled?: () => void;
}

export function StageChecklist({ items, onItemToggled }: StageChecklistProps) {
  const [optimistic, setOptimistic] = useState<Record<string, boolean>>({});
  const [pending, startTransition] = useTransition();

  const total = items.length;
  const completed = items.filter(
    (item) => optimistic[item.id] ?? item.completed
  ).length;

  function handleToggle(item: ChecklistItem) {
    const newValue = !(optimistic[item.id] ?? item.completed);
    setOptimistic((prev) => ({ ...prev, [item.id]: newValue }));

    startTransition(async () => {
      const result = await toggleChecklistItemAction(item.id, newValue);
      if (result.error) {
        setOptimistic((prev) => {
          const next = { ...prev };
          delete next[item.id];
          return next;
        });
        toast.error(`Failed to update checklist: ${result.error}`);
      } else {
        onItemToggled?.();
      }
    });
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No checklist items for this stage.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <ProgressRing completed={completed} total={total} size={18} />
        <span className="num">
          {completed}/{total}
        </span>
        <span>completed</span>
      </div>
      <div className="space-y-1">
        {items
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((item) => {
            const isChecked = optimistic[item.id] ?? item.completed;
            return (
              <label
                key={item.id}
                className={cn(
                  "flex items-start gap-3 rounded-md px-3 py-2 cursor-pointer",
                  "hover:bg-muted/50 transition-colors",
                  isChecked && "opacity-60"
                )}
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => handleToggle(item)}
                  disabled={pending}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <span
                    className={cn(
                      "text-sm",
                      isChecked && "line-through text-muted-foreground"
                    )}
                  >
                    {item.item_label}
                  </span>
                  {item.is_required && !isChecked && (
                    <span className="ml-2 text-[10px] font-medium text-[#B23225]">
                      Required
                    </span>
                  )}
                </div>
              </label>
            );
          })}
      </div>
    </div>
  );
}
