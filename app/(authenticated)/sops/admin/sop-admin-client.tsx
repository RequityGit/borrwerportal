"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  HelpCircle,
  AlertTriangle,
  MessageCircle,
  ArrowLeft,
  Eye,
  X,
  Check,
  Plus,
} from "lucide-react";
import { sopClient } from "@/lib/sops/client";

interface FlagWithSOP {
  id: string;
  sop_id: string;
  flag_type: string;
  description: string | null;
  status: string;
  created_at: string;
  sops: { title: string; slug: string } | null;
}

interface UncoveredQuestion {
  id: string;
  question: string;
  created_at: string;
}

interface TopViewedSOP {
  path: string;
  slug: string;
  count: number;
}

interface SOPAdminClientProps {
  totalPublished: number;
  questionsAsked: number;
  unansweredQuestions: number;
  openFlagCount: number;
  flags: FlagWithSOP[];
  uncoveredQuestions: UncoveredQuestion[];
  topViewed: TopViewedSOP[];
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function MetricCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-gold/15 bg-navy-mid p-5 shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#8A8680]">{title}</p>
          <p className="mt-1 text-3xl font-bold text-[#FAFAF8]">{value}</p>
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export function SOPAdminClient({
  totalPublished,
  questionsAsked,
  unansweredQuestions,
  openFlagCount,
  flags,
  uncoveredQuestions,
  topViewed,
}: SOPAdminClientProps) {
  const router = useRouter();

  async function handleDismissFlag(flagId: string) {
    const supabase = sopClient();
    await supabase
      .from("sop_staleness_flags")
      .update({ status: "dismissed" })
      .eq("id", flagId);
    router.refresh();
  }

  async function handleResolveFlag(flagId: string) {
    const supabase = sopClient();
    await supabase
      .from("sop_staleness_flags")
      .update({
        status: "resolved",
        resolved_at: new Date().toISOString(),
      })
      .eq("id", flagId);
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-navy-DEFAULT">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Header */}
        <Link
          href="/sops"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-[#8A8680] hover:text-gold transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Knowledge Base
        </Link>

        <h1 className="mb-8 font-display text-3xl font-semibold text-[#FAFAF8]">
          SOP Analytics &amp; Management
        </h1>

        {/* Metrics Row */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Published SOPs"
            value={totalPublished}
            icon={FileText}
            color="bg-[#2D8A56]/15 text-[#2D8A56]"
          />
          <MetricCard
            title="Questions (30d)"
            value={questionsAsked}
            icon={MessageCircle}
            color="bg-gold/15 text-gold"
          />
          <MetricCard
            title="Unanswered"
            value={unansweredQuestions}
            icon={HelpCircle}
            color="bg-[#D4952B]/15 text-[#D4952B]"
          />
          <MetricCard
            title="Stale Flags"
            value={openFlagCount}
            icon={AlertTriangle}
            color="bg-[#C0392B]/15 text-[#C0392B]"
          />
        </div>

        {/* Staleness Flags Table */}
        <section className="mb-8">
          <h2 className="mb-4 font-display text-xl font-semibold text-[#FAFAF8]">
            Open Staleness Flags
          </h2>
          {flags.length > 0 ? (
            <div className="rounded-xl border border-gold/15 bg-navy-mid overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-navy-light">
                    <th className="px-4 py-3 text-left font-medium text-[#8A8680]">
                      SOP
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-[#8A8680]">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-[#8A8680]">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-[#8A8680]">
                      Flagged
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-[#8A8680]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {flags.map((flag) => (
                    <tr
                      key={flag.id}
                      className="border-b border-navy-light/50 last:border-b-0"
                    >
                      <td className="px-4 py-3">
                        {flag.sops ? (
                          <Link
                            href={`/sops/${flag.sops.slug}`}
                            className="text-[#FAFAF8] hover:text-gold transition"
                          >
                            {flag.sops.title}
                          </Link>
                        ) : (
                          <span className="text-[#8A8680]">Unknown</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-[#C0392B]/10 px-2 py-0.5 text-xs font-medium text-[#C0392B]">
                          {flag.flag_type.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#C4C0B8]">
                        {flag.description ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-[#8A8680]">
                        {formatDate(flag.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {flag.sops && (
                            <Link
                              href={`/sops/${flag.sops.slug}`}
                              className="rounded-md p-1.5 text-[#8A8680] transition hover:bg-navy-light hover:text-[#FAFAF8]"
                              title="Review"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                          )}
                          <button
                            onClick={() => handleResolveFlag(flag.id)}
                            className="rounded-md p-1.5 text-[#2D8A56] transition hover:bg-[#2D8A56]/10"
                            title="Resolve"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDismissFlag(flag.id)}
                            className="rounded-md p-1.5 text-[#8A8680] transition hover:bg-navy-light hover:text-[#C0392B]"
                            title="Dismiss"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-gold/10 bg-navy-mid p-6 text-center">
              <p className="text-[#C4C0B8]">
                No open staleness flags. All SOPs are up to date.
              </p>
            </div>
          )}
        </section>

        {/* Question Gap Analysis */}
        <section className="mb-8">
          <h2 className="mb-4 font-display text-xl font-semibold text-[#FAFAF8]">
            Questions Without SOP Coverage
          </h2>
          {uncoveredQuestions.length > 0 ? (
            <div className="rounded-xl border border-gold/15 bg-navy-mid overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-navy-light">
                    <th className="px-4 py-3 text-left font-medium text-[#8A8680]">
                      Question
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-[#8A8680]">
                      Asked
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-[#8A8680]">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {uncoveredQuestions.map((q) => (
                    <tr
                      key={q.id}
                      className="border-b border-navy-light/50 last:border-b-0"
                    >
                      <td className="px-4 py-3 text-[#C4C0B8]">
                        {q.question}
                      </td>
                      <td className="px-4 py-3 text-[#8A8680] whitespace-nowrap">
                        {formatDate(q.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/sops/new?prefill=${encodeURIComponent(q.question)}`}
                          className="inline-flex items-center gap-1 rounded-md bg-gold/10 px-2 py-1 text-xs font-medium text-gold transition hover:bg-gold/20"
                        >
                          <Plus className="h-3 w-3" />
                          Generate SOP
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-gold/10 bg-navy-mid p-6 text-center">
              <p className="text-[#C4C0B8]">
                All questions have SOP coverage. Great job!
              </p>
            </div>
          )}
        </section>

        {/* Most Viewed SOPs */}
        <section>
          <h2 className="mb-4 font-display text-xl font-semibold text-[#FAFAF8]">
            Most Viewed SOPs
          </h2>
          {topViewed.length > 0 ? (
            <div className="rounded-xl border border-gold/15 bg-navy-mid overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-navy-light">
                    <th className="px-4 py-3 text-left font-medium text-[#8A8680]">
                      SOP Path
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-[#8A8680]">
                      Views
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topViewed.map((v) => (
                    <tr
                      key={v.path}
                      className="border-b border-navy-light/50 last:border-b-0"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={v.path}
                          className="text-[#FAFAF8] hover:text-gold transition"
                        >
                          {v.slug}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-gold">
                        {v.count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-gold/10 bg-navy-mid p-6 text-center">
              <p className="text-[#C4C0B8]">
                No SOP view data yet. Views will appear as users browse the
                Knowledge Base.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
