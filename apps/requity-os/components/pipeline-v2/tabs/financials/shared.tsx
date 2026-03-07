"use client";

import { cn } from "@/lib/utils";

export function n(v: unknown): number {
  if (v == null || v === "") return 0;
  const num = Number(v);
  return isNaN(num) ? 0 : num;
}

export function fmtCurrency(v: unknown): string {
  const num = n(v);
  if (num === 0) return "$0";
  return "$" + num.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export function fmtPct(v: unknown): string {
  const num = n(v);
  return (num * 100).toFixed(1) + "%";
}

export function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full border-collapse">{children}</table>
    </div>
  );
}

export function TH({
  children,
  align,
}: {
  children?: React.ReactNode;
  align?: "right" | "left";
}) {
  return (
    <th
      className={cn(
        "text-[11px] uppercase tracking-wider font-semibold px-3 py-2 text-muted-foreground bg-muted/50",
        align === "right" ? "text-right" : "text-left"
      )}
    >
      {children}
    </th>
  );
}

export function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
      {children}
    </div>
  );
}

export function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    occupied: "text-green-500",
    vacant: "text-amber-500",
    down: "text-red-500",
    model: "text-blue-500",
  };
  const dotColors: Record<string, string> = {
    occupied: "bg-green-500",
    vacant: "bg-amber-500",
    down: "bg-red-500",
    model: "bg-blue-500",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        colors[status] ?? "text-muted-foreground"
      )}
    >
      <span
        className={cn(
          "inline-block h-1.5 w-1.5 rounded-full",
          dotColors[status] ?? "bg-muted-foreground"
        )}
      />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
