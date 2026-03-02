"use client";

import Link from "next/link";
import * as LucideIcons from "lucide-react";
import type { SOPCategory } from "@/lib/sops/types";

interface SOPCategoryCardProps {
  category: SOPCategory;
  sopCount: number;
}

function getIcon(iconName: string | null) {
  if (!iconName) return LucideIcons.FolderOpen;
  const key = iconName
    .split(/[-_]/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("") as keyof typeof LucideIcons;
  const Icon = LucideIcons[key];
  return typeof Icon === "function"
    ? (Icon as React.ElementType)
    : LucideIcons.FolderOpen;
}

export function SOPCategoryCard({ category, sopCount }: SOPCategoryCardProps) {
  const Icon = getIcon(category.icon);

  return (
    <Link
      href={`/sops?category=${category.slug}`}
      className="group block rounded-xl border border-gold/15 bg-navy-mid p-5 shadow-[0_4px_24px_rgba(0,0,0,0.3)] transition hover:border-gold/30 hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
    >
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10">
          <Icon className="h-5 w-5 text-gold" />
        </div>
        <h3 className="font-display text-lg font-semibold text-[#FAFAF8]">
          {category.name}
        </h3>
      </div>
      {category.description && (
        <p className="mb-3 text-sm leading-relaxed text-[#C4C0B8]">
          {category.description}
        </p>
      )}
      <div className="text-xs font-medium text-gold">
        {sopCount} {sopCount === 1 ? "SOP" : "SOPs"}
      </div>
    </Link>
  );
}
