"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KpiCard } from "@/components/shared/kpi-card";
import { AddContactDialog } from "@/components/crm/add-contact-dialog";
import { AddCompanyDialog } from "@/components/crm/add-company-dialog";
import { DeleteContactButton } from "@/components/crm/delete-contact-button";
import {
  CRM_RELATIONSHIP_TYPES,
  CRM_LIFECYCLE_STAGES,
  CRM_COMPANY_TYPES,
  COMPANY_TYPE_COLORS,
} from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { createClient } from "@/lib/supabase/client";
import {
  Users,
  Building2,
  Search,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  UserPlus,
  MessageSquare,
  Clock,
  TrendingUp,
  CheckCircle2,
  DollarSign,
  Trash2,
  Mail,
  Phone,
  Briefcase,
  Activity,
  Send,
  Plus,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────

export interface CrmContactRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  company_id: string | null;
  lifecycle_stage: string | null;
  dnc: boolean;
  source: string | null;
  assigned_to: string | null;
  assigned_to_name: string | null;
  assigned_to_initials: string | null;
  next_follow_up_date: string | null;
  last_contacted_at: string | null;
  created_at: string;
  activity_count: number;
  relationships: string[];
  notes: string | null;
  city: string | null;
  state: string | null;
}

export interface CompanyRowV2 {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  company_type: string;
  company_subtype: string | null;
  city: string | null;
  state: string | null;
  contact_count: number;
  file_count: number;
  active_deals: number;
  nda_created_date: string | null;
  nda_expiration_date: string | null;
  fee_agreement_on_file: boolean | null;
  is_active: boolean | null;
  notes: string | null;
}

interface TeamMember {
  id: string;
  full_name: string;
}

interface CrmV2PageProps {
  contacts: CrmContactRow[];
  companies: CompanyRowV2[];
  teamMembers: TeamMember[];
  currentUserId: string;
  isSuperAdmin?: boolean;
  initialView?: "contacts" | "companies";
}

// ── Color Maps ───────────────────────────────────────────────────────────

const REL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  borrower:        { bg: "bg-blue-50 dark:bg-blue-950/30",    text: "text-blue-600 dark:text-blue-400",     border: "border-blue-200 dark:border-blue-800" },
  investor:        { bg: "bg-green-50 dark:bg-green-950/30",  text: "text-green-600 dark:text-green-400",   border: "border-green-200 dark:border-green-800" },
  broker:          { bg: "bg-amber-50 dark:bg-amber-950/30",  text: "text-amber-600 dark:text-amber-400",   border: "border-amber-200 dark:border-amber-800" },
  lender:          { bg: "bg-purple-50 dark:bg-purple-950/30", text: "text-purple-600 dark:text-purple-400", border: "border-purple-200 dark:border-purple-800" },
  vendor:          { bg: "bg-gray-50 dark:bg-gray-950/30",    text: "text-gray-600 dark:text-gray-400",     border: "border-gray-200 dark:border-gray-700" },
  referral_partner: { bg: "bg-teal-50 dark:bg-teal-950/30",  text: "text-teal-600 dark:text-teal-400",     border: "border-teal-200 dark:border-teal-800" },
  other:           { bg: "bg-gray-50 dark:bg-gray-950/30",    text: "text-gray-600 dark:text-gray-400",     border: "border-gray-200 dark:border-gray-700" },
};

const STAGE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  uncontacted: { bg: "bg-gray-100 dark:bg-gray-800",   text: "text-gray-600 dark:text-gray-400",   dot: "bg-gray-500" },
  lead:        { bg: "bg-slate-100 dark:bg-slate-800",  text: "text-slate-600 dark:text-slate-400", dot: "bg-slate-500" },
  prospect:    { bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-700 dark:text-amber-400", dot: "bg-amber-500" },
  active:      { bg: "bg-green-100 dark:bg-green-900/40", text: "text-green-700 dark:text-green-400", dot: "bg-green-500" },
  past:        { bg: "bg-red-100 dark:bg-red-900/40",   text: "text-red-600 dark:text-red-400",     dot: "bg-red-500" },
};

// ── Primitives ───────────────────────────────────────────────────────────

function Avatar({ text, size = "sm" }: { text: string; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-6 w-6 text-[9px]",
    md: "h-8 w-8 text-[11px]",
    lg: "h-11 w-11 text-sm",
  };
  return (
    <div
      className={cn(
        "rounded-lg flex items-center justify-center font-semibold shrink-0",
        "bg-foreground/5 border border-foreground/10 text-foreground",
        sizeClasses[size]
      )}
    >
      {text}
    </div>
  );
}

function RelPill({ type }: { type: string }) {
  const label = CRM_RELATIONSHIP_TYPES.find((r) => r.value === type)?.label ?? type;
  const colors = REL_COLORS[type] ?? REL_COLORS.other;
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border",
        colors.bg,
        colors.text,
        colors.border
      )}
    >
      {label}
    </span>
  );
}

function StageDot({ stage }: { stage: string | null }) {
  if (!stage) return <span className="text-muted-foreground text-xs">—</span>;
  const label = CRM_LIFECYCLE_STAGES.find((s) => s.value === stage)?.label ?? stage;
  const colors = STAGE_COLORS[stage] ?? STAGE_COLORS.uncontacted;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
        colors.bg,
        colors.text
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", colors.dot)} />
      {label}
    </span>
  );
}

function CompanyStatusDot({ isActive }: { isActive: boolean | null }) {
  const active = isActive !== false;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
        active
          ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400"
          : "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400"
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", active ? "bg-green-500" : "bg-red-500")} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
}

function getNameInitials(fullName: string | null): string {
  if (!fullName) return "?";
  const parts = fullName.trim().split(/\s+/);
  return parts.map((p) => p[0]).join("").toUpperCase().slice(0, 2);
}

// ── Main Component ───────────────────────────────────────────────────────

export function CrmV2Page({
  contacts,
  companies,
  teamMembers,
  currentUserId,
  isSuperAdmin = false,
  initialView = "contacts",
}: CrmV2PageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // View state
  const [activeView, setActiveView] = useState<"contacts" | "companies">(initialView);

  // Drawer state
  const [selectedContact, setSelectedContact] = useState<CrmContactRow | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<CompanyRowV2 | null>(null);

  // Contact filters
  const [contactSearch, setContactSearch] = useState(searchParams.get("q") ?? "");
  const [relFilter, setRelFilter] = useState(searchParams.get("rel") ?? "all");
  const [stageFilter, setStageFilter] = useState(searchParams.get("stage") ?? "all");
  const [contactSortKey, setContactSortKey] = useState<string>("last_contacted_at");
  const [contactSortDir, setContactSortDir] = useState<"asc" | "desc">("desc");

  // Company filters
  const [companySearch, setCompanySearch] = useState("");
  const [companySortKey, setCompanySortKey] = useState<string>("name");
  const [companySortDir, setCompanySortDir] = useState<"asc" | "desc">("asc");

  // URL sync for filters
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeView !== "contacts") params.set("view", activeView);
    if (contactSearch) params.set("q", contactSearch);
    if (relFilter !== "all") params.set("rel", relFilter);
    if (stageFilter !== "all") params.set("stage", stageFilter);
    const str = params.toString();
    const newUrl = str ? `?${str}` : window.location.pathname;
    window.history.replaceState(null, "", newUrl);
  }, [activeView, contactSearch, relFilter, stageFilter]);

  // ── Contact Stats ────────────────────────────────────────────────────
  const contactStats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const contactedThisWeek = contacts.filter((c) => {
      if (!c.last_contacted_at) return false;
      return new Date(c.last_contacted_at) >= weekAgo;
    }).length;

    const needsFollowUp = contacts.filter((c) => {
      if (c.lifecycle_stage === "past") return false;
      if (!c.last_contacted_at) return true;
      return new Date(c.last_contacted_at) < thirtyDaysAgo;
    }).length;

    const pipeline = contacts.filter(
      (c) =>
        c.relationships.includes("borrower") &&
        c.lifecycle_stage !== "past"
    ).length;

    return { contactedThisWeek, needsFollowUp, pipeline };
  }, [contacts]);

  // ── Company Stats ────────────────────────────────────────────────────
  const companyStats = useMemo(() => {
    const active = companies.filter((c) => c.is_active !== false).length;
    const inactive = companies.length - active;
    return { active, inactive };
  }, [companies]);

  // ── Filter Contacts ──────────────────────────────────────────────────
  const filteredContacts = useMemo(() => {
    let result = [...contacts];

    if (contactSearch.trim()) {
      const q = contactSearch.toLowerCase();
      result = result.filter(
        (c) =>
          `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.company_name?.toLowerCase().includes(q) ||
          c.phone?.includes(q)
      );
    }

    if (relFilter !== "all") {
      result = result.filter((c) => c.relationships.includes(relFilter));
    }

    if (stageFilter !== "all") {
      result = result.filter((c) => c.lifecycle_stage === stageFilter);
    }

    // Sort
    result.sort((a, b) => {
      const key = contactSortKey as keyof CrmContactRow;
      let av = a[key];
      let bv = b[key];

      // Handle null values - push to end
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;

      if (typeof av === "string") av = av.toLowerCase() as never;
      if (typeof bv === "string") bv = bv.toLowerCase() as never;

      if (av < bv) return contactSortDir === "asc" ? -1 : 1;
      if (av > bv) return contactSortDir === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [contacts, contactSearch, relFilter, stageFilter, contactSortKey, contactSortDir]);

  // ── Filter Companies ─────────────────────────────────────────────────
  const filteredCompanies = useMemo(() => {
    let result = [...companies];

    if (companySearch.trim()) {
      const q = companySearch.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.company_type.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      const key = companySortKey as keyof CompanyRowV2;
      let av = a[key];
      let bv = b[key];

      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;

      if (typeof av === "string") av = av.toLowerCase() as never;
      if (typeof bv === "string") bv = bv.toLowerCase() as never;

      if (av < bv) return companySortDir === "asc" ? -1 : 1;
      if (av > bv) return companySortDir === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [companies, companySearch, companySortKey, companySortDir]);

  const hasContactFilters = contactSearch.trim() !== "" || relFilter !== "all" || stageFilter !== "all";

  function handleContactSort(key: string) {
    if (contactSortKey === key) {
      setContactSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setContactSortKey(key);
      setContactSortDir("asc");
    }
  }

  function handleCompanySort(key: string) {
    if (companySortKey === key) {
      setCompanySortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setCompanySortKey(key);
      setCompanySortDir("asc");
    }
  }

  function clearAllFilters() {
    setContactSearch("");
    setRelFilter("all");
    setStageFilter("all");
  }

  // Close drawer on escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSelectedContact(null);
        setSelectedCompany(null);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ── Sort Header ──────────────────────────────────────────────────────
  function SortHeader({
    label,
    sortKey,
    currentSort,
    currentDir,
    onSort,
    className,
  }: {
    label: string;
    sortKey: string;
    currentSort: string;
    currentDir: "asc" | "desc";
    onSort: (key: string) => void;
    className?: string;
  }) {
    const isActive = currentSort === sortKey;
    return (
      <th
        onClick={() => onSort(sortKey)}
        className={cn(
          "text-xs font-medium text-muted-foreground text-left px-4 py-2.5 cursor-pointer select-none whitespace-nowrap",
          className
        )}
      >
        <span className="inline-flex items-center gap-1">
          {label}
          {isActive ? (
            currentDir === "asc" ? (
              <ArrowUp className="h-3 w-3" />
            ) : (
              <ArrowDown className="h-3 w-3" />
            )
          ) : (
            <ArrowUpDown className="h-2.5 w-2.5 text-muted-foreground/40" />
          )}
        </span>
      </th>
    );
  }

  return (
    <div className="space-y-5">
      {/* View Toggle + Add Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {(
            [
              { key: "contacts" as const, label: "Contacts", icon: Users, count: contacts.length },
              { key: "companies" as const, label: "Companies", icon: Building2, count: companies.length },
            ] as const
          ).map((v) => (
            <button
              key={v.key}
              onClick={() => {
                setActiveView(v.key);
                setSelectedContact(null);
                setSelectedCompany(null);
              }}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                activeView === v.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted border border-border"
              )}
            >
              <v.icon className="h-3.5 w-3.5" />
              {v.label}
              <span
                className={cn(
                  "font-mono text-[11px] px-1.5 py-0.5 rounded-md",
                  activeView === v.key
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {v.count}
              </span>
            </button>
          ))}
        </div>

        {activeView === "contacts" ? (
          <AddContactDialog teamMembers={teamMembers} currentUserId={currentUserId} />
        ) : (
          <AddCompanyDialog />
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {activeView === "contacts" ? (
          <>
            <KpiCard
              title="Total Contacts"
              value={contacts.length.toString()}
              description="Active relationships"
              icon={<Users className="h-5 w-5" />}
            />
            <KpiCard
              title="Contacted This Week"
              value={contactStats.contactedThisWeek.toString()}
              description="In last 7 days"
              icon={<MessageSquare className="h-5 w-5" />}
            />
            <KpiCard
              title="Needs Follow-Up"
              value={contactStats.needsFollowUp.toString()}
              description="30+ days since contact"
              icon={<Clock className="h-5 w-5" />}
            />
            <KpiCard
              title="Pipeline"
              value={contactStats.pipeline.toString()}
              description="Borrower leads & prospects"
              icon={<TrendingUp className="h-5 w-5" />}
            />
          </>
        ) : (
          <>
            <KpiCard
              title="Total Companies"
              value={companies.length.toString()}
              description="Across all types"
              icon={<Building2 className="h-5 w-5" />}
            />
            <KpiCard
              title="Active"
              value={companyStats.active.toString()}
              description="Active relationships"
              icon={<CheckCircle2 className="h-5 w-5" />}
            />
            <KpiCard
              title="Lenders"
              value={companies.filter((c) => c.company_type === "lender").length.toString()}
              description="Lending partners"
              icon={<Building2 className="h-5 w-5" />}
            />
            <KpiCard
              title="Total Files"
              value={companies.reduce((s, c) => s + c.file_count, 0).toString()}
              description="Uploaded documents"
              icon={<DollarSign className="h-5 w-5" />}
            />
          </>
        )}
      </div>

      {/* Contacts View */}
      {activeView === "contacts" && (
        <div className="space-y-3">
          {/* Filter Bar */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative flex-1 min-w-[240px] max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                placeholder="Search contacts..."
                className="pl-9 h-9"
              />
              {contactSearch && (
                <button
                  onClick={() => setContactSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
            <Select value={relFilter} onValueChange={setRelFilter}>
              <SelectTrigger className="w-[170px] h-9 text-xs">
                <SelectValue placeholder="All Relationships" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Relationships</SelectItem>
                {CRM_RELATIONSHIP_TYPES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-[150px] h-9 text-xs">
                <SelectValue placeholder="All Stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {CRM_LIFECYCLE_STAGES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active Filter Chips */}
          {hasContactFilters && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-muted-foreground">Active:</span>
              {contactSearch && (
                <button
                  onClick={() => setContactSearch("")}
                  className="inline-flex items-center gap-1 text-xs text-foreground bg-muted rounded-md px-2.5 py-1 hover:bg-muted/80"
                >
                  &ldquo;{contactSearch}&rdquo; <X className="h-2.5 w-2.5" />
                </button>
              )}
              {relFilter !== "all" && (
                <button
                  onClick={() => setRelFilter("all")}
                  className="inline-flex items-center gap-1 text-xs text-foreground bg-muted rounded-md px-2.5 py-1 hover:bg-muted/80"
                >
                  {CRM_RELATIONSHIP_TYPES.find((r) => r.value === relFilter)?.label ?? relFilter}{" "}
                  <X className="h-2.5 w-2.5" />
                </button>
              )}
              {stageFilter !== "all" && (
                <button
                  onClick={() => setStageFilter("all")}
                  className="inline-flex items-center gap-1 text-xs text-foreground bg-muted rounded-md px-2.5 py-1 hover:bg-muted/80"
                >
                  {CRM_LIFECYCLE_STAGES.find((s) => s.value === stageFilter)?.label ?? stageFilter}{" "}
                  <X className="h-2.5 w-2.5" />
                </button>
              )}
              <button
                onClick={clearAllFilters}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Contacts Table */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <SortHeader label="Name" sortKey="first_name" currentSort={contactSortKey} currentDir={contactSortDir} onSort={handleContactSort} />
                    <th className="text-xs font-medium text-muted-foreground text-left px-4 py-2.5">Company</th>
                    <th className="text-xs font-medium text-muted-foreground text-left px-4 py-2.5">Relationships</th>
                    <th className="text-xs font-medium text-muted-foreground text-left px-4 py-2.5">Email</th>
                    <SortHeader label="Phone" sortKey="phone" currentSort={contactSortKey} currentDir={contactSortDir} onSort={handleContactSort} />
                    <SortHeader label="Stage" sortKey="lifecycle_stage" currentSort={contactSortKey} currentDir={contactSortDir} onSort={handleContactSort} />
                    <th className="text-xs font-medium text-muted-foreground text-left px-4 py-2.5">Assigned</th>
                    <SortHeader label="Last Contacted" sortKey="last_contacted_at" currentSort={contactSortKey} currentDir={contactSortDir} onSort={handleContactSort} />
                    {isSuperAdmin && (
                      <th className="text-xs font-medium text-muted-foreground text-center px-4 py-2.5 w-12" />
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.length === 0 ? (
                    <tr>
                      <td colSpan={isSuperAdmin ? 9 : 8} className="text-center py-16">
                        {hasContactFilters ? (
                          <div>
                            <Users className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                            <p className="text-sm font-medium text-muted-foreground">No contacts match your filters</p>
                            <button onClick={clearAllFilters} className="text-xs text-blue-600 dark:text-blue-400 mt-1 hover:underline">
                              Clear Filters
                            </button>
                          </div>
                        ) : (
                          <div>
                            <Users className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                            <p className="text-sm font-medium text-muted-foreground">No contacts yet</p>
                            <p className="text-xs text-muted-foreground mt-1">Add your first contact to start building your CRM</p>
                          </div>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredContacts.map((c, i) => (
                      <tr
                        key={c.id}
                        onClick={() => {
                          setSelectedContact(c);
                          setSelectedCompany(null);
                        }}
                        className={cn(
                          "cursor-pointer transition-colors hover:bg-muted/50",
                          i < filteredContacts.length - 1 && "border-b border-border/50"
                        )}
                      >
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            {c.first_name} {c.last_name}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {c.company_name || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {c.relationships.length > 0 ? (
                              c.relationships.map((r) => <RelPill key={r} type={r} />)
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground max-w-[200px] truncate">
                          {c.email || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                          {c.phone || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <StageDot stage={c.lifecycle_stage} />
                        </td>
                        <td className="px-4 py-3">
                          {c.assigned_to_name ? (
                            <div className="flex items-center gap-1.5">
                              <Avatar text={c.assigned_to_initials ?? getNameInitials(c.assigned_to_name)} size="sm" />
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {c.assigned_to_name.split(" ")[0]}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                          {c.last_contacted_at ? formatDate(c.last_contacted_at) : "—"}
                        </td>
                        {isSuperAdmin && (
                          <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <DeleteContactButton
                              contactId={c.id}
                              contactName={`${c.first_name} ${c.last_name}`}
                              variant="icon"
                            />
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Footer */}
            <div className="px-5 py-3 border-t flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Showing {filteredContacts.length} of {contacts.length} contacts
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                {filteredContacts.length} contact{filteredContacts.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Companies View */}
      {activeView === "companies" && (
        <div className="space-y-3">
          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={companySearch}
              onChange={(e) => setCompanySearch(e.target.value)}
              placeholder="Search companies..."
              className="pl-9 h-9"
            />
            {companySearch && (
              <button
                onClick={() => setCompanySearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Companies Table */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <SortHeader label="Company" sortKey="name" currentSort={companySortKey} currentDir={companySortDir} onSort={handleCompanySort} />
                    <SortHeader label="Type" sortKey="company_type" currentSort={companySortKey} currentDir={companySortDir} onSort={handleCompanySort} />
                    <SortHeader label="Contacts" sortKey="contact_count" currentSort={companySortKey} currentDir={companySortDir} onSort={handleCompanySort} className="text-right" />
                    <SortHeader label="Files" sortKey="file_count" currentSort={companySortKey} currentDir={companySortDir} onSort={handleCompanySort} className="text-right" />
                    <th className="text-xs font-medium text-muted-foreground text-left px-4 py-2.5">Location</th>
                    <SortHeader label="Status" sortKey="is_active" currentSort={companySortKey} currentDir={companySortDir} onSort={handleCompanySort} />
                    <th className="text-xs font-medium text-muted-foreground text-center px-4 py-2.5 w-12" />
                  </tr>
                </thead>
                <tbody>
                  {filteredCompanies.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16">
                        <Building2 className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                        <p className="text-sm font-medium text-muted-foreground">No companies found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredCompanies.map((c, i) => (
                      <tr
                        key={c.id}
                        onClick={() => {
                          setSelectedCompany(c);
                          setSelectedContact(null);
                        }}
                        className={cn(
                          "cursor-pointer transition-colors hover:bg-muted/50",
                          i < filteredCompanies.length - 1 && "border-b border-border/50"
                        )}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 flex items-center justify-center shrink-0">
                              <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                              {c.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            {CRM_COMPANY_TYPES.find((t) => t.value === c.company_type)?.label ?? c.company_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-sm text-foreground text-right">
                          {c.contact_count}
                        </td>
                        <td className="px-4 py-3 font-mono text-sm text-foreground text-right">
                          {c.file_count}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                          {c.city && c.state ? `${c.city}, ${c.state}` : c.city || c.state || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <CompanyStatusDot isActive={c.is_active} />
                        </td>
                        <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <Link href={`/admin/crm/companies/${c.id}`}>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
                              <Briefcase className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Footer */}
            <div className="px-5 py-3 border-t flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Showing {filteredCompanies.length} of {companies.length} companies
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Contact Drawer */}
      {selectedContact && (
        <>
          <div
            onClick={() => setSelectedContact(null)}
            className="fixed inset-0 bg-black/15 dark:bg-black/40 z-40 animate-in fade-in duration-200"
          />
          <ContactDrawer
            contact={selectedContact}
            onClose={() => setSelectedContact(null)}
            isSuperAdmin={isSuperAdmin}
          />
        </>
      )}

      {/* Company Drawer */}
      {selectedCompany && (
        <>
          <div
            onClick={() => setSelectedCompany(null)}
            className="fixed inset-0 bg-black/15 dark:bg-black/40 z-40 animate-in fade-in duration-200"
          />
          <CompanyDrawer
            company={selectedCompany}
            onClose={() => setSelectedCompany(null)}
          />
        </>
      )}
    </div>
  );
}

// ── Contact Drawer ─────────────────────────────────────────────────────

function ContactDrawer({
  contact,
  onClose,
  isSuperAdmin,
}: {
  contact: CrmContactRow;
  onClose: () => void;
  isSuperAdmin: boolean;
}) {
  const [tab, setTab] = useState<"overview" | "activity" | "notes">("overview");
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [activities, setActivities] = useState<Array<{
    id: string;
    activity_type: string;
    subject: string | null;
    description: string | null;
    performed_by_name: string | null;
    created_at: string;
  }>>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const initials = getInitials(contact.first_name, contact.last_name);

  // Fetch activities when activity tab is opened
  useEffect(() => {
    if (tab === "activity" || tab === "notes") {
      setLoadingActivity(true);
      const supabase = createClient();
      supabase
        .from("crm_activities")
        .select("id, activity_type, subject, description, performed_by_name, created_at")
        .eq("contact_id", contact.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(50)
        .then(({ data }) => {
          setActivities(data ?? []);
          setLoadingActivity(false);
        });
    }
  }, [tab, contact.id]);

  async function handleSaveNote() {
    if (!noteText.trim()) return;
    setSavingNote(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("crm_activities").insert({
        contact_id: contact.id,
        activity_type: "note",
        subject: "Note added",
        description: noteText.trim(),
      });
      if (error) throw error;
      toast({ title: "Note saved" });
      setNoteText("");
      // Refresh activities
      const { data } = await supabase
        .from("crm_activities")
        .select("id, activity_type, subject, description, performed_by_name, created_at")
        .eq("contact_id", contact.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(50);
      setActivities(data ?? []);
    } catch (err: unknown) {
      toast({
        title: "Error saving note",
        description: err instanceof Error ? err.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setSavingNote(false);
    }
  }

  const tabs = ["overview", "activity", "notes"] as const;

  return (
    <div className="fixed top-0 right-0 bottom-0 w-full sm:w-[480px] bg-card border-l z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="px-6 py-5 border-b">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <Avatar text={initials} size="lg" />
            <div>
              <div className="text-lg font-bold text-foreground">
                {contact.first_name} {contact.last_name}
              </div>
              <div className="text-sm text-muted-foreground">{contact.company_name || "—"}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {contact.relationships.map((r) => (
            <RelPill key={r} type={r} />
          ))}
          <StageDot stage={contact.lifecycle_stage} />
        </div>
        <div className="mt-3 space-y-1">
          {contact.email && (
            <div className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400">
              <Mail className="h-3.5 w-3.5" />
              {contact.email}
            </div>
          )}
          {contact.phone && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              {contact.phone}
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="flex border-b">
        {[
          { l: "Activities", v: contact.activity_count.toString() },
          { l: "Stage", v: CRM_LIFECYCLE_STAGES.find((s) => s.value === contact.lifecycle_stage)?.label ?? "—" },
          { l: "Location", v: contact.city && contact.state ? `${contact.city}, ${contact.state}` : contact.city || contact.state || "—" },
        ].map((s, i) => (
          <div
            key={s.l}
            className={cn(
              "flex-1 px-5 py-3 text-center",
              i < 2 && "border-r"
            )}
          >
            <div className="text-[11px] text-muted-foreground">{s.l}</div>
            <div className="font-mono text-sm font-semibold text-foreground mt-0.5">{s.v}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 px-6 border-b">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "text-sm font-medium py-2.5 border-b-2 capitalize transition-colors",
              tab === t
                ? "text-foreground border-foreground"
                : "text-muted-foreground border-transparent hover:text-foreground"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-6">
        {tab === "overview" && (
          <div className="space-y-4">
            {contact.notes && (
              <div className="bg-muted/50 rounded-lg p-3.5">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Notes</div>
                <div className="text-sm text-foreground leading-relaxed">{contact.notes}</div>
              </div>
            )}
            {contact.assigned_to_name && (
              <div className="flex items-center justify-between py-2.5 border-b">
                <span className="text-sm text-muted-foreground">Assigned To</span>
                <div className="flex items-center gap-2">
                  <Avatar text={contact.assigned_to_initials ?? getNameInitials(contact.assigned_to_name)} size="sm" />
                  <span className="text-sm font-medium text-foreground">{contact.assigned_to_name}</span>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between py-2.5 border-b">
              <span className="text-sm text-muted-foreground">Last Contacted</span>
              <span className="font-mono text-sm text-foreground">
                {contact.last_contacted_at ? formatDate(contact.last_contacted_at) : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between py-2.5 border-b">
              <span className="text-sm text-muted-foreground">Location</span>
              <span className="text-sm text-foreground">
                {contact.city && contact.state ? `${contact.city}, ${contact.state}` : contact.city || contact.state || "—"}
              </span>
            </div>
            {contact.source && (
              <div className="flex items-center justify-between py-2.5 border-b">
                <span className="text-sm text-muted-foreground">Source</span>
                <span className="text-sm text-foreground capitalize">{contact.source.replace(/_/g, " ")}</span>
              </div>
            )}
            {contact.next_follow_up_date && (
              <div className="flex items-center justify-between py-2.5 border-b">
                <span className="text-sm text-muted-foreground">Next Follow-Up</span>
                <span className="font-mono text-sm text-foreground">
                  {formatDate(contact.next_follow_up_date)}
                </span>
              </div>
            )}
          </div>
        )}

        {tab === "activity" && (
          <div>
            {loadingActivity ? (
              <div className="text-center py-10">
                <div className="text-sm text-muted-foreground">Loading activities...</div>
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-10">
                <Activity className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm font-medium text-muted-foreground">No activity yet</p>
                <p className="text-xs text-muted-foreground mt-1">Interactions will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activities.map((a) => (
                  <div key={a.id} className="flex gap-3 py-2 border-b border-border/50 last:border-0">
                    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-foreground">{a.subject || a.activity_type}</div>
                      {a.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{a.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-muted-foreground">
                          {a.performed_by_name || "System"}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {formatDate(a.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "notes" && (
          <div>
            <Textarea
              placeholder="Add a note..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="min-h-[80px] resize-y text-sm"
            />
            <div className="mt-2 flex justify-end">
              <Button
                size="sm"
                disabled={!noteText.trim() || savingNote}
                onClick={handleSaveNote}
                className="gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                {savingNote ? "Saving..." : "Save Note"}
              </Button>
            </div>

            {/* Previous notes (from activities) */}
            {activities.filter((a) => a.activity_type === "note").length > 0 && (
              <div className="mt-6 space-y-3">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Previous Notes</div>
                {activities
                  .filter((a) => a.activity_type === "note")
                  .map((a) => (
                    <div key={a.id} className="bg-muted/50 rounded-lg p-3">
                      <p className="text-sm text-foreground">{a.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[11px] text-muted-foreground">{a.performed_by_name || "—"}</span>
                        <span className="text-[11px] text-muted-foreground font-mono">{formatDate(a.created_at)}</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="px-6 py-3.5 border-t flex gap-2">
        {contact.email && (
          <Button variant="outline" size="sm" className="flex-1 gap-1.5 justify-center" asChild>
            <a href={`mailto:${contact.email}`}>
              <Mail className="h-3.5 w-3.5" />
              Email
            </a>
          </Button>
        )}
        {contact.phone && (
          <Button variant="outline" size="sm" className="flex-1 gap-1.5 justify-center" asChild>
            <a href={`tel:${contact.phone}`}>
              <Phone className="h-3.5 w-3.5" />
              Call
            </a>
          </Button>
        )}
        <Button size="sm" className="flex-1 gap-1.5 justify-center" asChild>
          <Link href={`/admin/crm/${contact.id}`}>
            <Briefcase className="h-3.5 w-3.5" />
            Full Profile
          </Link>
        </Button>
      </div>
    </div>
  );
}

// ── Company Drawer ─────────────────────────────────────────────────────

function CompanyDrawer({
  company,
  onClose,
}: {
  company: CompanyRowV2;
  onClose: () => void;
}) {
  return (
    <div className="fixed top-0 right-0 bottom-0 w-full sm:w-[480px] bg-card border-l z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="px-6 py-5 border-b">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-lg font-bold text-foreground">{company.name}</div>
              <div className="text-sm text-muted-foreground">
                {CRM_COMPANY_TYPES.find((t) => t.value === company.company_type)?.label ?? company.company_type}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="flex border-b">
        {[
          { l: "Contacts", v: company.contact_count.toString() },
          { l: "Files", v: company.file_count.toString() },
          { l: "Status", v: company.is_active !== false ? "Active" : "Inactive" },
        ].map((s, i) => (
          <div
            key={s.l}
            className={cn(
              "flex-1 px-5 py-3 text-center",
              i < 2 && "border-r"
            )}
          >
            <div className="text-[11px] text-muted-foreground">{s.l}</div>
            <div className="font-mono text-sm font-semibold text-foreground mt-0.5">{s.v}</div>
          </div>
        ))}
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-1">
          {[
            { l: "Location", v: company.city && company.state ? `${company.city}, ${company.state}` : company.city || company.state || "—" },
            { l: "Status", v: company.is_active !== false ? "Active" : "Inactive" },
            { l: "Website", v: company.website || "—", link: !!company.website },
            { l: "Phone", v: company.phone || "—" },
            { l: "Email", v: company.email || "—" },
          ].map((f) => (
            <div key={f.l} className="flex items-center justify-between py-2.5 border-b">
              <span className="text-sm text-muted-foreground">{f.l}</span>
              <span
                className={cn(
                  "text-sm font-medium",
                  f.link ? "text-blue-600 dark:text-blue-400" : "text-foreground"
                )}
              >
                {f.v}
              </span>
            </div>
          ))}
        </div>

        {company.notes && (
          <div className="mt-6 bg-muted/50 rounded-lg p-3.5">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Notes</div>
            <div className="text-sm text-foreground leading-relaxed">{company.notes}</div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3.5 border-t flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 gap-1.5 justify-center" asChild>
          <Link href={`/admin/crm/companies/${company.id}`}>
            <Building2 className="h-3.5 w-3.5" />
            Full Details
          </Link>
        </Button>
      </div>
    </div>
  );
}
