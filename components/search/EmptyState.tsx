"use client";

import { Search, Clock, X } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  getRecentSearches,
  clearRecentSearches,
  getQuickLinks,
} from "@/lib/search-utils";

interface EmptyStateProps {
  role: string;
  onSelectRecentSearch: (query: string) => void;
  onClose: () => void;
}

export function EmptyState({
  role,
  onSelectRecentSearch,
  onClose,
}: EmptyStateProps) {
  const router = useRouter();
  const recentSearches = getRecentSearches();
  const quickLinks = getQuickLinks(role);

  return (
    <div className="px-4 py-4">
      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Recent
            </h3>
            <button
              type="button"
              onClick={clearRecentSearches}
              className="text-[10px] text-slate-400 hover:text-slate-600 transition-colors"
            >
              Clear
            </button>
          </div>
          <div className="space-y-0.5">
            {recentSearches.map((search) => (
              <button
                key={search}
                type="button"
                onClick={() => onSelectRecentSearch(search)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span className="truncate">{search}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Navigation */}
      <div className="mb-4">
        <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
          Quick Navigation
        </h3>
        <div className="grid grid-cols-2 gap-1">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.href}
                type="button"
                onClick={() => {
                  router.push(link.href);
                  onClose();
                }}
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <Icon className="h-4 w-4 text-slate-400" />
                {link.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Empty illustration */}
      <div className="flex flex-col items-center py-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 mb-3">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <p className="text-sm text-slate-500">
          Search across your entire portal
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Loans, borrowers, investors, documents, and more
        </p>
      </div>
    </div>
  );
}

// No results state
export function NoResults({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center py-10 text-center px-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 mb-3">
        <X className="h-5 w-5 text-slate-400" />
      </div>
      <p className="text-sm text-slate-600">
        No results for &ldquo;{query.slice(0, 50)}&rdquo;
      </p>
      <p className="text-xs text-slate-400 mt-1">
        Try a different search term or check your spelling
      </p>
    </div>
  );
}
