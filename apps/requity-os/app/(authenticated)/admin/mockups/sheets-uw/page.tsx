"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  FileSpreadsheet,
  ExternalLink,
  ArrowUpRight,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Plus,
  Upload,
  Phone,
  Mail,
  Zap,
  Users,
  BarChart3,
  CheckCircle2,
  Building2,
  Table2,
  Receipt,
  ChevronRight,
  ChevronDown,
  Shield,
  Calendar,
  FileText,
  Maximize2,
  Minimize2,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Link as LinkIcon,
  Trash2,
  DollarSign,
  Hammer,
  Banknote,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

// ─── Scenario Data ───

type KPIData = {
  label: string;
  value: number;
  formatted: string;
  delta: string;
  deltaPositive: boolean;
  spark: number[];
  sub?: string;
};

const SCENARIOS: Record<string, { kpis: KPIData[]; insight: string; insightType: "positive" | "warning" | "neutral" }> = {
  base: {
    kpis: [
      { label: "NOI (Y1)", value: 842500, formatted: "$842,500", delta: "+3.2%", deltaPositive: true, spark: [65, 70, 74, 78, 84, 95] },
      { label: "DSCR", value: 1.32, formatted: "1.32x", delta: "+0.08", deltaPositive: true, spark: [60, 65, 70, 72, 78, 82] },
      { label: "Going-In Cap", value: 6.75, formatted: "6.75%", delta: "-25bp", deltaPositive: true, spark: [85, 80, 76, 73, 70, 68] },
      { label: "Levered IRR", value: 18.4, formatted: "18.4%", delta: "+1.2%", deltaPositive: true, spark: [55, 62, 70, 75, 80, 92] },
      { label: "Equity Multiple", value: 2.1, formatted: "2.1x", delta: "+0.1x", deltaPositive: true, spark: [50, 58, 66, 74, 85, 95] },
      { label: "Cash-on-Cash", value: 9.8, formatted: "9.8%", delta: "+0.4%", deltaPositive: true, spark: [70, 73, 76, 80, 85, 88], sub: "Year 1" },
    ],
    insight: "NOI improved 3.2% vs T12 driven by 5% rent growth, partially offset by rising insurance costs. DSCR comfortably above 1.25x threshold.",
    insightType: "positive",
  },
  upside: {
    kpis: [
      { label: "NOI (Y1)", value: 918200, formatted: "$918,200", delta: "+12.1%", deltaPositive: true, spark: [65, 72, 80, 88, 95, 100] },
      { label: "DSCR", value: 1.48, formatted: "1.48x", delta: "+0.24", deltaPositive: true, spark: [60, 68, 76, 82, 90, 95] },
      { label: "Going-In Cap", value: 7.35, formatted: "7.35%", delta: "+35bp", deltaPositive: true, spark: [68, 72, 76, 80, 84, 88] },
      { label: "Levered IRR", value: 22.7, formatted: "22.7%", delta: "+5.5%", deltaPositive: true, spark: [55, 65, 75, 82, 90, 100] },
      { label: "Equity Multiple", value: 2.4, formatted: "2.4x", delta: "+0.4x", deltaPositive: true, spark: [50, 60, 72, 82, 92, 100] },
      { label: "Cash-on-Cash", value: 12.1, formatted: "12.1%", delta: "+2.7%", deltaPositive: true, spark: [70, 76, 82, 88, 94, 100], sub: "Year 1" },
    ],
    insight: "Upside assumes 8% rent growth with lease-up of 2 vacant units by Q2. All return metrics exceed target thresholds by comfortable margins.",
    insightType: "positive",
  },
  stress: {
    kpis: [
      { label: "NOI (Y1)", value: 712800, formatted: "$712,800", delta: "-12.7%", deltaPositive: false, spark: [95, 88, 80, 72, 68, 62] },
      { label: "DSCR", value: 0.98, formatted: "0.98x", delta: "-0.26", deltaPositive: false, spark: [82, 75, 68, 62, 55, 48] },
      { label: "Going-In Cap", value: 5.71, formatted: "5.71%", delta: "-129bp", deltaPositive: false, spark: [68, 64, 60, 58, 56, 54] },
      { label: "Levered IRR", value: 11.2, formatted: "11.2%", delta: "-6.0%", deltaPositive: false, spark: [92, 82, 72, 65, 58, 52] },
      { label: "Equity Multiple", value: 1.6, formatted: "1.6x", delta: "-0.4x", deltaPositive: false, spark: [95, 85, 76, 68, 62, 58] },
      { label: "Cash-on-Cash", value: 5.2, formatted: "5.2%", delta: "-4.2%", deltaPositive: false, spark: [88, 78, 68, 60, 55, 50], sub: "Year 1" },
    ],
    insight: "Stress test at 10% vacancy and flat rents shows DSCR drops below 1.0x covenant. Recommend negotiating interest-only period as downside protection.",
    insightType: "warning",
  },
};

const DEAL_TABS = [
  "Overview",
  "Property",
  "Underwriting",
  "Contacts",
  "Conditions",
  "Documents",
  "Tasks",
  "Activity",
  "Notes",
];

const PROPERTY_SECTIONS = ["Property Info", "Rent Roll", "T12 / Historicals"];
const UW_SECTIONS = ["Pro Forma", "Assumptions", "Sources & Uses"];

const MOCK_RENT_ROLL = [
  { unit: "101", tenant: "J. Smith", beds: 2, baths: 1, sf: 850, status: "occupied", rent: 1800, market: 1950 },
  { unit: "102", tenant: "M. Johnson", beds: 1, baths: 1, sf: 625, status: "occupied", rent: 1450, market: 1550 },
  { unit: "103", tenant: null, beds: 2, baths: 2, sf: 950, status: "vacant", rent: null, market: 2100 },
  { unit: "104", tenant: "A. Williams", beds: 3, baths: 2, sf: 1200, status: "occupied", rent: 2400, market: 2500 },
  { unit: "105", tenant: "R. Davis", beds: 1, baths: 1, sf: 600, status: "occupied", rent: 1350, market: 1475 },
  { unit: "106", tenant: "K. Brown", beds: 2, baths: 1, sf: 875, status: "occupied", rent: 1850, market: 1975 },
  { unit: "107", tenant: null, beds: 2, baths: 2, sf: 925, status: "vacant", rent: null, market: 2050 },
  { unit: "108", tenant: "T. Martinez", beds: 1, baths: 1, sf: 650, status: "occupied", rent: 1500, market: 1600 },
];

const STAGES = [
  { key: "lead", label: "Lead" },
  { key: "analysis", label: "Analysis" },
  { key: "negotiation", label: "Negotiation" },
  { key: "due_diligence", label: "Due Diligence" },
  { key: "closing", label: "Closing" },
  { key: "closed", label: "Closed" },
];

const PRESENCE_USERS = [
  { initials: "DM", name: "Dylan Marma", color: "bg-primary" },
  { initials: "LR", name: "Luis", color: "bg-blue-600" },
];

// ─── Shared Deal Model Types & Context ───

type ClosingCostItem = { id: string; label: string; amount: number; note?: string };
type ReserveItem = { id: string; label: string; amount: number };
type BudgetLineItem = { id: string; description: string; qty: number; unitCost: number; timeline: string };
type BudgetCategory = { id: string; name: string; items: BudgetLineItem[] };
type GroundUpItem = { id: string; description: string; amount: number };
type GroundUpSection = { id: string; name: string; items: GroundUpItem[] };

type DealModel = {
  purchasePrice: number;
  senior: { ltv: number; rate: number; io: boolean; term: number; amort: number; origFeePct: number; prepayType: string };
  mezz: { ltv: number; rate: number; io: boolean };
  takeout: { enabled: boolean; year: number; rate: number; amort: number; term: number; maxLTV: number; dscrFloor: number };
  exitCapRate: number;
  closingCosts: ClosingCostItem[];
  budgetMode: "value_add" | "ground_up";
  valueAddCategories: BudgetCategory[];
  valueAddContingencyPct: number;
  groundUpSections: GroundUpSection[];
  groundUpGCFeePct: number;
  groundUpDevFeePct: number;
  groundUpContingencyPct: number;
  reserves: ReserveItem[];
};

const DEFAULT_CLOSING_COSTS: ClosingCostItem[] = [
  { id: "cc1", label: "Title & Escrow", amount: 25000 },
  { id: "cc2", label: "Appraisal", amount: 7500 },
  { id: "cc3", label: "Environmental (Phase I)", amount: 4500 },
  { id: "cc4", label: "Survey", amount: 6500 },
  { id: "cc5", label: "Legal (Borrower Counsel)", amount: 35000 },
  { id: "cc6", label: "Lender Legal", amount: 25000 },
  { id: "cc7", label: "Insurance (1st Year Premium)", amount: 49375 },
  { id: "cc8", label: "Transfer / Recording Taxes", amount: 18750 },
  { id: "cc9", label: "Recording Fees", amount: 2500 },
  { id: "cc10", label: "Other / Misc", amount: 13375 },
];

const DEFAULT_RESERVES: ReserveItem[] = [
  { id: "r1", label: "Operating Reserve", amount: 62500 },
  { id: "r2", label: "Interest Reserve", amount: 43750 },
  { id: "r3", label: "Tax & Insurance Escrow", amount: 12500 },
  { id: "r4", label: "Replacement Reserve", amount: 6250 },
];

const DEFAULT_VALUE_ADD: BudgetCategory[] = [
  { id: "va1", name: "Interior Renovations", items: [
    { id: "va1-1", description: "Kitchen upgrades", qty: 24, unitCost: 6500, timeline: "Yr 1" },
    { id: "va1-2", description: "Bathroom upgrades", qty: 24, unitCost: 3500, timeline: "Yr 1" },
    { id: "va1-3", description: "Flooring (LVP)", qty: 24, unitCost: 2800, timeline: "Yr 1-2" },
    { id: "va1-4", description: "Fixtures & paint", qty: 24, unitCost: 1200, timeline: "Yr 1-2" },
  ]},
  { id: "va2", name: "Exterior / Building", items: [
    { id: "va2-1", description: "Roof repairs", qty: 1, unitCost: 45000, timeline: "Yr 1" },
    { id: "va2-2", description: "Exterior paint", qty: 1, unitCost: 32000, timeline: "Yr 1" },
    { id: "va2-3", description: "Landscaping", qty: 1, unitCost: 18000, timeline: "Yr 1" },
  ]},
  { id: "va3", name: "Common Areas", items: [
    { id: "va3-1", description: "Lobby renovation", qty: 1, unitCost: 25000, timeline: "Yr 1" },
    { id: "va3-2", description: "Hallway paint & carpet", qty: 1, unitCost: 15000, timeline: "Yr 1" },
    { id: "va3-3", description: "Security / access control", qty: 1, unitCost: 12000, timeline: "Yr 1" },
  ]},
];

const DEFAULT_GROUND_UP: GroundUpSection[] = [
  { id: "gu-hard", name: "Hard Costs", items: [
    { id: "gu-h1", description: "Site Work & Demolition", amount: 480000 },
    { id: "gu-h2", description: "Foundation", amount: 720000 },
    { id: "gu-h3", description: "Structure / Framing", amount: 1800000 },
    { id: "gu-h4", description: "Exterior Envelope", amount: 960000 },
    { id: "gu-h5", description: "MEP (Mechanical, Electrical, Plumbing)", amount: 1440000 },
    { id: "gu-h6", description: "Interior Finishes", amount: 1200000 },
    { id: "gu-h7", description: "Landscaping & Site Improvements", amount: 240000 },
  ]},
  { id: "gu-soft", name: "Soft Costs", items: [
    { id: "gu-s1", description: "Architecture & Engineering", amount: 360000 },
    { id: "gu-s2", description: "Permits & Fees", amount: 180000 },
    { id: "gu-s3", description: "Legal & Accounting", amount: 120000 },
    { id: "gu-s4", description: "Marketing / Lease-Up", amount: 60000 },
    { id: "gu-s5", description: "Insurance (During Construction)", amount: 96000 },
    { id: "gu-s6", description: "Property Taxes (During Construction)", amount: 72000 },
  ]},
];

const DEFAULT_DEAL_MODEL: DealModel = {
  purchasePrice: 12500000,
  senior: { ltv: 60, rate: 7.0, io: true, term: 5, amort: 30, origFeePct: 0.75, prepayType: "none" },
  mezz: { ltv: 0, rate: 12.0, io: true },
  takeout: { enabled: true, year: 3, rate: 6.0, amort: 30, term: 10, maxLTV: 75, dscrFloor: 1.25 },
  exitCapRate: 7.0,
  closingCosts: DEFAULT_CLOSING_COSTS.map(c => ({ ...c })),
  budgetMode: "value_add",
  valueAddCategories: DEFAULT_VALUE_ADD.map(cat => ({ ...cat, items: cat.items.map(i => ({ ...i })) })),
  valueAddContingencyPct: 5,
  groundUpSections: DEFAULT_GROUND_UP.map(s => ({ ...s, items: s.items.map(i => ({ ...i })) })),
  groundUpGCFeePct: 5,
  groundUpDevFeePct: 4,
  groundUpContingencyPct: 10,
  reserves: DEFAULT_RESERVES.map(r => ({ ...r })),
};

const MOCK_NOI_VALUES = [256825, 0, 402300, 414369, 426800, 439604, 452792];

const DealModelContext = React.createContext<{
  model: DealModel;
  setModel: React.Dispatch<React.SetStateAction<DealModel>>;
  update: (partial: Partial<DealModel>) => void;
  updateSenior: (partial: Partial<DealModel["senior"]>) => void;
  updateMezz: (partial: Partial<DealModel["mezz"]>) => void;
  updateTakeout: (partial: Partial<DealModel["takeout"]>) => void;
  noiValues: number[];
} | null>(null);

function useDealModel() {
  const ctx = React.useContext(DealModelContext);
  if (!ctx) throw new Error("Missing DealModelContext");
  return ctx;
}

function calcMaxLoanFromDSCR(noi: number, dscrFloor: number, annualRate: number, amortYears: number): number {
  if (dscrFloor <= 0 || annualRate <= 0) return 0;
  const maxAnnualDS = noi / dscrFloor;
  const r = annualRate / 100 / 12;
  const n = amortYears * 12;
  const maxMonthly = maxAnnualDS / 12;
  return Math.round(maxMonthly * (Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n)));
}

function calcMonthlyPmt(principal: number, annualRate: number, amortYears: number): number {
  if (principal <= 0 || annualRate <= 0) return 0;
  const r = annualRate / 100 / 12;
  const n = amortYears * 12;
  return principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

// ─── Main Page ───

export default function SheetsUWMockup() {
  const [activeTab, setActiveTab] = useState("Property");
  const [activeSection, setActiveSection] = useState("");
  const [kpisExpanded, setKpisExpanded] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeScenario, setActiveScenario] = useState<"base" | "upside" | "stress">("base");

  const [dealModel, setDealModel] = useState<DealModel>(DEFAULT_DEAL_MODEL);
  const updateDM = useCallback((partial: Partial<DealModel>) => setDealModel(prev => ({ ...prev, ...partial })), []);
  const updateSenior = useCallback((partial: Partial<DealModel["senior"]>) => setDealModel(prev => ({ ...prev, senior: { ...prev.senior, ...partial } })), []);
  const updateMezz = useCallback((partial: Partial<DealModel["mezz"]>) => setDealModel(prev => ({ ...prev, mezz: { ...prev.mezz, ...partial } })), []);
  const updateTakeout = useCallback((partial: Partial<DealModel["takeout"]>) => setDealModel(prev => ({ ...prev, takeout: { ...prev.takeout, ...partial } })), []);
  const dealModelCtx = React.useMemo(() => ({
    model: dealModel, setModel: setDealModel, update: updateDM, updateSenior, updateMezz, updateTakeout, noiValues: MOCK_NOI_VALUES,
  }), [dealModel, updateDM, updateSenior, updateMezz, updateTakeout]);

  const scrollToSection = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(id);
    }
  }, []);

  useEffect(() => {
    const sections = activeTab === "Property" ? PROPERTY_SECTIONS : activeTab === "Underwriting" ? UW_SECTIONS : [];
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-120px 0px -60% 0px", threshold: 0.1 }
    );

    const ids = sections.map((s) => s.toLowerCase().replace(/[\s\/]+/g, "-"));
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [activeTab]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (activeTab !== "Underwriting") return;

      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        setIsFullscreen((v) => !v);
      }
      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        handleRefreshSync();
      }
      if (e.key === "k" || e.key === "K") {
        e.preventDefault();
        setKpisExpanded((v) => !v);
      }
      if (e.key === "1") { e.preventDefault(); setActiveScenario("base"); }
      if (e.key === "2") { e.preventDefault(); setActiveScenario("upside"); }
      if (e.key === "3") { e.preventDefault(); setActiveScenario("stress"); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeTab]);

  const mockSheetId = "1BxT0s81aLtI8Bry4Enq0MRGx25Y_nJgn";

  const handleRefreshSync = useCallback(() => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 2000);
  }, []);

  const scenarioData = SCENARIOS[activeScenario];

  return (
    <DealModelContext.Provider value={dealModelCtx}>
    <div className="min-h-screen pb-20">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground mb-4">
        <span className="hover:text-foreground cursor-pointer">Pipeline</span>
        <ChevronRight className="h-3 w-3" />
        <span className="hover:text-foreground cursor-pointer">Comm Debt</span>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">R26-0022</span>
      </div>

      <div className="max-w-[1280px] mx-auto">
        {/* Deal Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-foreground">
                Eastman Portfolio - 123 Main St
              </h1>
              <span className="rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Comm Debt
              </span>
            </div>
            <div className="flex items-center gap-4 mt-1.5 text-sm text-muted-foreground">
              <span className="num font-medium">R26-0022</span>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span>ABC Invest</span>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span className="num">$12,500,000</span>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span>24 units</span>
            </div>
          </div>
        </div>

        {/* Stage Stepper */}
        <div className="mt-6 rounded-xl border bg-card px-5 py-4">
          <div className="flex items-center gap-2">
            {STAGES.map((stage, i) => {
              const isComplete = i < 3;
              const isCurrent = i === 3;
              return (
                <div key={stage.key} className="flex items-center gap-2 flex-1">
                  <div
                    className={cn(
                      "flex-1 h-2 rounded-full transition-colors",
                      isComplete ? "bg-primary" : isCurrent ? "bg-primary/40" : "bg-muted"
                    )}
                  />
                  <span
                    className={cn(
                      "text-[10px] whitespace-nowrap",
                      isComplete || isCurrent ? "text-foreground font-medium" : "text-muted-foreground"
                    )}
                  >
                    {stage.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tab Bar */}
        <div className="mt-6 mb-6">
          <div className="inline-flex gap-0.5 rounded-[10px] p-[3px] bg-muted border">
            {DEAL_TABS.map((tab) => (
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

        {/* Content Area */}
        <div className="grid grid-cols-[1fr_320px] gap-6 items-start">
          <div className="flex flex-col gap-0 min-w-0">

            {/* ═══ PROPERTY TAB (single scroll) ═══ */}
            {activeTab === "Property" && (
              <div className="flex flex-col gap-0">
                {/* Sticky jump nav */}
                <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/40 -mx-1 px-1 py-2 mb-4">
                  <div className="inline-flex gap-1 items-center">
                    {PROPERTY_SECTIONS.map((s) => {
                      const id = s.toLowerCase().replace(/[\s\/]+/g, "-");
                      return (
                        <button
                          key={id}
                          onClick={() => scrollToSection(id)}
                          className={cn(
                            "rounded-md px-2.5 py-1 text-[11px] font-medium cursor-pointer transition-colors",
                            activeSection === id
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          )}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── Section: Property Info ── */}
                <div id="property-info" className="scroll-mt-16">
                  <PropertyDetails />
                </div>

                {/* ── Section: Rent Roll ── */}
                <div id="rent-roll" className="scroll-mt-16 mt-6">
                  <SectionHeader title="Rent Roll" action={
                    <div className="flex items-center gap-2">
                      <button className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium cursor-pointer hover:bg-muted transition-colors">
                        <Upload className="h-3 w-3" strokeWidth={1.5} />
                        Upload & Map
                      </button>
                      <button className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium cursor-pointer hover:bg-muted transition-colors">
                        <Plus className="h-3 w-3" strokeWidth={1.5} />
                        Add Unit
                      </button>
                    </div>
                  } />
                  <div className="rounded-xl border bg-card overflow-hidden mt-3">
                    <NativeSheetContent activeTab="Rent Roll" />
                  </div>
                </div>

                {/* ── Section: T12 / Historicals ── */}
                <div id="t12---historicals" className="scroll-mt-16 mt-6 mb-8">
                  <T12Historicals />
                </div>
              </div>
            )}

            {/* ═══ UNDERWRITING TAB (single scroll) ═══ */}
            {activeTab === "Underwriting" && (
              <div className="flex flex-col gap-0">
                {/* Sticky KPI bar + jump nav */}
                <div className="sticky top-0 z-20 flex flex-col gap-0">
                  <div className="rounded-xl border bg-card overflow-hidden">
                    <UnifiedSheetHeader
                      activeSheetTab=""
                      onSheetTabChange={() => {}}
                      kpisExpanded={kpisExpanded}
                      onToggleKpis={() => setKpisExpanded(!kpisExpanded)}
                      isSyncing={isSyncing}
                      onRefresh={handleRefreshSync}
                      onExpand={() => setIsFullscreen(true)}
                      sheetUrl={`https://docs.google.com/spreadsheets/d/${mockSheetId}/edit`}
                      activeScenario={activeScenario}
                      onScenarioChange={setActiveScenario}
                      scenarioKpis={scenarioData.kpis}
                      hideSheetTabs
                    />
                  </div>
                  <div className="bg-background/80 backdrop-blur-md border-b border-border/40 -mx-1 px-1 py-2">
                    <div className="inline-flex gap-1 items-center">
                      {UW_SECTIONS.map((s) => {
                        const id = s.toLowerCase().replace(/[\s\/&]+/g, "-");
                        return (
                          <button
                            key={id}
                            onClick={() => scrollToSection(id)}
                            className={cn(
                              "rounded-md px-2.5 py-1 text-[11px] font-medium cursor-pointer transition-colors",
                              activeSection === id
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            )}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* ── Section: Pro Forma ── */}
                <div id="pro-forma" className="scroll-mt-48 mt-4">
                  <div className="rounded-xl border bg-card overflow-hidden">
                    <NativeSheetContent activeTab="Pro Forma" />
                  </div>
                </div>

                {/* ── Section: Assumptions ── */}
                <div id="assumptions" className="scroll-mt-48 mt-6">
                  <SectionHeader title="Assumptions" badge="Model inputs" action={
                    <div className="inline-flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                      Synced
                    </div>
                  } />
                  <div className="rounded-xl border bg-card overflow-hidden mt-3">
                    <NativeAssumptions />
                  </div>
                </div>

                {/* ── Section: Sources & Uses ── */}
                <div id="sources--uses" className="scroll-mt-48 mt-6">
                  <SectionHeader title="Sources & Uses" badge="Capital structure" />
                  <div className="mt-3">
                    <NativeSourcesUses />
                  </div>
                </div>

                {/* AI Insight Strip */}
                <div className="mt-4">
                  <AIInsightStrip insight={scenarioData.insight} type={scenarioData.insightType} />
                </div>

                {/* Keyboard shortcut hint */}
                <div className="flex items-center gap-4 text-[10px] text-muted-foreground/60 px-1 mt-2 mb-8">
                  <span><kbd className="px-1 py-0.5 rounded bg-muted text-[9px] font-mono">F</kbd> fullscreen</span>
                  <span><kbd className="px-1 py-0.5 rounded bg-muted text-[9px] font-mono">R</kbd> refresh</span>
                  <span><kbd className="px-1 py-0.5 rounded bg-muted text-[9px] font-mono">K</kbd> toggle KPIs</span>
                  <span><kbd className="px-1 py-0.5 rounded bg-muted text-[9px] font-mono">1</kbd><kbd className="px-1 py-0.5 rounded bg-muted text-[9px] font-mono ml-0.5">2</kbd><kbd className="px-1 py-0.5 rounded bg-muted text-[9px] font-mono ml-0.5">3</kbd> scenarios</span>
                </div>
              </div>
            )}

            {activeTab !== "Underwriting" && activeTab !== "Property" && (
              <div className="rounded-xl border bg-card px-8 py-16 text-center">
                <p className="text-sm text-muted-foreground">
                  {activeTab} tab content (existing, unchanged)
                </p>
              </div>
            )}
          </div>

          {/* Right: Sidebar */}
          <div className="flex w-full flex-col gap-4 sticky top-5">
            {/* Deal Score */}
            {activeTab === "Underwriting" && (
              <DealScoreCard scenario={activeScenario} />
            )}

            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">Quick Actions</h3>
              </div>
              <div className="flex flex-col gap-0.5">
                <SidebarAction icon={ArrowUpRight} label="Advance to Due Diligence" accent />
                <SidebarAction icon={Phone} label="Log Call" />
                <SidebarAction icon={Mail} label="Send Email" />
                <SidebarAction icon={FileText} label="Generate Document" />
                <SidebarAction icon={Shield} label="Request Approval" />
                <SidebarAction icon={Calendar} label="Schedule Closing" />
              </div>
            </div>

            <a
              href="#"
              className="flex items-center gap-2.5 rounded-xl border bg-card px-4 py-3 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4 shrink-0" />
              <span className="flex-1">Google Drive Folder</span>
              <ArrowUpRight className="h-3.5 w-3.5 opacity-50" />
            </a>

            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">Team</h3>
              </div>
              <div className="flex flex-col gap-1">
                <TeamMember name="Dylan Marma" role="Lead" />
                <TeamMember name="Luis" role="Originator" />
                <TeamMember name="Mike" role="Controller" />
              </div>
            </div>

            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">Key Dates</h3>
              </div>
              <div className="flex flex-col gap-2">
                <DateRow label="Created" value="Feb 18, 2026" />
                <DateRow label="Expected Close" value="Apr 15, 2026" />
                <DateRow label="In Stage" value="12 days" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Fullscreen Dialog ── */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent
          className="max-w-[96vw] w-[96vw] h-[94vh] p-0 flex flex-col overflow-hidden rounded-xl md:rounded-xl md:max-w-[96vw]"
        >
          <DialogTitle className="sr-only">Financial Model</DialogTitle>
          <div className="shrink-0">
            <UnifiedSheetHeader
              activeSheetTab=""
              onSheetTabChange={() => {}}
              kpisExpanded={kpisExpanded}
              onToggleKpis={() => setKpisExpanded(!kpisExpanded)}
              isSyncing={isSyncing}
              onRefresh={handleRefreshSync}
              onExpand={() => setIsFullscreen(false)}
              isFullscreen
              sheetUrl={`https://docs.google.com/spreadsheets/d/${mockSheetId}/edit`}
              activeScenario={activeScenario}
              onScenarioChange={setActiveScenario}
              scenarioKpis={scenarioData.kpis}
              hideSheetTabs
            />
          </div>
          <div className="flex-1 overflow-auto">
            <NativeSheetContent activeTab="Pro Forma" />
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </DealModelContext.Provider>
  );
}

// ─── Unified Sheet Header (with scenarios + presence) ───

function UnifiedSheetHeader({
  activeSheetTab,
  onSheetTabChange,
  kpisExpanded,
  onToggleKpis,
  isSyncing,
  onRefresh,
  onExpand,
  isFullscreen = false,
  sheetUrl,
  activeScenario,
  onScenarioChange,
  scenarioKpis,
}: {
  activeSheetTab: string;
  onSheetTabChange: (tab: string) => void;
  kpisExpanded: boolean;
  onToggleKpis: () => void;
  isSyncing: boolean;
  onRefresh: () => void;
  onExpand: () => void;
  isFullscreen?: boolean;
  sheetUrl: string;
  activeScenario: "base" | "upside" | "stress";
  onScenarioChange: (s: "base" | "upside" | "stress") => void;
  scenarioKpis: KPIData[];
  hideSheetTabs?: boolean;
}): React.JSX.Element {
  return (
    <div>
      {/* Top row: scenario + actions */}
      <div className="flex items-center gap-2.5 px-4 py-2.5">
        {/* Scenario toggle */}
        <ScenarioToggle active={activeScenario} onChange={onScenarioChange} />

        <div className="flex-1" />

        {/* Presence indicators */}
        <div className="flex items-center -space-x-1.5 mr-1">
          {PRESENCE_USERS.map((u) => (
            <div
              key={u.initials}
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-semibold text-white ring-2 ring-card",
                u.color
              )}
              title={`${u.name} is viewing`}
            >
              {u.initials}
            </div>
          ))}
          <div className="pl-2.5 text-[10px] text-muted-foreground">2 viewing</div>
        </div>

        <div className="h-4 w-px bg-border/40" />

        {/* Sync indicator */}
        <SyncIndicator isSyncing={isSyncing} onRefresh={onRefresh} />

        <div className="h-4 w-px bg-border/40" />

        {/* KPI toggle */}
        <button
          onClick={onToggleKpis}
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-md px-1.5 py-1 hover:bg-muted"
        >
          <BarChart3 className="h-3 w-3" strokeWidth={1.5} />
          <ChevronDown
            className={cn(
              "h-3 w-3 transition-transform duration-200",
              !kpisExpanded && "-rotate-90"
            )}
            strokeWidth={1.5}
          />
        </button>

        {/* Expand */}
        <button
          onClick={onExpand}
          className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          title={isFullscreen ? "Exit fullscreen (F)" : "Fullscreen (F)"}
        >
          {isFullscreen ? (
            <Minimize2 className="h-3.5 w-3.5" strokeWidth={1.5} />
          ) : (
            <Maximize2 className="h-3.5 w-3.5" strokeWidth={1.5} />
          )}
        </button>

        {/* Open in Sheets */}
        <a
          href={sheetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
          <span className="hidden sm:inline">Sheets</span>
        </a>
      </div>

      {/* Collapsible KPI strip with sparklines + deltas */}
      <div
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          kpisExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="grid grid-cols-6 divide-x divide-border/40 border-t border-border/50">
            {scenarioKpis.map((kpi) => (
              <KPICell key={kpi.label} kpi={kpi} scenario={activeScenario} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Scenario Toggle ───

function ScenarioToggle({
  active,
  onChange,
}: {
  active: "base" | "upside" | "stress";
  onChange: (s: "base" | "upside" | "stress") => void;
}) {
  const scenarios: { key: "base" | "upside" | "stress"; label: string }[] = [
    { key: "base", label: "Base" },
    { key: "upside", label: "Upside" },
    { key: "stress", label: "Stress" },
  ];

  return (
    <div className="inline-flex gap-0.5 rounded-lg p-[2px] bg-muted">
      {scenarios.map((s) => (
        <button
          key={s.key}
          onClick={() => onChange(s.key)}
          className={cn(
            "rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wider cursor-pointer transition-all duration-200",
            active === s.key
              ? s.key === "stress"
                ? "bg-red-500/10 text-red-600 dark:text-red-400 shadow-sm"
                : s.key === "upside"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm"
                : "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

// ─── KPI Cell with Sparkline + Delta ───

function KPICell({ kpi, scenario }: { kpi: KPIData; scenario: string }) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
    const timer = setTimeout(() => setAnimate(false), 600);
    return () => clearTimeout(timer);
  }, [scenario]);

  return (
    <div className="px-3 py-2.5 group relative">
      <div className="flex items-start justify-between gap-1">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] text-muted-foreground mb-0.5 leading-tight truncate">
            {kpi.label}
          </div>
          <div
            className={cn(
              "text-[14px] font-semibold num text-foreground leading-tight transition-all duration-500",
              animate && "scale-[1.03]"
            )}
          >
            {kpi.formatted}
          </div>
        </div>
        {/* Sparkline */}
        <MiniSparkline data={kpi.spark} positive={kpi.deltaPositive} />
      </div>
      {/* Delta badge */}
      <div className="flex items-center gap-1 mt-1">
        <div
          className={cn(
            "inline-flex items-center gap-0.5 rounded-full px-1.5 py-[1px] text-[9px] font-semibold transition-all duration-300",
            kpi.deltaPositive
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-red-500/10 text-red-600 dark:text-red-400",
            animate && "scale-105"
          )}
        >
          {kpi.deltaPositive ? (
            <ArrowUp className="h-2 w-2" strokeWidth={2.5} />
          ) : (
            <ArrowDown className="h-2 w-2" strokeWidth={2.5} />
          )}
          {kpi.delta}
        </div>
        {kpi.sub && (
          <span className="text-[9px] text-muted-foreground">{kpi.sub}</span>
        )}
      </div>
    </div>
  );
}

// ─── Mini Sparkline SVG ───

function MiniSparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const w = 40;
  const h = 20;
  const padding = 2;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((v, i) => {
      const x = padding + (i / (data.length - 1)) * (w - padding * 2);
      const y = h - padding - ((v - min) / range) * (h - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  const lastPoint = data[data.length - 1];
  const lastX = w - padding;
  const lastY = h - padding - ((lastPoint - min) / range) * (h - padding * 2);

  return (
    <svg width={w} height={h} className="shrink-0 mt-1" viewBox={`0 0 ${w} ${h}`}>
      <polyline
        points={points}
        fill="none"
        stroke={positive ? "#10b981" : "#ef4444"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
      <circle
        cx={lastX}
        cy={lastY}
        r="2"
        fill={positive ? "#10b981" : "#ef4444"}
      />
    </svg>
  );
}

// ─── AI Insight Strip ───

function AIInsightStrip({ insight, type }: { insight: string; type: "positive" | "warning" | "neutral" }) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3 flex items-start gap-3 transition-all duration-300",
        type === "positive" && "bg-emerald-500/[0.04] border-emerald-500/20",
        type === "warning" && "bg-amber-500/[0.04] border-amber-500/20",
        type === "neutral" && "bg-card border-border"
      )}
    >
      <div className={cn(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg mt-0.5",
        type === "positive" && "bg-emerald-500/10",
        type === "warning" && "bg-amber-500/10",
        type === "neutral" && "bg-muted",
      )}>
        {type === "warning" ? (
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" strokeWidth={1.5} />
        ) : (
          <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
          AI Analysis
        </div>
        <p className="text-[12px] leading-relaxed text-foreground/80">
          {insight}
        </p>
      </div>
    </div>
  );
}

// ─── Deal Score Card (sidebar) ───

function DealScoreCard({ scenario }: { scenario: "base" | "upside" | "stress" }) {
  const scores: Record<string, { score: number; label: string; color: string }> = {
    base: { score: 78, label: "Strong", color: "text-emerald-600 dark:text-emerald-400" },
    upside: { score: 92, label: "Excellent", color: "text-emerald-600 dark:text-emerald-400" },
    stress: { score: 41, label: "At Risk", color: "text-red-600 dark:text-red-400" },
  };

  const { score, label, color } = scores[scenario];
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">Deal Score</h3>
        <span className="text-[10px] text-muted-foreground capitalize ml-auto">{scenario} case</span>
      </div>
      <div className="flex items-center gap-4">
        {/* Circular gauge */}
        <div className="relative h-20 w-20 shrink-0">
          <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
            <circle
              cx="40" cy="40" r="36"
              fill="none"
              strokeWidth="6"
              className="stroke-muted"
            />
            <circle
              cx="40" cy="40" r="36"
              fill="none"
              strokeWidth="6"
              strokeLinecap="round"
              className={cn(
                "transition-all duration-700 ease-out",
                score >= 70 ? "stroke-emerald-500" : score >= 50 ? "stroke-amber-500" : "stroke-red-500"
              )}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("text-lg font-bold num", color)}>{score}</span>
          </div>
        </div>
        <div className="flex-1">
          <div className={cn("text-sm font-semibold", color)}>{label}</div>
          <div className="text-[11px] text-muted-foreground mt-1 leading-snug">
            {score >= 70
              ? "Returns exceed targets. DSCR above covenant."
              : score >= 50
              ? "Marginal returns. Monitor closely."
              : "Below covenant threshold. Needs restructuring."}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sync Indicator ───

function SyncIndicator({
  isSyncing,
  onRefresh,
}: {
  isSyncing: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
      {isSyncing ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
          </span>
          <span>Syncing...</span>
        </>
      ) : (
        <>
          <span className="relative flex h-2 w-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span>Synced 2m ago</span>
        </>
      )}
      <button
        onClick={onRefresh}
        disabled={isSyncing}
        className="ml-0.5 p-1 rounded-md hover:bg-muted transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        title="Refresh (R)"
      >
        <RefreshCw
          className={cn("h-3 w-3", isSyncing && "animate-spin")}
          strokeWidth={1.5}
        />
      </button>
    </div>
  );
}

// ─── Native Sheet Content (gridline-free, page-scrolling) ───

function NativeSheetContent({ activeTab }: { activeTab: string }) {
  if (activeTab === "Pro Forma") return <NativeProForma />;
  if (activeTab === "Rent Roll") return <NativeRentRoll />;
  if (activeTab === "Inputs") return <NativeInputs />;

  return (
    <div className="px-6 py-16 text-center">
      <FileSpreadsheet className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" strokeWidth={1} />
      <p className="text-sm text-muted-foreground">{activeTab} tab</p>
      <p className="text-xs text-muted-foreground/60 mt-1">Sheet content renders here</p>
    </div>
  );
}

// ─── Pro Forma Tab ───

type ExpenseMetric = "none" | "per_unit" | "per_sf";

const TOTAL_UNITS = 24;
const TOTAL_SF = 19750;

type CellNoteData = { text: string; by?: string; date?: string };

type ExpenseRow = {
  label: string;
  defaultBasis: string;
  defaultRate: string;
  values: number[];
  overridden?: boolean;
  cellNotes?: Record<number, CellNoteData>;
  skipComparison?: boolean;
  pctOfEgi?: boolean;
};

const EXPENSE_DATA: ExpenseRow[] = [
  { label: "Real Estate Taxes", defaultBasis: "/SF", defaultRate: "$5.00", values: [62500, 0, 98750, 101713, 104764, 107907, 111144], overridden: true, skipComparison: true, cellNotes: {
    2: { text: "County reassessment pending Q3 2026. Budgeted 58% increase over T12 based on comparable assessments in the submarket.", by: "Luis", date: "Mar 10" },
    3: { text: "Assumes new assessed value takes effect. 3% annual escalator from new base.", by: "Luis", date: "Mar 10" },
  }},
  { label: "Insurance", defaultBasis: "/SF", defaultRate: "$2.50", values: [38400, 0, 49375, 50856, 52382, 53953, 55572], cellNotes: {
    2: { text: "Quoted $49K from broker. Flood zone X, no supplemental required.", by: "Dylan", date: "Mar 11" },
  }},
  { label: "Management Fee", defaultBasis: "% EGI", defaultRate: "6.0%", values: [30187, 0, 35308, 36367, 37458, 38582, 39739], pctOfEgi: true },
  { label: "Repairs & Maintenance", defaultBasis: "/SF", defaultRate: "$4.00", values: [42000, 0, 79000, 81370, 83811, 86325, 88915] },
  { label: "Utilities", defaultBasis: "/SF", defaultRate: "$5.90", values: [28800, 0, 116525, 120021, 123621, 127330, 131150], cellNotes: {
    3: { text: "Water sub-metering savings kick in Year 2. Vendor confirmed $8K annual reduction.", by: "Luis", date: "Mar 12" },
  }},
  { label: "Payroll", defaultBasis: "/SF", defaultRate: "$2.75", values: [24000, 0, 54313, 55942, 57620, 59349, 61129] },
  { label: "G&A", defaultBasis: "/SF", defaultRate: "$0.70", values: [8400, 0, 13825, 14240, 14667, 15107, 15560] },
  { label: "Contract Services", defaultBasis: "/SF", defaultRate: "$0.60", values: [0, 0, 11850, 12206, 12572, 12949, 13337] },
  { label: "Marketing", defaultBasis: "/SF", defaultRate: "$0.25", values: [6000, 0, 4938, 5086, 5238, 5395, 5557] },
  { label: "Replacement Reserve", defaultBasis: "/SF", defaultRate: "$0.53", values: [6000, 0, 10468, 10468, 10468, 10468, 10468] },
];


function fmtDollar(n: number) {
  return `$${n.toLocaleString()}`;
}

function fmtDollarSigned(n: number) {
  if (n >= 0) return `$${n.toLocaleString()}`;
  return `($${Math.abs(n).toLocaleString()})`;
}

function rawMetric(n: number, metric: ExpenseMetric) {
  if (metric === "per_unit") return n / TOTAL_UNITS;
  if (metric === "per_sf") return n / TOTAL_SF;
  return 0;
}

function fmtMetric(n: number, metric: ExpenseMetric) {
  if (metric === "per_unit") return `$${Math.round(n / TOTAL_UNITS).toLocaleString()}`;
  if (metric === "per_sf") return `$${(n / TOTAL_SF).toFixed(2)}`;
  return "";
}

function parseDefaultRate(rate: string): number {
  const cleaned = rate.replace(/[$,%]/g, "");
  return parseFloat(cleaned) || 0;
}

function metricVsBaseline(value: number, metric: ExpenseMetric, exp: ExpenseRow): "above" | "below" | "neutral" {
  if (exp.skipComparison || exp.pctOfEgi) return "neutral";
  const actual = rawMetric(value, metric);
  const matchesBasis = (metric === "per_sf" && exp.defaultBasis === "/SF") || (metric === "per_unit" && exp.defaultBasis === "/Unit");
  if (!matchesBasis) return "neutral";
  const baseline = parseDefaultRate(exp.defaultRate);
  if (baseline === 0) return "neutral";
  if (actual >= baseline - 0.005) return "above";
  return "below";
}

function NativeProForma() {
  const [expMetric, setExpMetric] = useState<ExpenseMetric>("none");
  const [mgmtFeePct, setMgmtFeePct] = useState(6.0);
  const cols = ["T-12", "Year 0", "Year 1", "Year 2", "Year 3", "Year 4", "Year 5"];
  const YR0 = 1;

  const egiValues = [503112, 0, 588468, 607540, 627235, 647567, 668550];

  const mgmtFeeValues = egiValues.map((egi, i) => {
    if (i === 0) return EXPENSE_DATA.find(e => e.pctOfEgi)!.values[0];
    if (i === YR0) return 0;
    return Math.round(egi * mgmtFeePct / 100);
  });

  const totalExpByCol = cols.map((_, i) => {
    if (i === YR0) return 0;
    return EXPENSE_DATA.reduce((s, e) => {
      if (e.pctOfEgi) return s + mgmtFeeValues[i];
      return s + e.values[i];
    }, 0);
  });
  const noiValues = egiValues.map((egi, i) => i === YR0 ? 0 : egi - totalExpByCol[i]);

  const { model, updateSenior, updateMezz, updateTakeout, update: updateDM } = useDealModel();

  const purchasePrice = model.purchasePrice;
  const totalCC = model.closingCosts.reduce((s, c) => s + c.amount, 0);
  const totalRes = model.reserves.reduce((s, r) => s + r.amount, 0);
  let totalBudgetPF = 0;
  if (model.budgetMode === "value_add") {
    const li = model.valueAddCategories.reduce((s, cat) => s + cat.items.reduce((si, item) => si + item.qty * item.unitCost, 0), 0);
    totalBudgetPF = li + Math.round(li * model.valueAddContingencyPct / 100);
  } else {
    const hard = model.groundUpSections.find(s => s.id === "gu-hard")?.items.reduce((s, i) => s + i.amount, 0) ?? 0;
    const soft = model.groundUpSections.find(s => s.id === "gu-soft")?.items.reduce((s, i) => s + i.amount, 0) ?? 0;
    const gc = Math.round(hard * model.groundUpGCFeePct / 100);
    const sub = hard + soft + gc;
    totalBudgetPF = sub + Math.round(hard * model.groundUpContingencyPct / 100) + Math.round(sub * model.groundUpDevFeePct / 100);
  }
  const seniorLoan = Math.round(purchasePrice * model.senior.ltv / 100);
  const seniorOrigFee = Math.round(seniorLoan * model.senior.origFeePct / 100);
  const closingCosts = totalCC;
  const totalReserves = totalRes;
  const improvementBudget = totalBudgetPF;
  const origFee = seniorOrigFee;
  const totalAcquisition = purchasePrice + closingCosts + totalReserves + improvementBudget + origFee;

  const seniorLTV = model.senior.ltv;
  const setSeniorLTV = (v: number) => updateSenior({ ltv: v });
  const seniorRate = model.senior.rate;
  const setSeniorRate = (v: number) => updateSenior({ rate: v });
  const seniorIO = model.senior.io;
  const setSeniorIO = (v: boolean) => updateSenior({ io: v });
  const seniorTerm = model.senior.term;
  const seniorInterest = Math.round(seniorLoan * seniorRate / 100);
  const seniorAmortYears = model.senior.amort;
  const seniorMonthlyRate = seniorRate / 100 / 12;
  const seniorMonthlyPmt = seniorIO ? 0 : seniorLoan * (seniorMonthlyRate * Math.pow(1 + seniorMonthlyRate, seniorAmortYears * 12)) / (Math.pow(1 + seniorMonthlyRate, seniorAmortYears * 12) - 1);
  const seniorAnnualPrincipal = seniorIO ? 0 : Math.round(seniorMonthlyPmt * 12 - seniorInterest);
  const seniorBalanceAtSale = seniorIO ? seniorLoan : seniorLoan - seniorAnnualPrincipal * seniorTerm;

  const mezzLTV = model.mezz.ltv;
  const setMezzLTV = (v: number) => updateMezz({ ltv: v });
  const mezzRate = model.mezz.rate;
  const setMezzRate = (v: number) => updateMezz({ rate: v });
  const mezzIO = model.mezz.io;
  const setMezzIO = (v: boolean) => updateMezz({ io: v });
  const mezzLoan = Math.round(purchasePrice * mezzLTV / 100);
  const mezzInterest = Math.round(mezzLoan * mezzRate / 100);
  const mezzAnnualPrincipal = mezzIO ? 0 : Math.round(mezzLoan / seniorTerm);
  const mezzBalanceAtSale = mezzIO ? mezzLoan : Math.max(0, mezzLoan - mezzAnnualPrincipal * seniorTerm);

  const totalLoanProceeds = seniorLoan + mezzLoan;
  const equityInvested = totalAcquisition - totalLoanProceeds;

  const exitCapRate = model.exitCapRate;
  const setExitCapRate = (v: number) => updateDM({ exitCapRate: v });
  const stabilizedNOI = noiValues[6];
  const grossSalePrice = Math.round(stabilizedNOI / (exitCapRate / 100));
  const dispositionCostPct = 0.03;
  const dispositionCosts = Math.round(grossSalePrice * dispositionCostPct);
  const netSaleProceeds = grossSalePrice - dispositionCosts;

  const takeoutEnabled = model.takeout.enabled;
  const takeoutYear = model.takeout.year;
  const takeoutColIdx = takeoutYear + 1;
  const takeoutNOI = noiValues[Math.min(takeoutYear + 1, noiValues.length - 1)] ?? noiValues[noiValues.length - 1];
  const takeoutAppraised = exitCapRate > 0 ? Math.round(takeoutNOI / (exitCapRate / 100)) : 0;
  const takeoutLTVMax = Math.round(takeoutAppraised * model.takeout.maxLTV / 100);
  const takeoutDSCRMax = calcMaxLoanFromDSCR(takeoutNOI, model.takeout.dscrFloor, model.takeout.rate, model.takeout.amort);
  const takeoutLoanAmt = takeoutEnabled ? Math.min(takeoutLTVMax, takeoutDSCRMax) : 0;
  const takeoutCostPctPF = 1.25;
  const takeoutCost = Math.round(takeoutLoanAmt * takeoutCostPctPF / 100);
  const takeoutInterest = Math.round(takeoutLoanAmt * model.takeout.rate / 100);

  function buildFinancingRow(
    loanAmt: number, interest: number, principal: number, balanceAtSale: number,
  ) {
    const proceeds = cols.map((_, i) => i === YR0 ? loanAmt : 0);
    const intPmts = cols.map((_, i) => (i <= YR0 || i === 0) ? 0 : -interest);
    const prinPmts = cols.map((_, i) => (i <= YR0 || i === 0) ? 0 : -principal);
    const prinAtSale = cols.map((_, i) => i === 6 ? -balanceAtSale : 0);
    const net = cols.map((_, i) => proceeds[i] + intPmts[i] + prinPmts[i] + prinAtSale[i]);
    return { proceeds, intPmts, prinPmts, prinAtSale, net };
  }

  const seniorFlows = buildFinancingRow(seniorLoan, seniorInterest, seniorAnnualPrincipal, seniorBalanceAtSale);
  const mezzFlows = buildFinancingRow(mezzLoan, mezzInterest, mezzAnnualPrincipal, mezzBalanceAtSale);

  const takeoutFlows = cols.map((_, i) => {
    if (!takeoutEnabled) return 0;
    if (i === takeoutColIdx) return takeoutLoanAmt - takeoutCost - seniorBalanceAtSale - mezzBalanceAtSale;
    if (i > takeoutColIdx && i <= 6) return -takeoutInterest;
    return 0;
  });

  const seniorFlowsAdj = takeoutEnabled
    ? { ...seniorFlows, net: seniorFlows.net.map((v, i) => i > takeoutColIdx ? 0 : v) }
    : seniorFlows;
  const mezzFlowsAdj = takeoutEnabled
    ? { ...mezzFlows, net: mezzFlows.net.map((v, i) => i > takeoutColIdx ? 0 : v) }
    : mezzFlows;

  const totalFinancing = cols.map((_, i) => seniorFlowsAdj.net[i] + mezzFlowsAdj.net[i] + takeoutFlows[i]);

  const unleveredCF = noiValues.map((noi, i) => {
    if (i === YR0) return -totalAcquisition;
    if (i === 6) return noi + netSaleProceeds;
    return noi;
  });
  const leveredCF = unleveredCF.map((ucf, i) => ucf + totalFinancing[i]);

  return (
    <div className="px-1 pb-2">
      {/* Column headers */}
      <div className="flex items-center py-2.5 px-4 border-b border-border/50">
        <div className="w-[240px] shrink-0">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Cash Flow Projections
          </div>
        </div>
        {cols.map((c, i) => (
          <div key={c} className={cn(
            "flex-1 text-right text-[10px] font-semibold uppercase tracking-wider px-3",
            i === 0 ? "text-muted-foreground" : i === YR0 ? "text-muted-foreground/80" : "text-foreground/70"
          )}>
            {c}
          </div>
        ))}
      </div>

      {/* Growth rate assumptions (per-year, aligned with columns) */}
      <div className="bg-muted/20 border-b border-border/30">
        {[
          { label: "Income Growth", vals: ["", "", "3.0%", "3.0%", "3.0%", "3.0%", "3.0%"] },
          { label: "Expense Growth", vals: ["", "", "3.0%", "3.0%", "3.0%", "3.0%", "3.0%"] },
          { label: "Vacancy", vals: ["", "", "5.0%", "4.0%", "4.0%", "4.0%", "4.0%"] },
          { label: "Credit Loss", vals: ["", "", "2.0%", "1.5%", "1.0%", "1.0%", "1.0%"] },
        ].map((row) => (
          <div key={row.label} className="flex items-center py-[3px] px-4">
            <div className="w-[240px] shrink-0 text-[10px] text-muted-foreground font-medium">
              {row.label}
            </div>
            {row.vals.map((v, i) => (
              <div key={i} className="flex-1 text-right px-3">
                {v ? (
                  <span className="text-[10px] num font-semibold text-foreground/70 border-b border-dashed border-primary/25 cursor-text">
                    {v}
                  </span>
                ) : (
                  <span className="text-transparent text-[10px]">-</span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Revenue */}
      <ProFormaSection title="Revenue">
        <PFRow label="Gross Potential Rent" t12="$532,800" vals={["-", "$594,720", "$614,054", "$634,022", "$654,637", "$675,914"]} yr0={YR0} />
        <PFRow label="Other Income" t12="$18,000" vals={["-", "$24,720", "$25,462", "$26,225", "$27,012", "$27,823"]} yr0={YR0} />
        <PFRow label="Less: Vacancy" t12="($26,640)" vals={["-", "($30,972)", "($25,581)", "($25,614)", "($27,266)", "($28,149)"]} negative yr0={YR0} cellNotes={{ 2: { text: "2 units currently vacant. Lease-up expected by Q2 Year 1, bringing occupancy to 96%.", by: "Luis", date: "Mar 10" }}} />
        <PFRow label="Less: Credit Loss" t12="($7,728)" vals={["-", "($12,389)", "($9,597)", "($6,402)", "($6,816)", "($7,037)"]} negative yr0={YR0} />
        <PFTotalRow label="Effective Gross Income" vals={egiValues.map((v, i) => i === YR0 ? "-" : fmtDollar(v))} yr0={YR0} />
      </ProFormaSection>

      {/* Operating Expenses */}
      <div className="mt-1">
        <div className="flex items-center gap-2 px-4 pt-4 pb-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Operating Expenses
          </span>
          <div className="flex-1 h-px bg-border/40" />
          <div className="inline-flex gap-0.5 rounded-md p-[2px] bg-muted">
            {([
              { key: "none" as const, label: "$" },
              { key: "per_unit" as const, label: "$/Unit" },
              { key: "per_sf" as const, label: "$/SF" },
            ]).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setExpMetric(expMetric === opt.key ? "none" : opt.key)}
                className={cn(
                  "rounded px-2 py-0.5 text-[9px] font-semibold cursor-pointer transition-all",
                  expMetric === opt.key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col">
          {EXPENSE_DATA.map((exp) => {
            const displayValues = exp.pctOfEgi ? mgmtFeeValues : exp.values;
            return (
            <div key={exp.label} className="flex items-center py-[6px] px-4 rounded-md hover:bg-muted/40 transition-colors group">
              <div className="w-[240px] shrink-0 flex items-center gap-1.5">
                <span className="text-[12px] text-muted-foreground group-hover:text-foreground transition-colors">
                  {exp.label}
                </span>
                {exp.pctOfEgi && (
                  <span className="inline-flex items-center gap-0.5 rounded bg-muted px-1.5 py-[1px] border border-border/40">
                    <input
                      type="text"
                      value={mgmtFeePct.toFixed(1)}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        if (!isNaN(v) && v >= 0 && v <= 100) setMgmtFeePct(v);
                      }}
                      className="w-[28px] bg-transparent text-[10px] num font-semibold text-foreground text-right outline-none border-b border-dashed border-primary/30 focus:border-primary"
                    />
                    <span className="text-[9px] text-muted-foreground">% EGI</span>
                  </span>
                )}
              </div>
              {/* T-12 column */}
              <div className="flex-1 text-right px-3 relative">
                {exp.cellNotes?.[0] && <CellNote note={exp.cellNotes[0].text} by={exp.cellNotes[0].by} date={exp.cellNotes[0].date} />}
                <div className="text-[12px] num text-foreground/60">{fmtDollar(displayValues[0])}</div>
                {expMetric !== "none" && (() => {
                  const t12Comparison = metricVsBaseline(displayValues[0], expMetric, exp);
                  return (
                    <div className={cn(
                      "text-[9px] num mt-px",
                      t12Comparison === "above" && "text-emerald-500/60 dark:text-emerald-400/50",
                      t12Comparison === "below" && "text-red-500/60 dark:text-red-400/50",
                      t12Comparison === "neutral" && "text-muted-foreground/50",
                    )}>
                      {fmtMetric(displayValues[0], expMetric)}{expMetric === "per_unit" ? "/u" : "/sf"}
                    </div>
                  );
                })()}
              </div>
              {/* Year 0 + Year 1-5 columns */}
              {displayValues.slice(1).map((v, i) => {
                const colIdx = i + 1;
                const isYr0Col = i === 0;
                const cellNote = exp.cellNotes?.[colIdx];
                const comparison = !isYr0Col && expMetric !== "none" ? metricVsBaseline(v, expMetric, exp) : "neutral";
                if (isYr0Col) {
                  return (
                    <div key={i} className="flex-1 text-right px-3 text-muted-foreground/30 text-[12px] num">
                      -
                    </div>
                  );
                }
                const yr1Idx = 1;
                return (
                  <div key={i} className="flex-1 text-right px-3 group/cell relative">
                    {cellNote && <CellNote note={cellNote.text} by={cellNote.by} date={cellNote.date} />}
                    <div className={cn(
                      "text-[12px] num font-medium inline-block",
                      exp.pctOfEgi
                        ? "text-foreground/80"
                        : i === yr1Idx && !exp.overridden
                          ? "text-foreground border-b border-dashed border-primary/30 cursor-text"
                          : i === yr1Idx && exp.overridden
                            ? "text-foreground border-b border-dashed border-amber-400/60 cursor-text"
                            : "text-foreground/80"
                    )}>
                      {fmtDollar(v)}
                    </div>
                    {expMetric !== "none" && (
                      <div className={cn(
                        "text-[9px] num mt-px",
                        comparison === "above" && "text-emerald-500 dark:text-emerald-400",
                        comparison === "below" && "text-red-500 dark:text-red-400",
                        comparison === "neutral" && "text-muted-foreground",
                      )}>
                        {fmtMetric(v, expMetric)}{expMetric === "per_unit" ? "/u" : "/sf"}
                      </div>
                    )}
                    {!exp.pctOfEgi && i === yr1Idx && !exp.overridden && (
                      <div className="text-[8px] text-muted-foreground/40 mt-px hidden group-hover/cell:block">
                        {exp.defaultRate} {exp.defaultBasis}
                      </div>
                    )}
                    {!exp.pctOfEgi && i === yr1Idx && exp.overridden && (
                      <div className="text-[8px] text-amber-500/70 mt-px">override</div>
                    )}
                  </div>
                );
              })}
            </div>
            );
          })}
          {/* Total row */}
          <div className="flex items-center py-[7px] px-4 mt-0.5 border-t border-border/40">
            <div className="w-[240px] shrink-0 text-[12px] font-semibold text-foreground">Total Expenses</div>
            {totalExpByCol.map((v, i) => (
              <div key={i} className="flex-1 text-right px-3">
                {i === YR0 ? (
                  <div className="text-[12px] num text-muted-foreground/30">-</div>
                ) : (
                  <>
                    <div className={cn(
                      "text-[12px] font-semibold num",
                      i === 0 ? "text-foreground/60" : "text-foreground"
                    )}>{fmtDollar(v)}</div>
                    {expMetric !== "none" && (
                      <div className="text-[9px] font-semibold num text-muted-foreground mt-px">
                        {fmtMetric(v, expMetric)}{expMetric === "per_unit" ? "/u" : "/sf"}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* NOI highlight */}
      <div className="mx-3 my-2 rounded-lg bg-emerald-500/[0.06] dark:bg-emerald-500/10 px-4 py-3 flex items-center">
        <div className="w-[240px] shrink-0 text-[12px] font-semibold text-emerald-700 dark:text-emerald-400">
          Net Operating Income
        </div>
        {noiValues.map((v, i) => (
          <div key={i} className={cn(
            "flex-1 text-right text-[12px] font-bold num px-3",
            i === YR0 ? "text-muted-foreground/40" : v >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
          )}>
            {i === YR0 ? "-" : v >= 0 ? fmtDollar(v) : `(${fmtDollar(Math.abs(v))})`}
          </div>
        ))}
      </div>

      {/* Acquisition Costs */}
      <ProFormaSection title="Acquisition Costs">
        <PFRow label="Purchase Price" t12="" vals={[fmtDollarSigned(-purchasePrice), "", "", "", "", ""]} yr0={YR0} negative />
        <PFRow label="Closing Costs" t12="" vals={[fmtDollarSigned(-closingCosts), "", "", "", "", ""]} yr0={YR0} negative />
        <PFRow label="Origination Fee" t12="" vals={[fmtDollarSigned(-origFee), "", "", "", "", ""]} yr0={YR0} negative />
        <PFRow label="Total Reserves" t12="" vals={[fmtDollarSigned(-totalReserves), "", "", "", "", ""]} yr0={YR0} negative />
        <PFRow label="Improvement Budget" t12="" vals={[fmtDollarSigned(-improvementBudget), "", "", "", "", ""]} yr0={YR0} negative />
        <PFTotalRow label="Total Acquisition Costs" vals={["-", fmtDollarSigned(-totalAcquisition), "", "", "", "", ""]} yr0={YR0} />
      </ProFormaSection>

      {/* Final Sale (Year 5) */}
      <ProFormaSection title="Final Sale">
        <PFRow label="Gross Sale Proceeds" t12="" vals={["", "", "", "", "", fmtDollar(grossSalePrice)]} yr0={YR0} labelExtra={
          <span className="inline-flex items-center gap-0.5 rounded bg-muted px-1.5 py-[1px] border border-border/40 ml-1.5">
            <span className="text-[9px] text-muted-foreground">@</span>
            <input
              type="text"
              value={exitCapRate.toFixed(2)}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!isNaN(v) && v > 0 && v <= 100) setExitCapRate(v);
              }}
              className="w-[34px] bg-transparent text-[10px] num font-semibold text-foreground text-right outline-none border-b border-dashed border-primary/30 focus:border-primary"
            />
            <span className="text-[9px] text-muted-foreground">% cap</span>
          </span>
        } />
        <PFRow label={`Less: Transaction Costs (${(dispositionCostPct * 100).toFixed(1)}%)`} t12="" vals={["", "", "", "", "", fmtDollarSigned(-dispositionCosts)]} yr0={YR0} negative />
        <PFTotalRow label="Net Sale Proceeds" vals={["-", "", "", "", "", "", fmtDollar(netSaleProceeds)]} yr0={YR0} />
      </ProFormaSection>

      {/* Unlevered Net Cash Flow */}
      <CashFlowHighlight label="Unlevered Net Cash Flow" values={unleveredCF} color="blue" />

      {/* Acquisition Financing */}
      <FinancingSection
        title="Acquisition Financing"
        ltv={seniorLTV} setLTV={setSeniorLTV}
        rate={seniorRate} setRate={setSeniorRate}
        isIO={seniorIO} setIO={setSeniorIO}
        flows={seniorFlowsAdj}
        cols={cols} yr0={YR0}
      />

      {/* Mezz Financing */}
      <FinancingSection
        title="Mezz. Financing"
        ltv={mezzLTV} setLTV={setMezzLTV}
        rate={mezzRate} setRate={setMezzRate}
        isIO={mezzIO} setIO={setMezzIO}
        flows={mezzFlowsAdj}
        cols={cols} yr0={YR0}
      />

      {/* Takeout Financing */}
      {takeoutEnabled && (
        <div className="mt-1">
          <div className="flex items-center gap-2 px-4 pt-4 pb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Takeout Financing (Year {takeoutYear})
            </span>
            <div className="flex-1 h-px bg-border/40" />
            <span className="text-[9px] font-semibold text-primary bg-primary/10 border border-primary/30 rounded px-2 py-0.5">
              {fmtDollar(takeoutLoanAmt)}
            </span>
          </div>
          <div className="flex flex-col">
            <PFRow label="Takeout Proceeds" t12="" vals={takeoutFlows.slice(1).map(v => v > 0 ? fmtDollar(v) : v < 0 ? "" : "")} yr0={YR0} />
            <PFRow label="Senior Payoff" t12="" vals={cols.slice(1).map((_, i) => i + 1 === takeoutColIdx ? fmtDollarSigned(-seniorBalanceAtSale) : "")} yr0={YR0} negative />
            {mezzLoan > 0 && (
              <PFRow label="Mezz Payoff" t12="" vals={cols.slice(1).map((_, i) => i + 1 === takeoutColIdx ? fmtDollarSigned(-mezzBalanceAtSale) : "")} yr0={YR0} negative />
            )}
            <PFRow label={`Takeout Interest (${model.takeout.rate.toFixed(2)}%)`} t12="" vals={takeoutFlows.slice(1).map(v => v < 0 ? fmtDollarSigned(v) : "")} yr0={YR0} negative />
            <PFTotalRow label="Net Takeout" vals={["-", ...takeoutFlows.slice(1).map(v => v === 0 ? "" : fmtDollarSigned(v))]} yr0={YR0} />
          </div>
        </div>
      )}

      {/* Levered Net Cash Flow */}
      <CashFlowHighlight label="Levered Net Cash Flow" values={leveredCF} color="emerald" />

      {/* Returns */}
      <ProFormaSection title="Returns">
        <PFRow label="Cap Rate (Going-In)" t12="6.75%" vals={["", "", "", "", "", ""]} yr0={YR0} />
        <PFRow label="Cash-on-Cash" t12="" vals={["", "9.8%", "10.4%", "11.1%", "11.8%", "12.5%"]} yr0={YR0} />
        <ProFormaHighlightRow label="Equity Multiple" values={["", "", "", "", "", "", "2.1x"]} />
        <ProFormaHighlightRow label="Levered IRR" values={["", "", "", "", "", "", "18.4%"]} />
      </ProFormaSection>
    </div>
  );
}

function PFRow({ label, t12, vals, negative, cellNotes, yr0, labelExtra }: { label: string; t12: string; vals: string[]; negative?: boolean; cellNotes?: Record<number, CellNoteData>; yr0?: number; labelExtra?: React.ReactNode }) {
  return (
    <div className="flex items-center py-[6px] px-4 rounded-md hover:bg-muted/40 transition-colors group">
      <div className="w-[240px] shrink-0 flex items-center gap-1.5">
        <span className="text-[12px] text-muted-foreground group-hover:text-foreground transition-colors">
          {label}
        </span>
        {labelExtra}
      </div>
      <div className={cn(
        "flex-1 text-right text-[12px] num px-3 relative",
        !t12 ? "text-transparent" : "text-foreground/60"
      )}>
        {cellNotes?.[0] && <CellNote note={cellNotes[0].text} by={cellNotes[0].by} date={cellNotes[0].date} />}
        {t12 || "-"}
      </div>
      {vals.map((v, i) => {
        const colIdx = i + 1;
        const cn_ = cellNotes?.[colIdx];
        const isYr0 = yr0 !== undefined && i === 0;
        const isDash = v === "-" || !v;
        return (
          <div key={i} className={cn(
            "flex-1 text-right text-[12px] num px-3 relative",
            isDash && "text-muted-foreground/30",
            !isDash && negative && v.startsWith("(") ? "text-red-500 dark:text-red-400" : !isDash ? "text-foreground/80" : "",
            isYr0 && !isDash && "font-medium",
          )}>
            {cn_ && <CellNote note={cn_.text} by={cn_.by} date={cn_.date} />}
            {isDash ? "-" : v}
          </div>
        );
      })}
    </div>
  );
}

function PFTotalRow({ label, vals, yr0 }: { label: string; vals: string[]; yr0?: number }) {
  return (
    <div className="flex items-center py-[7px] px-4 mt-0.5 border-t border-border/40">
      <div className="w-[240px] shrink-0 text-[12px] font-semibold text-foreground">{label}</div>
      {vals.map((v, i) => {
        const isDash = v === "-" || !v;
        const isNeg = v.startsWith("(");
        return (
          <div key={i} className={cn(
            "flex-1 text-right text-[12px] font-semibold num px-3",
            isDash ? "text-muted-foreground/30" : isNeg ? "text-red-500 dark:text-red-400" : i === 0 ? "text-foreground/60" : "text-foreground"
          )}>
            {isDash ? "-" : v}
          </div>
        );
      })}
    </div>
  );
}

// ─── Rent Roll Tab ───

const RENT_ROLL_UNITS = [
  { unit: "101", type: "2BR/1BA", sf: 850, tenant: "J. Smith", status: "occupied" as const, leaseStart: "03/01/25", leaseEnd: "02/28/26", currentRent: 1800, marketRent: 1950 },
  { unit: "102", type: "1BR/1BA", sf: 625, tenant: "M. Johnson", status: "occupied" as const, leaseStart: "06/15/25", leaseEnd: "06/14/26", currentRent: 1450, marketRent: 1550 },
  { unit: "103", type: "2BR/2BA", sf: 950, tenant: null, status: "vacant" as const, leaseStart: null, leaseEnd: null, currentRent: null, marketRent: 2100 },
  { unit: "104", type: "3BR/2BA", sf: 1200, tenant: "A. Williams", status: "occupied" as const, leaseStart: "01/01/26", leaseEnd: "12/31/26", currentRent: 2400, marketRent: 2500 },
  { unit: "105", type: "1BR/1BA", sf: 600, tenant: "R. Davis", status: "occupied" as const, leaseStart: "09/01/25", leaseEnd: "08/31/26", currentRent: 1350, marketRent: 1475 },
  { unit: "106", type: "2BR/1BA", sf: 875, tenant: "K. Brown", status: "occupied" as const, leaseStart: "04/01/25", leaseEnd: "03/31/26", currentRent: 1850, marketRent: 1975 },
  { unit: "107", type: "2BR/2BA", sf: 925, tenant: null, status: "vacant" as const, leaseStart: null, leaseEnd: null, currentRent: null, marketRent: 2050 },
  { unit: "108", type: "1BR/1BA", sf: 650, tenant: "T. Martinez", status: "occupied" as const, leaseStart: "11/01/25", leaseEnd: "10/31/26", currentRent: 1500, marketRent: 1600 },
  { unit: "109", type: "2BR/1BA", sf: 850, tenant: "S. Garcia", status: "occupied" as const, leaseStart: "07/01/25", leaseEnd: "06/30/26", currentRent: 1825, marketRent: 1950 },
  { unit: "110", type: "3BR/2BA", sf: 1200, tenant: "P. Lee", status: "occupied" as const, leaseStart: "02/01/26", leaseEnd: "01/31/27", currentRent: 2350, marketRent: 2500 },
  { unit: "201", type: "2BR/2BA", sf: 950, tenant: "D. Wilson", status: "occupied" as const, leaseStart: "08/15/25", leaseEnd: "08/14/26", currentRent: 1900, marketRent: 2100 },
  { unit: "202", type: "1BR/1BA", sf: 625, tenant: "J. Clark", status: "occupied" as const, leaseStart: "05/01/25", leaseEnd: "04/30/26", currentRent: 1475, marketRent: 1550 },
];

function NativeRentRoll() {
  const [uploadStep, setUploadStep] = useState<"complete" | "upload" | "mapping">("complete");

  const occupied = RENT_ROLL_UNITS.filter((u) => u.status === "occupied");
  const totalMonthly = occupied.reduce((sum, u) => sum + (u.currentRent ?? 0), 0);
  const avgRent = Math.round(totalMonthly / occupied.length);
  const totalSf = RENT_ROLL_UNITS.reduce((sum, u) => sum + u.sf, 0);

  return (
    <div className="px-1 pb-4">
      {/* Summary metrics */}
      <div className="grid grid-cols-5 gap-3 p-4">
        {[
          { label: "Total Units", value: String(RENT_ROLL_UNITS.length) },
          { label: "Occupancy", value: `${((occupied.length / RENT_ROLL_UNITS.length) * 100).toFixed(1)}%` },
          { label: "Avg Rent", value: `$${avgRent.toLocaleString()}` },
          { label: "Monthly GPR", value: `$${totalMonthly.toLocaleString()}` },
          { label: "Total SF", value: totalSf.toLocaleString() },
        ].map((m) => (
          <div key={m.label} className="rounded-lg bg-muted/40 px-3.5 py-2.5">
            <div className="text-[10px] text-muted-foreground">{m.label}</div>
            <div className="text-[15px] font-semibold num text-foreground">{m.value}</div>
          </div>
        ))}
      </div>

      {/* Actions bar */}
      <div className="flex items-center gap-2 px-4 pb-3">
        <button
          onClick={() => setUploadStep("upload")}
          className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium cursor-pointer hover:bg-muted transition-colors"
        >
          <Upload className="h-3.5 w-3.5" strokeWidth={1.5} />
          Upload Rent Roll
        </button>
        <button className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium cursor-pointer hover:bg-muted transition-colors">
          <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
          Add Unit
        </button>
        <div className="flex-1" />
        <div className="text-[10px] text-muted-foreground">
          {RENT_ROLL_UNITS.length} of 24 units shown
        </div>
        <div className="inline-flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.5} />
          Synced
        </div>
      </div>

      {/* Upload overlay */}
      {uploadStep === "upload" && (
        <div className="mx-4 mb-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/[0.02] dark:bg-primary/[0.04] p-8 text-center">
          <Upload className="h-8 w-8 text-primary/40 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-sm font-medium text-foreground mb-1">Drop your rent roll here</p>
          <p className="text-[12px] text-muted-foreground mb-4">Excel, CSV, or PDF accepted</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setUploadStep("mapping")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-[12px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5" />
              Browse Files
            </button>
            <button
              onClick={() => setUploadStep("complete")}
              className="rounded-lg border px-4 py-2 text-[12px] font-medium text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Field mapping overlay */}
      {uploadStep === "mapping" && (
        <div className="mx-4 mb-4 rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
            <span className="text-sm font-medium">Map Your Fields</span>
            <span className="text-[11px] text-muted-foreground ml-1">RentRoll_Q1_2026.xlsx</span>
          </div>
          <div className="space-y-2">
            {[
              { source: "Unit #", target: "Unit", matched: true },
              { source: "Unit Type", target: "Type (BR/BA)", matched: true },
              { source: "Sq Ft", target: "SF", matched: true },
              { source: "Resident Name", target: "Tenant", matched: true },
              { source: "Lease From", target: "Lease Start", matched: true },
              { source: "Lease To", target: "Lease End", matched: true },
              { source: "Monthly Rent", target: "Current Rent", matched: true },
              { source: "Column H", target: "-- Select field --", matched: false },
            ].map((field) => (
              <div key={field.source} className="flex items-center gap-3">
                <div className="w-[180px] text-[12px] text-muted-foreground bg-muted/40 rounded-md px-3 py-1.5 truncate">
                  {field.source}
                </div>
                <ArrowUpRight className="h-3 w-3 text-muted-foreground/40 rotate-90" />
                <div className={cn(
                  "flex-1 text-[12px] rounded-md px-3 py-1.5 border",
                  field.matched
                    ? "text-foreground bg-emerald-500/[0.04] border-emerald-500/20"
                    : "text-muted-foreground border-border"
                )}>
                  {field.target}
                </div>
                {field.matched && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" strokeWidth={1.5} />}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border/50">
            <button
              onClick={() => setUploadStep("complete")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-[12px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Import 12 Units
            </button>
            <button
              onClick={() => setUploadStep("complete")}
              className="rounded-lg border px-4 py-2 text-[12px] font-medium text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <div className="flex-1" />
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400">7 of 8 fields auto-matched</span>
          </div>
        </div>
      )}

      {/* Rent roll table */}
      <div className="px-3">
        {/* Column headers */}
        <div className="flex items-center py-2 px-2 border-b border-border/50">
          {[
            { label: "Unit", w: "w-[60px]" },
            { label: "Type", w: "w-[80px]" },
            { label: "SF", w: "w-[60px]", right: true },
            { label: "Tenant", w: "flex-1" },
            { label: "Status", w: "w-[90px]" },
            { label: "Lease", w: "w-[140px]" },
            { label: "Current", w: "w-[90px]", right: true },
            { label: "Market", w: "w-[90px]", right: true },
            { label: "Delta", w: "w-[70px]", right: true },
          ].map((col) => (
            <div key={col.label} className={cn("text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2", col.w, col.right && "text-right")}>
              {col.label}
            </div>
          ))}
        </div>

        {/* Rows */}
        {RENT_ROLL_UNITS.map((unit) => {
          const delta = unit.currentRent && unit.marketRent ? unit.marketRent - unit.currentRent : null;
          return (
            <div key={unit.unit} className={cn("flex items-center py-[7px] px-2 rounded-md hover:bg-muted/40 transition-colors group", unit.status === "vacant" && "bg-amber-500/[0.03] dark:bg-amber-500/[0.05]")}>
              <div className="w-[60px] text-[12px] font-medium text-foreground px-2">{unit.unit}</div>
              <div className="w-[80px] text-[11px] text-muted-foreground px-2">{unit.type}</div>
              <div className="w-[60px] text-[11px] num text-muted-foreground text-right px-2">{unit.sf.toLocaleString()}</div>
              <div className="flex-1 text-[12px] px-2">
                {unit.tenant ? (
                  <span className="text-foreground">{unit.tenant}</span>
                ) : (
                  <span className="text-muted-foreground/50 italic">Vacant</span>
                )}
              </div>
              <div className="w-[90px] px-2">
                <span className={cn(
                  "inline-flex items-center gap-1.5 text-[11px]",
                  unit.status === "occupied" ? "text-foreground" : "text-amber-600 dark:text-amber-400"
                )}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", unit.status === "occupied" ? "bg-emerald-500" : "bg-amber-500")} />
                  {unit.status === "occupied" ? "Occupied" : "Vacant"}
                </span>
              </div>
              <div className="w-[140px] text-[11px] text-muted-foreground px-2 num">
                {unit.leaseStart && unit.leaseEnd ? `${unit.leaseStart} - ${unit.leaseEnd}` : "--"}
              </div>
              <div className="w-[90px] text-[12px] num text-right px-2">
                {unit.currentRent ? `$${unit.currentRent.toLocaleString()}` : <span className="text-muted-foreground/40">--</span>}
              </div>
              <div className="w-[90px] text-[12px] num text-right px-2 text-muted-foreground">
                ${unit.marketRent.toLocaleString()}
              </div>
              <div className="w-[70px] text-right px-2">
                {delta !== null ? (
                  <span className={cn("text-[11px] num", delta > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-foreground/60")}>
                    {delta > 0 ? `+$${delta}` : "$0"}
                  </span>
                ) : (
                  <span className="text-[11px] text-muted-foreground/40">--</span>
                )}
              </div>
            </div>
          );
        })}

        {/* Totals */}
        <div className="flex items-center py-2.5 px-2 mt-1 border-t border-border/50">
          <div className="w-[60px] text-[12px] font-semibold text-foreground px-2">Total</div>
          <div className="w-[80px] px-2" />
          <div className="w-[60px] text-[11px] num text-right font-semibold text-foreground px-2">{totalSf.toLocaleString()}</div>
          <div className="flex-1 px-2" />
          <div className="w-[90px] px-2" />
          <div className="w-[140px] px-2" />
          <div className="w-[90px] text-[12px] num text-right font-semibold text-foreground px-2">${totalMonthly.toLocaleString()}</div>
          <div className="w-[90px] text-[12px] num text-right font-semibold text-muted-foreground px-2">
            ${RENT_ROLL_UNITS.reduce((s, u) => s + u.marketRent, 0).toLocaleString()}
          </div>
          <div className="w-[70px] text-right px-2">
            <span className="text-[11px] num text-emerald-600 dark:text-emerald-400 font-semibold">
              +${(RENT_ROLL_UNITS.reduce((s, u) => s + u.marketRent, 0) - totalMonthly).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Property Sub-tabs ───

function PropertyDetails() {
  const groups = [
    { title: "Address", icon: Building2, items: [
      { label: "Street", value: "123 Main St" },
      { label: "City", value: "Austin" },
      { label: "State", value: "TX" },
      { label: "Zip", value: "78701" },
      { label: "County", value: "Travis" },
    ]},
    { title: "Property Info", icon: Building2, items: [
      { label: "Property Type", value: "Multifamily" },
      { label: "Sub-Type", value: "Garden-Style" },
      { label: "Year Built", value: "1998" },
      { label: "Renovated", value: "2024" },
      { label: "Units", value: "24" },
      { label: "Total SF", value: "19,750" },
      { label: "Avg Unit SF", value: "823", computed: true },
      { label: "Lot (Acres)", value: "1.8" },
      { label: "Stories", value: "3" },
      { label: "Parking", value: "36" },
    ]},
    { title: "Unit Mix", icon: Table2, items: [
      { label: "Studios", value: "0" },
      { label: "1-Bed", value: "8 units (33%)" },
      { label: "2-Bed", value: "12 units (50%)" },
      { label: "3-Bed", value: "4 units (17%)" },
    ]},
  ];

  return (
    <div className="flex flex-col gap-3">
      <SectionHeader title="Property Info" />
      {/* Key metrics banner */}
      <div className="grid grid-cols-5 gap-3">
        <MetricCard label="Type" value="Multifamily" />
        <MetricCard label="Units" value="24" />
        <MetricCard label="Total SF" value="19,750" />
        <MetricCard label="Year Built" value="1998" />
        <MetricCard label="Price / Unit" value="$520,833" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {groups.map((group) => {
          const Icon = group.icon;
          return (
            <div key={group.title} className="rounded-xl border bg-card">
              <div className="flex items-center gap-2 px-3.5 pt-3 pb-1.5">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {group.title}
                </span>
              </div>
              <div className="flex flex-col px-1.5 pb-2">
                {group.items.map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-[4px] px-2 rounded-md hover:bg-muted/40 transition-colors group">
                    <span className="text-[11px] text-muted-foreground group-hover:text-foreground transition-colors">{item.label}</span>
                    <span className={cn(
                      "text-[11px] num font-medium",
                      item.computed ? "text-muted-foreground italic" : "text-foreground"
                    )}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const T12_INCOME = [
  { category: "Gross Potential Rent", t12: "$532,800", monthly: "$44,400" },
  { category: "Loss to Lease", t12: "($13,320)", monthly: "($1,110)", negative: true },
  { category: "Vacancy Loss", t12: "($26,640)", monthly: "($2,220)", negative: true },
  { category: "Concessions", t12: "($2,400)", monthly: "($200)", negative: true },
  { category: "Bad Debt", t12: "($5,328)", monthly: "($444)", negative: true },
  { category: "Net Rental Income", t12: "$485,112", monthly: "$40,426", total: true },
  { category: "Other Income", t12: "$18,000", monthly: "$1,500" },
  { category: "Effective Gross Income", t12: "$503,112", monthly: "$41,926", total: true },
];

const T12_EXPENSES = [
  { category: "Property Taxes", t12: "$62,500", perUnit: "$2,604", pctEGI: "12.4%" },
  { category: "Insurance", t12: "$38,400", perUnit: "$1,600", pctEGI: "7.6%" },
  { category: "Repairs & Maintenance", t12: "$42,000", perUnit: "$1,750", pctEGI: "8.3%" },
  { category: "Management Fee", t12: "$30,187", perUnit: "$1,258", pctEGI: "6.0%" },
  { category: "Utilities", t12: "$28,800", perUnit: "$1,200", pctEGI: "5.7%" },
  { category: "Payroll", t12: "$24,000", perUnit: "$1,000", pctEGI: "4.8%" },
  { category: "Administrative", t12: "$8,400", perUnit: "$350", pctEGI: "1.7%" },
  { category: "Marketing", t12: "$6,000", perUnit: "$250", pctEGI: "1.2%" },
  { category: "Replacement Reserves", t12: "$6,000", perUnit: "$250", pctEGI: "1.2%" },
];

function T12Historicals() {
  const t12Actions = (
    <div className="flex items-center gap-2">
      <button className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium cursor-pointer hover:bg-muted transition-colors">
        <Upload className="h-3 w-3" strokeWidth={1.5} />
        Upload T12
      </button>
      <button className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium cursor-pointer hover:bg-muted transition-colors">
        <Plus className="h-3 w-3" strokeWidth={1.5} />
        Add Line Item
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      <SectionHeader title="T12 / Historicals" badge="Feeds into Pro Forma" action={t12Actions} />

      {/* Summary metrics */}
      <div className="grid grid-cols-4 gap-3">
        <MetricCard label="T12 EGI" value="$503,112" />
        <MetricCard label="T12 Expenses" value="$246,287" />
        <MetricCard label="T12 NOI" value="$256,825" />
        <MetricCard label="Expense Ratio" value="48.9%" />
      </div>

      {/* Income table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="flex items-center gap-2 px-4 pt-3.5 pb-2">
          <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Income</span>
        </div>
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="px-4 py-2 text-left font-medium text-muted-foreground w-[45%]">Category</th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground">T-12 Annual</th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground">Monthly</th>
            </tr>
          </thead>
          <tbody>
            {T12_INCOME.map((row) => (
              <tr key={row.category} className={cn(
                "border-b border-border/30",
                row.total && "bg-muted/20"
              )}>
                <td className={cn("px-4 py-2", row.total ? "font-semibold text-foreground" : "text-foreground/80")}>{row.category}</td>
                <td className={cn(
                  "px-3 py-2 text-right num",
                  row.total ? "font-semibold text-foreground" : row.negative ? "text-red-500 dark:text-red-400" : "text-foreground/80"
                )}>{row.t12}</td>
                <td className={cn(
                  "px-3 py-2 text-right num",
                  row.total ? "font-semibold text-foreground" : row.negative ? "text-red-500/70 dark:text-red-400/70" : "text-foreground/60"
                )}>{row.monthly}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Expense table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="flex items-center gap-2 px-4 pt-3.5 pb-2">
          <Receipt className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Operating Expenses</span>
        </div>
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="px-4 py-2 text-left font-medium text-muted-foreground w-[40%]">Category</th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground">T-12 Annual</th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground">Per Unit</th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground">% of EGI</th>
            </tr>
          </thead>
          <tbody>
            {T12_EXPENSES.map((row) => (
              <tr key={row.category} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-2 text-foreground/80">{row.category}</td>
                <td className="px-3 py-2 text-right num text-foreground/80">{row.t12}</td>
                <td className="px-3 py-2 text-right num text-foreground/60">{row.perUnit}</td>
                <td className="px-3 py-2 text-right num text-foreground/60">{row.pctEGI}</td>
              </tr>
            ))}
            <tr className="bg-muted/20">
              <td className="px-4 py-2 font-semibold text-foreground">Total Expenses</td>
              <td className="px-3 py-2 text-right font-semibold num text-foreground">$246,287</td>
              <td className="px-3 py-2 text-right font-semibold num text-foreground">$10,262</td>
              <td className="px-3 py-2 text-right font-semibold num text-foreground">48.9%</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* NOI summary */}
      <div className="rounded-xl border bg-primary/[0.04] dark:bg-primary/[0.08] p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">T-12 Net Operating Income</div>
            <div className="text-2xl font-bold num text-primary mt-1">$256,825</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">NOI Per Unit</div>
            <div className="text-lg font-semibold num text-foreground mt-1">$10,701</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Implied Cap Rate</div>
            <div className="text-lg font-semibold num text-foreground mt-1">2.05%</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Inputs Tab (delegates to assumptions) ───

function NativeInputs() {
  return <NativeAssumptions />;
}

function NativeAssumptions() {
  return (
    <div className="px-4 pb-6 pt-2">
      <div className="flex items-center gap-2 mb-5">
        <div className="flex-1">
          <p className="text-[12px] text-muted-foreground">
            Exit, financing, and deal-level assumptions. Growth rates and occupancy live at the top of the Operating Statement.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.5} />
          Synced to model
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="flex flex-col gap-5">
          <InputSection title="Exit Assumptions" icon={ArrowUpRight}>
            <InputRow label="Hold Period" value="5 years" editable />
            <InputRow label="Exit Cap Rate" value="7.00%" editable />
            <InputRow label="Disposition Fee" value="2.0%" editable />
            <InputRow label="Sale Costs" value="1.0%" editable />
            <InputRow label="Projected Sale Price" value="$6,134,543" computed />
          </InputSection>

          <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-4">
            <div className="flex items-center gap-2 mb-3">
              <LinkIcon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                From Sources & Uses
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <LinkedFieldRow label="Senior Rate" value="7.00%" source="S&U" />
              <LinkedFieldRow label="Loan Term" value="5 years" source="S&U" />
              <LinkedFieldRow label="Amortization" value="I/O" source="S&U" />
              <LinkedFieldRow label="Origination Fee" value="0.75%" source="S&U" />
              <LinkedFieldRow label="Takeout Rate" value="6.00%" source="S&U" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {/* Linked fields from other tabs */}
          <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-4">
            <div className="flex items-center gap-2 mb-3">
              <LinkIcon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                Pulled from deal
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <LinkedFieldRow label="Purchase Price" value="$12,500,000" source="Overview" />
              <LinkedFieldRow label="Loan Amount" value="$9,375,000" source="Overview" />
              <LinkedFieldRow label="Units" value="24" source="Property" />
              <LinkedFieldRow label="Total SF" value="19,750" source="Property" />
              <LinkedFieldRow label="Year Built" value="1998" source="Property" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LinkedFieldRow({ label, value, source }: { label: string; value: string; source: string }) {
  return (
    <div className="flex items-center justify-between py-[5px] px-2 rounded-md">
      <span className="text-[12px] text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-[12px] num font-medium text-muted-foreground">{value}</span>
        <span className="text-[8px] uppercase tracking-wider text-muted-foreground/40 font-semibold">{source}</span>
      </div>
    </div>
  );
}

function SUCollapsible({ title, icon: Icon, expanded, onToggle, badge, children }: {
  title: string; icon: typeof DollarSign; expanded: boolean; onToggle: () => void; badge?: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <button onClick={onToggle} className="flex items-center gap-2.5 w-full px-4 py-3 text-left hover:bg-muted/30 transition-colors cursor-pointer">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
        <span className="text-[12px] font-semibold text-foreground">{title}</span>
        {badge && <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] font-medium text-muted-foreground">{badge}</span>}
        <div className="flex-1" />
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", !expanded && "-rotate-90")} strokeWidth={1.5} />
      </button>
      {expanded && <div className="border-t">{children}</div>}
    </div>
  );
}

function SUFieldRow({ label, value, suffix, computed, onChange, width }: {
  label: string; value: string; suffix?: string; computed?: boolean; onChange?: (v: string) => void; width?: string;
}) {
  return (
    <div className="flex items-center justify-between py-[5px] px-3 rounded-md hover:bg-muted/40 transition-colors group">
      <span className="text-[12px] text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
      <div className="flex items-center gap-1.5">
        {onChange ? (
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={cn("text-right text-[12px] num font-medium text-foreground bg-transparent outline-none border-b border-dashed border-border/60 focus:border-primary/60", width ?? "w-[70px]")}
          />
        ) : (
          <span className={cn("text-[12px] num font-medium", computed ? "text-muted-foreground italic" : "text-foreground")}>{value}</span>
        )}
        {suffix && <span className="text-[10px] text-muted-foreground">{suffix}</span>}
        {computed && <span className="text-[8px] uppercase tracking-wider text-muted-foreground/50 font-semibold">calc</span>}
      </div>
    </div>
  );
}

function NativeSourcesUses() {
  const { model, update, updateSenior, updateMezz, updateTakeout, setModel, noiValues } = useDealModel();
  const [sections, setSections] = useState<Record<string, boolean>>({
    summary: true, senior: true, mezz: false, closing: true, construction: true, reserves: true, takeout: true,
  });
  const toggle = (k: string) => setSections(prev => ({ ...prev, [k]: !prev[k] }));

  const pp = model.purchasePrice;
  const seniorLoan = Math.round(pp * model.senior.ltv / 100);
  const mezzLoan = Math.round(pp * model.mezz.ltv / 100);
  const seniorOrigFee = Math.round(seniorLoan * model.senior.origFeePct / 100);
  const totalCC = model.closingCosts.reduce((s, c) => s + c.amount, 0);
  const totalRes = model.reserves.reduce((s, r) => s + r.amount, 0);

  let totalBudget = 0;
  if (model.budgetMode === "value_add") {
    const li = model.valueAddCategories.reduce((s, cat) => s + cat.items.reduce((si, item) => si + item.qty * item.unitCost, 0), 0);
    totalBudget = li + Math.round(li * model.valueAddContingencyPct / 100);
  } else {
    const hard = model.groundUpSections.find(s => s.id === "gu-hard")?.items.reduce((s, i) => s + i.amount, 0) ?? 0;
    const soft = model.groundUpSections.find(s => s.id === "gu-soft")?.items.reduce((s, i) => s + i.amount, 0) ?? 0;
    const gc = Math.round(hard * model.groundUpGCFeePct / 100);
    const sub = hard + soft + gc;
    totalBudget = sub + Math.round(hard * model.groundUpContingencyPct / 100) + Math.round(sub * model.groundUpDevFeePct / 100);
  }

  const totalUses = pp + totalCC + seniorOrigFee + totalRes + totalBudget;
  const totalDebt = seniorLoan + mezzLoan;
  const sponsorEquity = totalUses - totalDebt;
  const combinedLTV = model.senior.ltv + model.mezz.ltv;

  const seniorAnnualDS = model.senior.io
    ? Math.round(seniorLoan * model.senior.rate / 100)
    : Math.round(calcMonthlyPmt(seniorLoan, model.senior.rate, model.senior.amort) * 12);
  const mezzAnnualDS = model.mezz.io
    ? Math.round(mezzLoan * model.mezz.rate / 100)
    : Math.round(mezzLoan * model.mezz.rate / 100);
  const totalAnnualDS = seniorAnnualDS + mezzAnnualDS;

  const yr1NOI = noiValues[2];
  const t12NOI = noiValues[0];
  const seniorDSCR = seniorAnnualDS > 0 ? yr1NOI / seniorAnnualDS : 0;
  const combinedDSCR = totalAnnualDS > 0 ? yr1NOI / totalAnnualDS : 0;
  const debtYield = seniorLoan > 0 ? yr1NOI / seniorLoan : 0;
  const blendedRate = totalDebt > 0 ? (seniorLoan * model.senior.rate + mezzLoan * model.mezz.rate) / totalDebt : 0;

  const pctOf = (n: number) => totalUses > 0 ? ((n / totalUses) * 100).toFixed(1) + "%" : "0.0%";
  const fmt = (n: number) => "$" + n.toLocaleString();

  const takeoutNOI = noiValues[Math.min(model.takeout.year + 1, noiValues.length - 1)] ?? noiValues[noiValues.length - 1];
  const takeoutAppraised = model.exitCapRate > 0 ? Math.round(takeoutNOI / (model.exitCapRate / 100)) : 0;
  const takeoutLTVMax = Math.round(takeoutAppraised * model.takeout.maxLTV / 100);
  const takeoutDSCRMax = calcMaxLoanFromDSCR(takeoutNOI, model.takeout.dscrFloor, model.takeout.rate, model.takeout.amort);
  const takeoutMaxLoan = Math.min(takeoutLTVMax, takeoutDSCRMax);
  const takeoutGoverning = takeoutLTVMax <= takeoutDSCRMax ? "LTV" : "DSCR";
  const takeoutPayoff = seniorLoan + mezzLoan;
  const takeoutCostPct = 1.25;
  const takeoutCosts = Math.round(takeoutMaxLoan * takeoutCostPct / 100);
  const takeoutNetProceeds = takeoutMaxLoan - takeoutPayoff - takeoutCosts;

  const stressRates = [5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0];
  const stressDSCRs = [1.15, 1.20, 1.25, 1.30, 1.35];
  const stressMatrix = stressRates.map(rate => ({
    rate,
    cells: stressDSCRs.map(dscr => {
      const maxL = Math.min(
        Math.round(takeoutAppraised * model.takeout.maxLTV / 100),
        calcMaxLoanFromDSCR(takeoutNOI, dscr, rate, model.takeout.amort)
      );
      return maxL - takeoutPayoff - Math.round(maxL * takeoutCostPct / 100);
    }),
  }));

  return (
    <div className="flex flex-col gap-4">
      {/* ── 1. Going-In Capital Stack Summary ── */}
      <SUCollapsible title="Going-In Capital Stack" icon={TrendingUp} expanded={sections.summary} onToggle={() => toggle("summary")}>
        <div className="p-4">
          <div className="grid grid-cols-5 gap-3 mb-4">
            <MetricCard label="Total Sources" value={fmt(totalUses)} />
            <MetricCard label="Total Uses" value={fmt(totalUses)} />
            <MetricCard label="Blended LTV" value={`${combinedLTV.toFixed(1)}%`} />
            <MetricCard label="Combined DSCR" value={combinedDSCR > 0 ? `${combinedDSCR.toFixed(2)}x` : "N/A"} />
            <MetricCard label="Blended Rate" value={blendedRate > 0 ? `${blendedRate.toFixed(2)}%` : "N/A"} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border bg-card/50">
              <div className="flex items-center gap-2 px-4 pt-3 pb-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600" strokeWidth={1.5} />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Sources</span>
              </div>
              <div className="flex flex-col px-2 pb-3">
                <div className="flex items-center justify-between py-[5px] px-2 rounded-md hover:bg-muted/40 transition-colors">
                  <span className="text-[12px] text-foreground">Senior Loan</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[12px] num font-medium text-foreground">{fmt(seniorLoan)}</span>
                    <span className="text-[11px] num text-muted-foreground w-12 text-right">{pctOf(seniorLoan)}</span>
                  </div>
                </div>
                {mezzLoan > 0 && (
                  <div className="flex items-center justify-between py-[5px] px-2 rounded-md hover:bg-muted/40 transition-colors">
                    <span className="text-[12px] text-foreground">Mezzanine</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[12px] num font-medium text-foreground">{fmt(mezzLoan)}</span>
                      <span className="text-[11px] num text-muted-foreground w-12 text-right">{pctOf(mezzLoan)}</span>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between py-[5px] px-2 rounded-md hover:bg-muted/40 transition-colors">
                  <span className="text-[12px] text-foreground">Sponsor Equity</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[12px] num font-medium text-foreground">{fmt(sponsorEquity)}</span>
                    <span className="text-[11px] num text-muted-foreground w-12 text-right">{pctOf(sponsorEquity)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-[5px] px-2 mt-1 border-t border-border/40">
                  <span className="text-[12px] font-semibold">Total</span>
                  <span className="text-[12px] num font-semibold">{fmt(totalUses)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-card/50">
              <div className="flex items-center gap-2 px-4 pt-3 pb-1.5">
                <Receipt className="h-3.5 w-3.5 text-blue-600" strokeWidth={1.5} />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Uses</span>
              </div>
              <div className="flex flex-col px-2 pb-3">
                {[
                  { name: "Purchase Price", val: pp },
                  { name: "Closing Costs", val: totalCC },
                  { name: "Origination Fee", val: seniorOrigFee },
                  { name: "Construction / Rehab", val: totalBudget },
                  { name: "Reserves", val: totalRes },
                ].map(u => (
                  <div key={u.name} className="flex items-center justify-between py-[5px] px-2 rounded-md hover:bg-muted/40 transition-colors">
                    <span className="text-[12px] text-foreground">{u.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[12px] num font-medium text-foreground">{fmt(u.val)}</span>
                      <span className="text-[11px] num text-muted-foreground w-12 text-right">{pctOf(u.val)}</span>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between py-[5px] px-2 mt-1 border-t border-border/40">
                  <span className="text-[12px] font-semibold">Total</span>
                  <span className="text-[12px] num font-semibold">{fmt(totalUses)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Capital Stack Bar */}
          <div className="mt-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">Capital Stack</div>
            <div className="flex h-7 rounded-full overflow-hidden border">
              {seniorLoan > 0 && (
                <div className="bg-primary/80 flex items-center justify-center" style={{ width: `${(seniorLoan / totalUses * 100).toFixed(1)}%` }}>
                  <span className="text-[9px] font-semibold text-primary-foreground">Senior {model.senior.ltv.toFixed(0)}%</span>
                </div>
              )}
              {mezzLoan > 0 && (
                <div className="bg-amber-500/80 flex items-center justify-center" style={{ width: `${(mezzLoan / totalUses * 100).toFixed(1)}%` }}>
                  <span className="text-[9px] font-semibold text-white">Mezz {model.mezz.ltv.toFixed(0)}%</span>
                </div>
              )}
              <div className="bg-emerald-500/70 flex items-center justify-center" style={{ width: `${(sponsorEquity / totalUses * 100).toFixed(1)}%` }}>
                <span className="text-[9px] font-semibold text-white">Equity {(sponsorEquity / totalUses * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>
      </SUCollapsible>

      {/* ── 2. Going-In Purchase Loan (Senior) ── */}
      <SUCollapsible title="Going-In Purchase Loan (Senior)" icon={DollarSign} expanded={sections.senior} onToggle={() => toggle("senior")} badge={fmt(seniorLoan)}>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-0.5">
              <SUFieldRow label="Loan Amount" value={fmt(seniorLoan)} computed />
              <SUFieldRow label="LTV" value={model.senior.ltv.toFixed(1)} suffix="%" onChange={v => { const n = parseFloat(v); if (!isNaN(n)) updateSenior({ ltv: n }); }} />
              <SUFieldRow label="Interest Rate" value={model.senior.rate.toFixed(2)} suffix="%" onChange={v => { const n = parseFloat(v); if (!isNaN(n)) updateSenior({ rate: n }); }} />
              <SUFieldRow label="Loan Term" value={model.senior.term.toString()} suffix="years" onChange={v => { const n = parseInt(v); if (!isNaN(n)) updateSenior({ term: n }); }} />
              <SUFieldRow label="Amortization" value={model.senior.io ? "Interest Only" : `${model.senior.amort} years`} computed={model.senior.io} />
              <div className="flex items-center justify-between py-[5px] px-3 rounded-md hover:bg-muted/40 transition-colors">
                <span className="text-[12px] text-muted-foreground">I/O or Amortizing</span>
                <div className="inline-flex gap-0.5 rounded-md p-[2px] bg-muted">
                  {(["IO", "Amort"] as const).map(opt => (
                    <button key={opt} onClick={() => updateSenior({ io: opt === "IO" })} className={cn(
                      "rounded px-2.5 py-0.5 text-[10px] font-semibold cursor-pointer transition-all",
                      (opt === "IO" ? model.senior.io : !model.senior.io) ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}>{opt}</button>
                  ))}
                </div>
              </div>
              <SUFieldRow label="Origination Fee" value={model.senior.origFeePct.toFixed(2)} suffix={`% (${fmt(seniorOrigFee)})`} onChange={v => { const n = parseFloat(v); if (!isNaN(n)) updateSenior({ origFeePct: n }); }} />
              <div className="flex items-center justify-between py-[5px] px-3 rounded-md hover:bg-muted/40 transition-colors">
                <span className="text-[12px] text-muted-foreground">Prepayment</span>
                <select value={model.senior.prepayType} onChange={e => updateSenior({ prepayType: e.target.value })} className="text-[12px] num font-medium bg-transparent border-b border-dashed border-border/60 outline-none cursor-pointer px-1 py-0.5">
                  <option value="none">None</option>
                  <option value="yield_maint">Yield Maintenance</option>
                  <option value="step_down">Step-Down</option>
                  <option value="defeasance">Defeasance</option>
                </select>
              </div>
            </div>

            <div className="rounded-xl border bg-muted/20 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">Computed Outputs</div>
              <div className="flex flex-col gap-0.5">
                <SUFieldRow label="Monthly Payment" value={fmt(Math.round(model.senior.io ? seniorLoan * model.senior.rate / 100 / 12 : calcMonthlyPmt(seniorLoan, model.senior.rate, model.senior.amort)))} computed />
                <SUFieldRow label="Annual Debt Service" value={fmt(seniorAnnualDS)} computed />
                <SUFieldRow label="DSCR (Year 1 NOI)" value={seniorDSCR > 0 ? `${seniorDSCR.toFixed(2)}x` : "N/A"} computed />
                <SUFieldRow label="DSCR (T-12 NOI)" value={seniorAnnualDS > 0 ? `${(t12NOI / seniorAnnualDS).toFixed(2)}x` : "N/A"} computed />
                <SUFieldRow label="Debt Yield" value={debtYield > 0 ? `${(debtYield * 100).toFixed(2)}%` : "N/A"} computed />
              </div>
            </div>
          </div>
        </div>
      </SUCollapsible>

      {/* ── 3. Going-In Mezz Loan ── */}
      <SUCollapsible title="Going-In Mezz Loan" icon={DollarSign} expanded={sections.mezz} onToggle={() => toggle("mezz")} badge={mezzLoan > 0 ? fmt(mezzLoan) : "Inactive"}>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-0.5">
              <SUFieldRow label="Mezz Loan Amount" value={fmt(mezzLoan)} computed />
              <SUFieldRow label="Mezz LTV" value={model.mezz.ltv.toFixed(1)} suffix="%" onChange={v => { const n = parseFloat(v); if (!isNaN(n)) updateMezz({ ltv: n }); }} />
              <SUFieldRow label="Interest Rate" value={model.mezz.rate.toFixed(2)} suffix="%" onChange={v => { const n = parseFloat(v); if (!isNaN(n)) updateMezz({ rate: n }); }} />
              <div className="flex items-center justify-between py-[5px] px-3 rounded-md hover:bg-muted/40 transition-colors">
                <span className="text-[12px] text-muted-foreground">I/O or Amortizing</span>
                <div className="inline-flex gap-0.5 rounded-md p-[2px] bg-muted">
                  {(["IO", "Amort"] as const).map(opt => (
                    <button key={opt} onClick={() => updateMezz({ io: opt === "IO" })} className={cn(
                      "rounded px-2.5 py-0.5 text-[10px] font-semibold cursor-pointer transition-all",
                      (opt === "IO" ? model.mezz.io : !model.mezz.io) ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}>{opt}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-muted/20 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">Combined Metrics</div>
              <div className="flex flex-col gap-0.5">
                <SUFieldRow label="Combined LTV" value={`${combinedLTV.toFixed(1)}%`} computed />
                <SUFieldRow label="Combined Annual DS" value={fmt(totalAnnualDS)} computed />
                <SUFieldRow label="Combined DSCR" value={combinedDSCR > 0 ? `${combinedDSCR.toFixed(2)}x` : "N/A"} computed />
                <SUFieldRow label="Blended Rate" value={blendedRate > 0 ? `${blendedRate.toFixed(2)}%` : "N/A"} computed />
              </div>
            </div>
          </div>
        </div>
      </SUCollapsible>

      {/* ── 4. Closing Costs Breakdown ── */}
      <SUCollapsible title="Closing Costs" icon={Receipt} expanded={sections.closing} onToggle={() => toggle("closing")} badge={fmt(totalCC)}>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-muted/30">
                <th className="text-left font-medium text-muted-foreground px-4 py-2 w-[50%]">Description</th>
                <th className="text-right font-medium text-muted-foreground px-3 py-2 w-[20%]">Amount</th>
                <th className="text-right font-medium text-muted-foreground px-3 py-2 w-[15%]">% of Purchase</th>
                <th className="text-right font-medium text-muted-foreground px-3 py-2 w-[15%]">$/Unit</th>
              </tr>
            </thead>
            <tbody>
              {model.closingCosts.map(cc => (
                <tr key={cc.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-2 text-foreground/80">{cc.label}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex items-center justify-end">
                      <span className="text-muted-foreground text-[11px] mr-0.5">$</span>
                      <input
                        defaultValue={cc.amount.toLocaleString()}
                        onBlur={e => {
                          const n = parseFloat(e.target.value.replace(/,/g, "")) || 0;
                          setModel(prev => ({
                            ...prev,
                            closingCosts: prev.closingCosts.map(c => c.id === cc.id ? { ...c, amount: n } : c),
                          }));
                        }}
                        className="w-[90px] text-right text-[12px] num font-medium bg-transparent outline-none border-b border-dashed border-border/40 focus:border-primary/60"
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right num text-foreground/60">{pp > 0 ? (cc.amount / pp * 100).toFixed(2) + "%" : ""}</td>
                  <td className="px-3 py-2 text-right num text-foreground/60">${Math.round(cc.amount / TOTAL_UNITS).toLocaleString()}</td>
                </tr>
              ))}
              <tr className="bg-muted/20">
                <td className="px-4 py-2 font-semibold">Total Closing Costs</td>
                <td className="px-3 py-2 text-right font-semibold num">{fmt(totalCC)}</td>
                <td className="px-3 py-2 text-right font-semibold num">{pp > 0 ? (totalCC / pp * 100).toFixed(2) + "%" : ""}</td>
                <td className="px-3 py-2 text-right font-semibold num">${Math.round(totalCC / TOTAL_UNITS).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </SUCollapsible>

      {/* ── 5. Construction / Improvement Budget ── */}
      <SUCollapsible title="Construction / Improvement Budget" icon={Hammer} expanded={sections.construction} onToggle={() => toggle("construction")} badge={fmt(totalBudget)}>
        <div className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="inline-flex gap-0.5 rounded-lg p-[2px] bg-muted border">
              {([{ key: "value_add" as const, label: "Value-Add / Rehab" }, { key: "ground_up" as const, label: "Ground-Up Construction" }]).map(opt => (
                <button key={opt.key} onClick={() => update({ budgetMode: opt.key })} className={cn(
                  "rounded-md px-3 py-1.5 text-[11px] font-medium cursor-pointer transition-colors",
                  model.budgetMode === opt.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}>{opt.label}</button>
              ))}
            </div>
          </div>

          {model.budgetMode === "value_add" ? (
            <div className="flex flex-col gap-4">
              {model.valueAddCategories.map(cat => {
                const catTotal = cat.items.reduce((s, i) => s + i.qty * i.unitCost, 0);
                return (
                  <div key={cat.id}>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2 pb-1.5 border-b">{cat.name}</div>
                    <table className="w-full text-[12px]">
                      <thead>
                        <tr>
                          <th className="text-left text-[9px] font-semibold uppercase tracking-wider text-muted-foreground p-[6px_10px] border-b w-[40%]">Description</th>
                          <th className="text-center text-[9px] font-semibold uppercase tracking-wider text-muted-foreground p-[6px_10px] border-b w-[10%]">Qty</th>
                          <th className="text-right text-[9px] font-semibold uppercase tracking-wider text-muted-foreground p-[6px_10px] border-b w-[18%]">Unit Cost</th>
                          <th className="text-right text-[9px] font-semibold uppercase tracking-wider text-muted-foreground p-[6px_10px] border-b w-[18%]">Total</th>
                          <th className="text-center text-[9px] font-semibold uppercase tracking-wider text-muted-foreground p-[6px_10px] border-b w-[10%]">Timeline</th>
                          <th className="p-[6px_10px] border-b w-[4%]" />
                        </tr>
                      </thead>
                      <tbody>
                        {cat.items.map(item => (
                          <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                            <td className="h-9 px-[10px] text-foreground/80 border-b">{item.description}</td>
                            <td className="h-9 px-[10px] text-center num border-b">{item.qty}</td>
                            <td className="h-9 px-[10px] text-right num border-b">${item.unitCost.toLocaleString()}</td>
                            <td className="h-9 px-[10px] text-right num font-medium border-b">{fmt(item.qty * item.unitCost)}</td>
                            <td className="h-9 px-[10px] text-center border-b">
                              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">{item.timeline}</span>
                            </td>
                            <td className="h-9 px-[10px] text-center border-b">
                              <button onClick={() => {
                                setModel(prev => ({
                                  ...prev,
                                  valueAddCategories: prev.valueAddCategories.map(c =>
                                    c.id === cat.id ? { ...c, items: c.items.filter(i => i.id !== item.id) } : c
                                  ),
                                }));
                              }} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                                <Trash2 className="w-3 h-3" strokeWidth={1.5} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="flex items-center justify-between mt-1.5">
                      <button onClick={() => {
                        const newItem: BudgetLineItem = { id: `${cat.id}-${Date.now()}`, description: "New item", qty: 1, unitCost: 0, timeline: "Yr 1" };
                        setModel(prev => ({
                          ...prev,
                          valueAddCategories: prev.valueAddCategories.map(c =>
                            c.id === cat.id ? { ...c, items: [...c.items, newItem] } : c
                          ),
                        }));
                      }} className="inline-flex items-center gap-1.5 px-2.5 py-[5px] rounded-lg border text-[11px] font-medium cursor-pointer hover:bg-muted/50 transition-colors">
                        <Plus className="w-3 h-3" strokeWidth={2} /> Add Item
                      </button>
                      <span className="text-[11px] font-semibold num">{fmt(catTotal)}</span>
                    </div>
                  </div>
                );
              })}

              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 border">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-muted-foreground">Contingency</span>
                  <input
                    value={model.valueAddContingencyPct}
                    onChange={e => { const n = parseFloat(e.target.value); if (!isNaN(n)) update({ valueAddContingencyPct: n }); }}
                    className="w-[40px] text-right text-[12px] num font-medium bg-transparent outline-none border-b border-dashed border-border/60 focus:border-primary/60"
                  />
                  <span className="text-[10px] text-muted-foreground">%</span>
                </div>
                <span className="text-[12px] font-semibold num">{fmt(Math.round(model.valueAddCategories.reduce((s, cat) => s + cat.items.reduce((si, i) => si + i.qty * i.unitCost, 0), 0) * model.valueAddContingencyPct / 100))}</span>
              </div>

              <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-primary/[0.04] dark:bg-primary/[0.08] border">
                <span className="text-[13px] font-bold">Total Improvement Budget</span>
                <span className="text-[13px] font-bold num">{fmt(totalBudget)}</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {model.groundUpSections.map(section => {
                const sectionTotal = section.items.reduce((s, i) => s + i.amount, 0);
                return (
                  <div key={section.id}>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2 pb-1.5 border-b">{section.name}</div>
                    <table className="w-full text-[12px]">
                      <thead>
                        <tr>
                          <th className="text-left text-[9px] font-semibold uppercase tracking-wider text-muted-foreground p-[6px_10px] border-b w-[60%]">Description</th>
                          <th className="text-right text-[9px] font-semibold uppercase tracking-wider text-muted-foreground p-[6px_10px] border-b w-[30%]">Amount</th>
                          <th className="p-[6px_10px] border-b w-[10%]" />
                        </tr>
                      </thead>
                      <tbody>
                        {section.items.map(item => (
                          <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                            <td className="h-9 px-[10px] text-foreground/80 border-b">{item.description}</td>
                            <td className="h-9 px-[10px] text-right border-b">
                              <div className="inline-flex items-center justify-end">
                                <span className="text-muted-foreground text-[11px] mr-0.5">$</span>
                                <input
                                  defaultValue={item.amount.toLocaleString()}
                                  onBlur={e => {
                                    const n = parseFloat(e.target.value.replace(/,/g, "")) || 0;
                                    setModel(prev => ({
                                      ...prev,
                                      groundUpSections: prev.groundUpSections.map(s =>
                                        s.id === section.id ? { ...s, items: s.items.map(i => i.id === item.id ? { ...i, amount: n } : i) } : s
                                      ),
                                    }));
                                  }}
                                  className="w-[100px] text-right text-[12px] num font-medium bg-transparent outline-none border-b border-dashed border-border/40 focus:border-primary/60"
                                />
                              </div>
                            </td>
                            <td className="h-9 px-[10px] text-center border-b">
                              <button onClick={() => {
                                setModel(prev => ({
                                  ...prev,
                                  groundUpSections: prev.groundUpSections.map(s =>
                                    s.id === section.id ? { ...s, items: s.items.filter(i => i.id !== item.id) } : s
                                  ),
                                }));
                              }} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                                <Trash2 className="w-3 h-3" strokeWidth={1.5} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="flex items-center justify-between mt-1.5">
                      <button onClick={() => {
                        const newItem: GroundUpItem = { id: `${section.id}-${Date.now()}`, description: "New item", amount: 0 };
                        setModel(prev => ({
                          ...prev,
                          groundUpSections: prev.groundUpSections.map(s =>
                            s.id === section.id ? { ...s, items: [...s.items, newItem] } : s
                          ),
                        }));
                      }} className="inline-flex items-center gap-1.5 px-2.5 py-[5px] rounded-lg border text-[11px] font-medium cursor-pointer hover:bg-muted/50 transition-colors">
                        <Plus className="w-3 h-3" strokeWidth={2} /> Add Item
                      </button>
                      <span className="text-[11px] font-semibold num">{fmt(sectionTotal)}</span>
                    </div>
                  </div>
                );
              })}

              {(() => {
                const hard = model.groundUpSections.find(s => s.id === "gu-hard")?.items.reduce((s, i) => s + i.amount, 0) ?? 0;
                const soft = model.groundUpSections.find(s => s.id === "gu-soft")?.items.reduce((s, i) => s + i.amount, 0) ?? 0;
                const gcFee = Math.round(hard * model.groundUpGCFeePct / 100);
                const contingency = Math.round(hard * model.groundUpContingencyPct / 100);
                const subtotal = hard + soft + gcFee;
                const devFee = Math.round(subtotal * model.groundUpDevFeePct / 100);
                return (
                  <div className="flex flex-col gap-2 mt-2">
                    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 border">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-muted-foreground">GC Fee</span>
                        <input value={model.groundUpGCFeePct} onChange={e => { const n = parseFloat(e.target.value); if (!isNaN(n)) update({ groundUpGCFeePct: n }); }} className="w-[40px] text-right text-[12px] num font-medium bg-transparent outline-none border-b border-dashed border-border/60" />
                        <span className="text-[10px] text-muted-foreground">% of hard</span>
                      </div>
                      <span className="text-[12px] font-semibold num">{fmt(gcFee)}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 border">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-muted-foreground">Contingency</span>
                        <input value={model.groundUpContingencyPct} onChange={e => { const n = parseFloat(e.target.value); if (!isNaN(n)) update({ groundUpContingencyPct: n }); }} className="w-[40px] text-right text-[12px] num font-medium bg-transparent outline-none border-b border-dashed border-border/60" />
                        <span className="text-[10px] text-muted-foreground">% of hard</span>
                      </div>
                      <span className="text-[12px] font-semibold num">{fmt(contingency)}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 border">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-muted-foreground">Developer Fee</span>
                        <input value={model.groundUpDevFeePct} onChange={e => { const n = parseFloat(e.target.value); if (!isNaN(n)) update({ groundUpDevFeePct: n }); }} className="w-[40px] text-right text-[12px] num font-medium bg-transparent outline-none border-b border-dashed border-border/60" />
                        <span className="text-[10px] text-muted-foreground">% of total</span>
                      </div>
                      <span className="text-[12px] font-semibold num">{fmt(devFee)}</span>
                    </div>
                    <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-primary/[0.04] dark:bg-primary/[0.08] border">
                      <span className="text-[13px] font-bold">Total Construction Budget</span>
                      <span className="text-[13px] font-bold num">{fmt(totalBudget)}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </SUCollapsible>

      {/* ── 6. Reserves ── */}
      <SUCollapsible title="Reserves" icon={Shield} expanded={sections.reserves} onToggle={() => toggle("reserves")} badge={fmt(totalRes)}>
        <div className="p-4">
          <div className="flex flex-col gap-0.5">
            {model.reserves.map(r => (
              <div key={r.id} className="flex items-center justify-between py-[6px] px-3 rounded-md hover:bg-muted/40 transition-colors">
                <span className="text-[12px] text-muted-foreground">{r.label}</span>
                <div className="inline-flex items-center">
                  <span className="text-muted-foreground text-[11px] mr-0.5">$</span>
                  <input
                    defaultValue={r.amount.toLocaleString()}
                    onBlur={e => {
                      const n = parseFloat(e.target.value.replace(/,/g, "")) || 0;
                      setModel(prev => ({
                        ...prev,
                        reserves: prev.reserves.map(res => res.id === r.id ? { ...res, amount: n } : res),
                      }));
                    }}
                    className="w-[90px] text-right text-[12px] num font-medium bg-transparent outline-none border-b border-dashed border-border/40 focus:border-primary/60"
                  />
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between py-[6px] px-3 mt-1 border-t border-border/40">
              <span className="text-[12px] font-semibold">Total Reserves</span>
              <span className="text-[12px] num font-semibold">{fmt(totalRes)}</span>
            </div>
          </div>
        </div>
      </SUCollapsible>

      {/* ── 7. Takeout Loan Analysis ── */}
      <SUCollapsible title="Takeout Loan Analysis" icon={Banknote} expanded={sections.takeout} onToggle={() => toggle("takeout")} badge={model.takeout.enabled ? fmt(takeoutMaxLoan) : "Disabled"}>
        <div className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => updateTakeout({ enabled: !model.takeout.enabled })}
              className={cn(
                "rounded-lg px-3 py-1.5 text-[11px] font-semibold cursor-pointer transition-all border",
                model.takeout.enabled ? "bg-primary/10 text-primary border-primary/30" : "bg-muted text-muted-foreground border-border/40 hover:text-foreground"
              )}
            >
              {model.takeout.enabled ? "Enabled" : "Disabled"}
            </button>
            <p className="text-[11px] text-muted-foreground">Permanent loan that pays off going-in senior + mezz at stabilization</p>
          </div>

          {model.takeout.enabled && (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="flex flex-col gap-0.5">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1">Takeout Terms</div>
                  <div className="flex items-center justify-between py-[5px] px-3 rounded-md hover:bg-muted/40 transition-colors">
                    <span className="text-[12px] text-muted-foreground">Takeout Year</span>
                    <select value={model.takeout.year} onChange={e => updateTakeout({ year: parseInt(e.target.value) })} className="text-[12px] num font-medium bg-transparent border-b border-dashed border-border/60 outline-none cursor-pointer px-1 py-0.5">
                      {[1, 2, 3, 4, 5].map(y => <option key={y} value={y}>Year {y}</option>)}
                    </select>
                  </div>
                  <SUFieldRow label="Interest Rate" value={model.takeout.rate.toFixed(2)} suffix="%" onChange={v => { const n = parseFloat(v); if (!isNaN(n)) updateTakeout({ rate: n }); }} />
                  <SUFieldRow label="Amortization" value={model.takeout.amort.toString()} suffix="years" onChange={v => { const n = parseInt(v); if (!isNaN(n)) updateTakeout({ amort: n }); }} />
                  <SUFieldRow label="Term" value={model.takeout.term.toString()} suffix="years" onChange={v => { const n = parseInt(v); if (!isNaN(n)) updateTakeout({ term: n }); }} />

                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mt-3 mb-1">Sizing Constraints</div>
                  <SUFieldRow label="Max LTV" value={model.takeout.maxLTV.toFixed(1)} suffix="%" onChange={v => { const n = parseFloat(v); if (!isNaN(n)) updateTakeout({ maxLTV: n }); }} />
                  <SUFieldRow label="Min DSCR" value={model.takeout.dscrFloor.toFixed(2)} suffix="x" onChange={v => { const n = parseFloat(v); if (!isNaN(n)) updateTakeout({ dscrFloor: n }); }} />
                  <SUFieldRow label="Appraisal Cap Rate" value={model.exitCapRate.toFixed(2)} suffix="%" onChange={v => { const n = parseFloat(v); if (!isNaN(n)) update({ exitCapRate: n }); }} />
                </div>

                <div className="rounded-xl border bg-muted/20 p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">Takeout Sizing</div>
                  <div className="flex flex-col gap-0.5">
                    <SUFieldRow label={`Stabilized NOI (Yr ${model.takeout.year})`} value={fmt(takeoutNOI)} computed />
                    <SUFieldRow label="Appraised Value" value={fmt(takeoutAppraised)} computed />
                    <SUFieldRow label="LTV-Constrained Max" value={fmt(takeoutLTVMax)} computed />
                    <SUFieldRow label="DSCR-Constrained Max" value={fmt(takeoutDSCRMax)} computed />
                    <div className="flex items-center justify-between py-[5px] px-3 rounded-md bg-primary/[0.06] dark:bg-primary/[0.1] mt-1">
                      <span className="text-[12px] font-semibold text-primary">Max Takeout Loan</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] num font-bold text-primary">{fmt(takeoutMaxLoan)}</span>
                        <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary">{takeoutGoverning}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border/40 mt-3 pt-3">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">Proceeds Analysis</div>
                    <SUFieldRow label="Going-In Loan Payoff" value={fmt(takeoutPayoff)} computed />
                    <SUFieldRow label={`Takeout Closing (${takeoutCostPct}%)`} value={`(${fmt(takeoutCosts)})`} computed />
                    <div className={cn(
                      "flex items-center justify-between py-[6px] px-3 rounded-md mt-1",
                      takeoutNetProceeds >= 0 ? "bg-emerald-500/[0.06] dark:bg-emerald-500/10" : "bg-red-500/[0.06] dark:bg-red-500/10"
                    )}>
                      <span className={cn("text-[12px] font-semibold", takeoutNetProceeds >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                        Net to Sponsor
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-[12px] num font-bold", takeoutNetProceeds >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                          {takeoutNetProceeds >= 0 ? fmt(takeoutNetProceeds) : `(${fmt(Math.abs(takeoutNetProceeds))})`}
                        </span>
                        <span className={cn(
                          "text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded",
                          takeoutNetProceeds >= 0 ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-red-500/10 text-red-600 dark:text-red-400"
                        )}>
                          {takeoutNetProceeds >= 0 ? "Cash Out" : "Shortfall"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stress Test Matrix */}
              <div className="rounded-xl border bg-card/50">
                <div className="flex items-center gap-2 px-4 pt-3.5 pb-2">
                  <Target className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Takeout Proceeds Sensitivity</span>
                  <span className="text-[10px] text-muted-foreground ml-1">(Rate vs. Min DSCR)</span>
                </div>
                <div className="px-4 pb-3 overflow-x-auto">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="border-b border-border/30">
                        <th className="py-1.5 px-2 text-left font-medium text-muted-foreground">Rate</th>
                        {stressDSCRs.map(d => (
                          <th key={d} className="py-1.5 px-2 text-right font-medium text-muted-foreground">{d.toFixed(2)}x</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {stressMatrix.map(row => {
                        const isBaseRate = Math.abs(row.rate - model.takeout.rate) < 0.01;
                        return (
                          <tr key={row.rate} className={cn("border-b border-border/20", isBaseRate && "bg-primary/[0.04]")}>
                            <td className={cn("py-1.5 px-2 num", isBaseRate ? "font-semibold text-primary" : "text-foreground")}>{row.rate.toFixed(1)}%</td>
                            {row.cells.map((proceeds, ci) => {
                              const isBaseDSCR = Math.abs(stressDSCRs[ci] - model.takeout.dscrFloor) < 0.01;
                              const isBaseCell = isBaseRate && isBaseDSCR;
                              return (
                                <td key={ci} className={cn(
                                  "py-1.5 px-2 text-right num",
                                  isBaseCell && "font-bold",
                                  proceeds >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400",
                                )}>
                                  {proceeds >= 0 ? `$${(proceeds / 1000).toFixed(0)}K` : `($${(Math.abs(proceeds) / 1000).toFixed(0)}K)`}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="flex items-center gap-4 mt-2 text-[9px] text-muted-foreground/60">
                    <span>Values = Net proceeds to sponsor after payoff and closing costs</span>
                    <span className="text-emerald-600">Green = Cash out</span>
                    <span className="text-red-500">Red = Shortfall</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </SUCollapsible>
    </div>
  );
}

function InputSection({ title, icon: Icon, children }: { title: string; icon: typeof FileText; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card/50">
      <div className="flex items-center gap-2 px-4 pt-3.5 pb-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          {title}
        </span>
      </div>
      <div className="flex flex-col px-2 pb-2">
        {children}
      </div>
    </div>
  );
}

function InputRow({ label, value, computed, editable }: { label: string; value: string; computed?: boolean; editable?: boolean }) {
  return (
    <div className="flex items-center justify-between py-[5px] px-2 rounded-md hover:bg-muted/40 transition-colors group">
      <span className="text-[12px] text-muted-foreground group-hover:text-foreground transition-colors">
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        {editable ? (
          <span className="text-[12px] num font-medium text-foreground border-b border-dashed border-border/60 group-hover:border-primary/40 cursor-text">
            {value}
          </span>
        ) : (
          <span className={cn(
            "text-[12px] num font-medium",
            computed ? "text-muted-foreground italic" : "text-foreground"
          )}>
            {value}
          </span>
        )}
        {computed && (
          <span className="text-[8px] uppercase tracking-wider text-muted-foreground/50 font-semibold">calc</span>
        )}
      </div>
    </div>
  );
}

function ProFormaSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-1">
      <div className="flex items-center gap-2 px-4 pt-4 pb-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          {title}
        </span>
        <div className="flex-1 h-px bg-border/40" />
      </div>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

function ProFormaHighlightRow({
  label,
  values,
}: {
  label: string;
  values: string[];
}) {
  return (
    <div className="flex items-center py-[7px] px-4 rounded-md bg-primary/[0.04] dark:bg-primary/[0.08]">
      <div className="w-[240px] shrink-0 text-[12px] font-semibold text-foreground">
        {label}
      </div>
      {values.map((v, i) => (
        <div
          key={i}
          className={cn(
            "flex-1 text-right text-[12px] font-bold num px-3",
            v ? "text-primary" : "text-transparent"
          )}
        >
          {v || "-"}
        </div>
      ))}
    </div>
  );
}

// ─── Empty State (kept for no-model-yet UX) ───

// ─── Shared Components ───

function FinInput({ value, width, suffix, onChange, readonly }: { value: string; width: number; suffix: string; onChange?: (v: number) => void; readonly?: boolean }) {
  return (
    <span className="inline-flex items-center gap-0.5 rounded bg-muted px-1.5 py-[1px] border border-border/40">
      <input
        type="text"
        value={value}
        readOnly={readonly}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (!isNaN(v) && onChange) onChange(v);
        }}
        className={cn(
          "bg-transparent text-[10px] num font-semibold text-foreground text-right outline-none",
          readonly ? "cursor-default" : "border-b border-dashed border-primary/30 focus:border-primary"
        )}
        style={{ width }}
      />
      <span className="text-[9px] text-muted-foreground">{suffix}</span>
    </span>
  );
}

function CashFlowHighlight({ label, values, color }: { label: string; values: number[]; color: "blue" | "emerald" }) {
  const bg = color === "blue" ? "bg-blue-500/[0.04] dark:bg-blue-500/[0.08]" : "bg-emerald-500/[0.06] dark:bg-emerald-500/10";
  const text = color === "blue" ? "text-blue-700 dark:text-blue-400" : "text-emerald-700 dark:text-emerald-400";
  return (
    <div className={cn("mx-3 my-2 rounded-lg px-4 py-3 flex items-center", bg)}>
      <div className={cn("w-[240px] shrink-0 text-[12px] font-semibold", text)}>
        {label}
      </div>
      {values.map((v, i) => (
        <div key={i} className={cn(
          "flex-1 text-right text-[12px] font-bold num px-3",
          i === 0 ? "text-muted-foreground/40" : v >= 0 ? text : "text-red-500 dark:text-red-400"
        )}>
          {i === 0 ? "-" : v >= 0 ? fmtDollar(v) : `(${fmtDollar(Math.abs(v))})`}
        </div>
      ))}
    </div>
  );
}

type FinFlows = { proceeds: number[]; intPmts: number[]; prinPmts: number[]; prinAtSale: number[]; net: number[] };

function FinancingSection({ title, ltv, setLTV, rate, setRate, isIO, setIO, flows, cols, yr0 }: {
  title: string; ltv: number; setLTV: (v: number) => void; rate: number; setRate: (v: number) => void;
  isIO: boolean; setIO: (v: boolean) => void; flows: FinFlows; cols: string[]; yr0: number;
}) {
  const fmtFlow = (arr: number[]) => arr.slice(1).map(v => v === 0 ? "" : fmtDollarSigned(v));
  return (
    <div className="mt-1">
      <div className="flex items-center gap-2 px-4 pt-4 pb-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          {title}
        </span>
        <div className="flex-1 h-px bg-border/40" />
        <div className="inline-flex gap-0.5 rounded-md p-[2px] bg-muted">
          {(["IO", "Amort"] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setIO(opt === "IO")}
              className={cn(
                "rounded px-2 py-0.5 text-[9px] font-semibold cursor-pointer transition-all",
                (opt === "IO" ? isIO : !isIO)
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col">
        <PFRow label="Loan Proceeds" t12="" vals={fmtFlow(flows.proceeds)} yr0={yr0} labelExtra={
          <FinInput value={ltv.toFixed(1)} width={28} suffix="% LTV" onChange={setLTV} />
        } />
        <PFRow label="Interest Payments" t12="" vals={fmtFlow(flows.intPmts)} yr0={yr0} negative labelExtra={
          <FinInput value={rate.toFixed(2)} width={34} suffix="%" onChange={setRate} />
        } />
        <PFRow label="Principal Payments" t12="" vals={fmtFlow(flows.prinPmts)} yr0={yr0} negative />
        <PFRow label="Principal at Sale" t12="" vals={fmtFlow(flows.prinAtSale)} yr0={yr0} negative />
        <PFTotalRow label={`Net ${title}`} vals={["", ...fmtFlow(flows.net)]} yr0={yr0} />
      </div>
    </div>
  );
}

function CellNote({ note, by, date }: { note: string; by?: string; date?: string }) {
  return (
    <div className="absolute top-0 right-0 z-10 group/note">
      {/* Corner triangle indicator */}
      <div className="w-0 h-0 border-t-[6px] border-t-blue-400 dark:border-t-blue-500 border-l-[6px] border-l-transparent cursor-pointer" />
      {/* Popover on hover */}
      <div className="hidden group-hover/note:block absolute top-0 right-0 pt-3 z-50">
        <div className="w-[240px] rounded-lg border border-border/60 bg-popover shadow-lg shadow-black/10 dark:shadow-black/30 overflow-hidden">
          <div className="px-3 py-2.5">
            <p className="text-[11px] leading-relaxed text-foreground/90">{note}</p>
          </div>
          {(by || date) && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/40 border-t border-border/30">
              {by && <span className="text-[9px] font-medium text-muted-foreground">{by}</span>}
              {by && date && <span className="text-[9px] text-muted-foreground/40">-</span>}
              {date && <span className="text-[9px] text-muted-foreground/50">{date}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, badge, action }: { title: string; badge?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <h3 className="text-[13px] font-semibold text-foreground">{title}</h3>
      {badge && (
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          {badge}
        </span>
      )}
      <div className="flex-1 h-px bg-border/40" />
      {action}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card px-4 py-3">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold num text-foreground">{value}</div>
    </div>
  );
}

function SidebarAction({ icon: Icon, label, accent }: { icon: typeof ArrowUpRight; label: string; accent?: boolean }) {
  return (
    <button className={cn("flex w-full items-center gap-2.5 rounded-lg border-none px-2.5 py-2 text-left text-[13px] font-medium cursor-pointer transition-colors duration-150 bg-transparent", accent ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function TeamMember({ name, role }: { name: string; role: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg px-1 py-1">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-[10px] font-medium">
        {name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
      </div>
      <div>
        <div className="text-xs font-medium text-foreground">{name}</div>
        <div className="text-[10px] text-muted-foreground">{role}</div>
      </div>
    </div>
  );
}

function DateRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium text-foreground">{value}</span>
    </div>
  );
}
