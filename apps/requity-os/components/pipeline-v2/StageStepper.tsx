"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { STAGES, type UnifiedStage } from "./pipeline-types";

interface StageStepperProps {
  currentStage: UnifiedStage;
  compact?: boolean;
}

export function StageStepper({ currentStage, compact }: StageStepperProps) {
  const currentIndex = STAGES.findIndex((s) => s.key === currentStage);

  return (
    <div className="flex items-center gap-1">
      {STAGES.map((stage, i) => {
        const isComplete = i < currentIndex;
        const isCurrent = i === currentIndex;

        return (
          <div key={stage.key} className="flex items-center gap-1">
            {i > 0 && (
              <div
                className={cn(
                  "h-px w-3",
                  isComplete ? "bg-[#1B7A44]" : "bg-border"
                )}
              />
            )}
            <div
              className={cn(
                "flex items-center justify-center rounded-full text-[10px] font-medium",
                compact ? "h-5 w-5" : "h-6 w-6",
                isComplete && "bg-[#1B7A44] text-white",
                isCurrent && "bg-foreground text-background",
                !isComplete && !isCurrent && "bg-muted text-muted-foreground"
              )}
              title={stage.label}
            >
              {isComplete ? <Check className="h-3 w-3" /> : i + 1}
            </div>
            {!compact && (
              <span
                className={cn(
                  "text-xs whitespace-nowrap",
                  isCurrent ? "font-medium text-foreground" : "text-muted-foreground"
                )}
              >
                {stage.label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
