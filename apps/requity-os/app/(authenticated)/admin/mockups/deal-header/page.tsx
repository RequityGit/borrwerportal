"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Layers,
  Clock,
  ArrowUpRight,
  Phone,
  Mail,
  Shield,
  Calendar,
  CalendarDays,
  Users,
  Plus,
  FileText,
  X,
  ExternalLink,
  MoreHorizontal,
  ChevronDown,
  CheckCircle2,
  Circle,
} from "lucide-react";

// ─── Sample Data ───

const SAMPLE_DEAL = {
  name: "221 Riggs Road",
  deal_number: "RQ-0042",
  stage: "analysis",
  asset_class: "Manufactured Housing",
  amount: 850000,
  expected_close_date: "2026-03-26",
  created_at: "2026-03-13",
  updated_at: "2026-03-13",
  actual_close_date: null,
  google_drive_folder_url: "https://drive.google.com/example",
  days_in_stage: 12,
  capital_side: "debt",
};

const SAMPLE_TEAM = [
  { id: "1", full_name: "Dylan Marma", role: "Lead" },
  { id: "2", full_name: "Luis Espinal", role: "Originator" },
  { id: "3", full_name: "Estefania Espinal", role: "Ops" },
];

const ALL_MEMBERS = [
  { id: "4", full_name: "Jet Rodriguez" },
  { id: "5", full_name: "Grethel Santos" },
  { id: "6", full_name: "Mike Chen" },
];

const STAGES = [
  { key: "lead", label: "Lead" },
  { key: "analysis", label: "Analysis" },
  { key: "processing", label: "Processing" },
  { key: "underwriting", label: "Underwriting" },
  { key: "closing", label: "Closing" },
  { key: "closed", label: "Closed" },
];

const FIELD_GROUPS = [
  {
    title: "Location",
    fields: [
      { label: "Address", value: "221 Riggs Road" },
      { label: "City", value: "Hubert" },
      { label: "County", value: "ONSLOW" },
      { label: "State", value: "NC" },
      { label: "Zip", value: "28539" },
      { label: "Census Tract", value: "371330025.002005" },
    ],
  },
  {
    title: "Property Details",
    fields: [
      { label: "Property Type", value: "Manufactured Housing" },
      { label: "Number of Units", value: "24" },
      { label: "Total Sq Ft", value: "14,400" },
      { label: "Year Built", value: "1985" },
      { label: "Parcel ID / APN", value: "010427" },
      { label: "Pad Count", value: "24" },
      { label: "Park-Owned Homes", value: "6" },
      { label: "Short-Term Rental", value: "No" },
      { label: "Listing Status", value: "Active" },
    ],
  },
  {
    title: "Financials",
    fields: [
      { label: "Purchase Price", value: "$850,000", isCurrency: true },
      { label: "Lot Rent", value: "$325", isCurrency: true },
      { label: "Median Tract Income", value: "$42,500", isCurrency: true },
      { label: "Occupancy Rate", value: "87.5%" },
    ],
  },
  {
    title: "Risk & Compliance",
    fields: [
      { label: "Flood Zone Type", value: "Zone X" },
      { label: "In Flood Zone", value: "No" },
    ],
  },
];

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

// ─── Page ───

export default function DealHeaderMockupPage() {
  const [activeTab, setActiveTab] = useState("Property");
  const tabs = [
    "Overview",
    "Property",
    "Underwriting",
    "Contacts",
    "Conditions",
    "Documents",
    "Tasks",
    "Activity",
  ];

  const deal = SAMPLE_DEAL;
  const currentStageIndex = STAGES.findIndex((s) => s.key === deal.stage);
  const nextStage = STAGES[currentStageIndex + 1];

  return (
    <div className="min-h-screen pb-20">
      {/* Comparison label */}
      <div className="mb-8 rounded-xl border border-dashed border-primary/30 bg-primary/5 px-5 py-4">
        <h2 className="text-base font-semibold mb-1">
          Mockup: Sidebar Eliminated, Actions in Header
        </h2>
        <p className="text-sm text-muted-foreground">
          Full-width content area. Quick Actions in dropdown. Team in avatar
          popover. Est. Close inline. Advance to Stage promoted to primary CTA.
        </p>
      </div>

      {/* Breadcrumb */}
      <div className="mb-3 text-[13px] text-muted-foreground flex items-center gap-1.5">
        <span className="hover:text-foreground cursor-pointer">Pipeline</span>
        <span>/</span>
        <span className="hover:text-foreground cursor-pointer">
          Bridge Debt
        </span>
        <span>/</span>
        <span className="text-foreground">RQ-0042</span>
      </div>

      <div className="max-w-[1280px] mx-auto">
        {/* ── NEW HEADER ── */}
        <div className="flex items-start justify-between gap-5">
          {/* Left: Deal Identity */}
          <div className="flex gap-4 items-start">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            <div>
              {/* Row 1: Name + badges */}
              <div className="flex items-center gap-2.5 mb-1">
                <h1 className="m-0 text-[22px] font-bold tracking-tight">
                  {deal.name}
                </h1>
                <Badge
                  variant="outline"
                  className="text-[10px] uppercase bg-blue-500/10 text-blue-400 border-blue-500/20"
                >
                  Bridge
                </Badge>
                <Badge variant="outline" className="text-[10px] uppercase">
                  {STAGES[currentStageIndex]?.label}
                </Badge>
              </div>

              {/* Row 2: Metadata with Est. Close */}
              <div className="flex items-center gap-4 text-[13px] text-muted-foreground">
                <span className="num">{deal.deal_number}</span>
                <span>{deal.asset_class}</span>
                <span className="num font-medium text-foreground">
                  {formatCurrency(deal.amount)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span className="num">{deal.days_in_stage}</span> days in
                  stage
                </span>
                <span className="text-border">|</span>
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  Est. Close:{" "}
                  <span className="num text-foreground">Mar 26</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right: Team + Actions + Advance CTA */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Team Avatar Stack with Popover */}
            <TeamAvatarPopover />

            {/* Actions Dropdown */}
            <ActionsDropdown deal={deal} />

            {/* Primary CTA */}
            {nextStage && (
              <Button
                size="sm"
                className="gap-1.5 font-medium"
                onClick={() =>
                  alert(`Would advance to ${nextStage.label}`)
                }
              >
                Advance to {nextStage.label}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* ── Stage Stepper ── */}
        <div className="mt-6 rounded-xl border bg-card px-5 py-4">
          <div className="flex items-center gap-0">
            {STAGES.map((stage, i) => {
              const isComplete = i < currentStageIndex;
              const isCurrent = i === currentStageIndex;
              return (
                <React.Fragment key={stage.key}>
                  {i > 0 && (
                    <div
                      className={cn(
                        "h-[2px] flex-1",
                        isComplete ? "bg-primary" : "bg-border"
                      )}
                    />
                  )}
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors",
                        isComplete &&
                          "bg-primary text-primary-foreground",
                        isCurrent &&
                          "bg-primary text-primary-foreground ring-4 ring-primary/20",
                        !isComplete &&
                          !isCurrent &&
                          "bg-muted text-muted-foreground"
                      )}
                    >
                      {isComplete ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Circle className="h-3 w-3" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-[11px] whitespace-nowrap",
                        isCurrent
                          ? "font-medium text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {stage.label}
                    </span>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* ── Tab Bar ── */}
        <div className="mt-6 mb-6">
          <div className="inline-flex gap-0.5 rounded-[10px] p-[3px] bg-muted border">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border-none px-3.5 py-[7px] text-[13px] cursor-pointer transition-all duration-150",
                  activeTab === tab
                    ? "bg-background text-foreground font-medium shadow-sm"
                    : "bg-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* ── FULL-WIDTH CONTENT AREA (no sidebar!) ── */}
        <div className="flex flex-col gap-5 min-w-0">
          {/* Sub-tabs for Property */}
          {activeTab === "Property" && (
            <>
              <div className="flex gap-1 mb-1">
                {["Property Info", "Rent Roll", "T12 / Historicals"].map(
                  (sub, i) => (
                    <button
                      key={sub}
                      className={cn(
                        "px-3 py-1.5 text-[13px] rounded-lg border-none cursor-pointer transition-colors",
                        i === 0
                          ? "bg-primary/10 text-primary font-medium"
                          : "bg-transparent text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {sub}
                    </button>
                  )
                )}
              </div>

              {/* Grouped 3-column layout */}
              <div className="rounded-xl border bg-card">
                {FIELD_GROUPS.map((group, gi) => (
                  <div
                    key={group.title}
                    className={cn(
                      "px-5 py-4",
                      gi > 0 && "border-t border-border/50"
                    )}
                  >
                    <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-3">
                      {group.title}
                    </h3>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2.5">
                      {group.fields.map((field) => (
                        <div
                          key={field.label}
                          className="flex flex-col gap-0.5"
                        >
                          <label className="text-[11px] text-muted-foreground">
                            {field.label}
                          </label>
                          <div
                            className={cn(
                              "rounded-md border bg-background px-2.5 py-1.5 text-[13px]",
                              "isCurrency" in field &&
                                field.isCurrency &&
                                "num"
                            )}
                          >
                            {field.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === "Overview" && (
            <div className="rounded-xl border bg-card p-6">
              <p className="text-sm text-muted-foreground">
                Overview tab content would render here at full width.
              </p>
            </div>
          )}

          {activeTab !== "Property" && activeTab !== "Overview" && (
            <div className="rounded-xl border bg-card p-6">
              <p className="text-sm text-muted-foreground">
                {activeTab} tab content would render here at full width.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Team Avatar Popover ───

function TeamAvatarPopover() {
  const [selectedMember, setSelectedMember] = useState("");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted border-0 bg-transparent cursor-pointer">
          <div className="flex -space-x-1.5">
            {SAMPLE_TEAM.map((m) => (
              <div
                key={m.id}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-medium ring-2 ring-background"
                title={`${m.full_name} (${m.role})`}
              >
                {m.full_name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
            ))}
          </div>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-72 p-0">
        <div className="px-4 py-3 border-b">
          <h4 className="text-sm font-medium">Deal Team</h4>
        </div>

        <div className="py-2 px-2 max-h-[240px] overflow-y-auto">
          {SAMPLE_TEAM.map((member) => (
            <div
              key={member.id}
              className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-[10px] font-medium">
                {member.full_name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="text-left min-w-0 flex-1">
                <div className="text-xs font-medium text-foreground truncate">
                  {member.full_name}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {member.role}
                </div>
              </div>
              <button
                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-destructive/10 bg-transparent border-0 cursor-pointer"
                onClick={() => alert(`Remove ${member.full_name}`)}
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          ))}
        </div>

        <div className="border-t px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Select value={selectedMember} onValueChange={setSelectedMember}>
              <SelectTrigger className="h-8 text-xs flex-1">
                <SelectValue placeholder="Select member..." />
              </SelectTrigger>
              <SelectContent>
                {ALL_MEMBERS.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-3 text-xs gap-1"
              onClick={() => {
                if (selectedMember) {
                  const name = ALL_MEMBERS.find(
                    (m) => m.id === selectedMember
                  )?.full_name;
                  alert(`Would add ${name}`);
                  setSelectedMember("");
                }
              }}
            >
              <Plus className="h-3 w-3" />
              Add
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Actions Dropdown ───

function ActionsDropdown({
  deal,
}: {
  deal: typeof SAMPLE_DEAL;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <MoreHorizontal className="h-4 w-4" />
          Actions
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-normal">
          Communication
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => alert("Log Call dialog")}>
          <Phone className="h-4 w-4 mr-2" />
          Log Call
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => alert("Send Email dialog")}>
          <Mail className="h-4 w-4 mr-2" />
          Send Email
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-normal">
          Documents & Approvals
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => alert("Generate Document dialog")}>
          <FileText className="h-4 w-4 mr-2" />
          Generate Document
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => alert("Request Approval dialog")}>
          <Shield className="h-4 w-4 mr-2" />
          Request Approval
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => alert("Schedule Closing dialog")}>
          <Calendar className="h-4 w-4 mr-2" />
          Schedule Closing
        </DropdownMenuItem>

        {deal.google_drive_folder_url && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a
                href={deal.google_drive_folder_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Google Drive Folder
                <ArrowUpRight className="h-3 w-3 ml-auto opacity-50" />
              </a>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-normal">
          Key Dates
        </DropdownMenuLabel>
        <div className="px-2 py-1.5 space-y-1">
          {[
            { label: "Created", value: deal.created_at },
            { label: "Last Updated", value: deal.updated_at },
            { label: "Est. Close", value: deal.expected_close_date },
            { label: "Actual Close", value: deal.actual_close_date },
          ].map((d) => (
            <div
              key={d.label}
              className="flex justify-between text-xs"
            >
              <span className="text-muted-foreground">{d.label}</span>
              <span className="num text-foreground">
                {d.value
                  ? new Date(d.value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "\u2014"}
              </span>
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
