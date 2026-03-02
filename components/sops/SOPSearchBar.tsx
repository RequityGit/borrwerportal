"use client";

import { Search, Loader2 } from "lucide-react";
import Link from "next/link";
import { useSOPSearch } from "@/hooks/useSOPSearch";

export function SOPSearchBar() {
  const { query, setQuery, results, loading } = useSOPSearch();

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8A8680]" />
        <input
          type="text"
          placeholder="Search SOPs..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl border border-navy-light bg-navy px-12 py-3 text-[#FAFAF8] placeholder-[#8A8680] outline-none transition focus:border-gold focus:shadow-[0_0_0_3px_rgba(197,151,91,0.15)]"
        />
        {loading && (
          <Loader2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-gold" />
        )}
      </div>

      {query.trim() && results.length > 0 && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-gold/15 bg-navy-mid shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <div className="p-2">
            {results.slice(0, 8).map((sop) => (
              <Link
                key={sop.id}
                href={`/sops/${sop.slug}`}
                className="block rounded-lg px-3 py-2 transition hover:bg-navy-light"
                onClick={() => setQuery("")}
              >
                <div className="font-medium text-[#FAFAF8]">{sop.title}</div>
                {sop.summary && (
                  <p className="mt-0.5 line-clamp-1 text-xs text-[#C4C0B8]">
                    {sop.summary}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {query.trim() && !loading && results.length === 0 && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-gold/15 bg-navy-mid p-4 text-center shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <p className="text-sm text-[#C4C0B8]">
            No SOPs found for &ldquo;{query}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}
