"use client";

interface ProgressRingProps {
  completed: number;
  total: number;
  size?: number;
}

export function ProgressRing({ completed, total, size = 20 }: ProgressRingProps) {
  const radius = (size - 3) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? completed / total : 0;
  const strokeDashoffset = circumference * (1 - progress);

  const color =
    progress === 1
      ? "stroke-[#1B7A44]"
      : progress > 0
        ? "stroke-[#2E6EA6]"
        : "stroke-muted-foreground/30";

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        className="text-muted-foreground/15"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={2}
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        className={color}
      />
    </svg>
  );
}
