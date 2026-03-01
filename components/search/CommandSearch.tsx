"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useSearch, type SearchResult as SearchResultType } from "@/hooks/useSearch";
import { SearchResult } from "./SearchResult";
import { CategoryChips } from "./CategoryChips";
import { EmptyState, NoResults } from "./EmptyState";
import { QuickActions } from "./QuickActions";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getCategoriesForRole,
  getEntityUrl,
  saveRecentSearch,
  type SearchEntityType,
} from "@/lib/search-utils";

interface CommandSearchProps {
  role: string;
}

export function CommandSearch({ role }: CommandSearchProps) {
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { query, setQuery, results, loading, activeFilter, setActiveFilter } =
    useSearch();

  const categories = useMemo(() => getCategoriesForRole(role), [role]);

  // Compute result counts per entity type for chip badges
  const resultCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const result of results) {
      const type = result.entity_type;
      counts[type] = (counts[type] || 0) + 1;
      // Also aggregate for grouped categories (e.g. "borrower" chip covers borrower + borrower_entity)
    }
    // Map to chip keys
    const chipCounts: Record<string, number> = {};
    for (const cat of categories) {
      if (cat.key) {
        chipCounts[cat.key] = cat.entityTypes.reduce(
          (sum, et) => sum + (counts[et] || 0),
          0
        );
      }
    }
    return chipCounts;
  }, [results, categories]);

  // Global keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      // Save search query if we had one
      if (query.trim()) {
        saveRecentSearch(query.trim());
      }
      setQuery("");
      setActiveFilter(null);
    }
  }, [open, query, setQuery, setActiveFilter]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Navigate to result
  const navigateToResult = useCallback(
    (result: SearchResultType) => {
      const url = getEntityUrl(
        result.entity_type as SearchEntityType,
        result.id,
        result.metadata,
        role
      );
      if (query.trim()) {
        saveRecentSearch(query.trim());
      }
      setOpen(false);
      router.push(url);
    },
    [role, query, router]
  );

  // Keyboard navigation within results
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === "Enter" && results.length > 0) {
        e.preventDefault();
        navigateToResult(results[selectedIndex]);
      }
    },
    [results, selectedIndex, navigateToResult]
  );

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      );
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  // Handle filter change — map chip key to entity_filter value
  const handleFilterChange = useCallback(
    (filterKey: string | null) => {
      if (!filterKey) {
        setActiveFilter(null);
        return;
      }
      const category = categories.find((c) => c.key === filterKey);
      if (category && category.entityTypes.length > 0) {
        setActiveFilter(category.entityTypes.join(","));
      } else {
        setActiveFilter(filterKey);
      }
    },
    [categories, setActiveFilter]
  );

  // Derive active chip key from activeFilter
  const activeChipKey = useMemo(() => {
    if (!activeFilter) return null;
    const filterTypes = activeFilter.split(",");
    const matchedCategory = categories.find(
      (c) =>
        c.key &&
        c.entityTypes.length === filterTypes.length &&
        c.entityTypes.every((et) => filterTypes.includes(et))
    );
    return matchedCategory?.key ?? activeFilter;
  }, [activeFilter, categories]);

  const selectedResult = results[selectedIndex] || null;

  return (
    <>
      {/* Search trigger button in topbar */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-slate-200 bg-slate-100 px-1.5 font-mono text-[10px] font-medium text-slate-500">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Search dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-2xl gap-0 overflow-hidden p-0 sm:rounded-xl"
          onKeyDown={handleKeyDown}
        >
          <DialogTitle className="sr-only">Universal Search</DialogTitle>

          {/* Search input */}
          <div className="flex items-center border-b border-slate-200 px-4">
            <Search className="mr-3 h-5 w-5 shrink-0 text-slate-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search loans, borrowers, investors, documents..."
              className="flex h-12 w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
            {loading && (
              <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin text-slate-400" />
            )}
          </div>

          {/* Category chips — show when there's a query */}
          {query.trim() && (
            <CategoryChips
              categories={categories}
              activeFilter={activeChipKey}
              onFilterChange={handleFilterChange}
              resultCounts={resultCounts}
            />
          )}

          {/* Results area */}
          <div className="max-h-[60vh] overflow-y-auto" ref={listRef}>
            {/* Empty state: no query */}
            {!query.trim() && (
              <EmptyState
                role={role}
                onSelectRecentSearch={(search) => setQuery(search)}
                onClose={() => setOpen(false)}
              />
            )}

            {/* Loading skeleton */}
            {query.trim() && loading && results.length === 0 && (
              <div className="space-y-1 p-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            )}

            {/* No results */}
            {query.trim() && !loading && results.length === 0 && (
              <NoResults query={query} />
            )}

            {/* Results list */}
            {results.length > 0 && (
              <div className="py-1">
                {results.map((result, index) => (
                  <div key={`${result.entity_type}-${result.id}`} data-index={index}>
                    <SearchResult
                      id={result.id}
                      entityType={result.entity_type as SearchEntityType}
                      metadata={result.metadata}
                      updatedAt={result.updated_at}
                      isSelected={index === selectedIndex}
                      onClick={() => navigateToResult(result)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions for selected result */}
          {selectedResult && results.length > 0 && (
            <QuickActions
              entityType={selectedResult.entity_type as SearchEntityType}
              id={selectedResult.id}
              metadata={selectedResult.metadata}
              role={role}
              onClose={() => setOpen(false)}
            />
          )}

          {/* Footer with keyboard shortcuts */}
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-2">
            <div className="flex items-center gap-3 text-[10px] text-slate-400">
              <span>
                <kbd className="rounded border border-slate-200 bg-slate-100 px-1 py-0.5 font-mono">↑↓</kbd>{" "}
                Navigate
              </span>
              <span>
                <kbd className="rounded border border-slate-200 bg-slate-100 px-1 py-0.5 font-mono">↵</kbd>{" "}
                Open
              </span>
              <span>
                <kbd className="rounded border border-slate-200 bg-slate-100 px-1 py-0.5 font-mono">esc</kbd>{" "}
                Close
              </span>
            </div>
            {results.length > 0 && (
              <span className="text-[10px] text-slate-400">
                {results.length} result{results.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
