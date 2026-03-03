"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  TrendingUp,
  Briefcase,
  Users,
  Activity,
  UserPlus,
  Building,
  Building2,
  MapPin,
  Home,
  ChevronRight,
} from "lucide-react";
import { StagePill, EmptyState, MonoValue, TimelineEvent } from "../shared";
import { formatCurrency } from "@/lib/format";
import type {
  ContactData,
  LoanData,
  InvestorCommitmentData,
  BorrowerEntityData,
  InvestingEntityData,
  ActivityData,
  CompanyData,
} from "../types";
import Link from "next/link";

// Activity type icon/color mapping
const activityIconConfig: Record<
  string,
  { icon: React.ElementType; bg: string; color: string }
> = {
  call: { icon: Activity, bg: "#EFF6FF", color: "#2563EB" },
  email: { icon: Activity, bg: "#F5F3FF", color: "#7C3AED" },
  meeting: { icon: Activity, bg: "#ECFDF3", color: "#16A34A" },
  note: { icon: Activity, bg: "#FFF7ED", color: "#C2410C" },
  text_message: { icon: Activity, bg: "#EFF6FF", color: "#2563EB" },
  follow_up: { icon: Activity, bg: "#FEF2F2", color: "#DC2626" },
  deal_update: { icon: Activity, bg: "#ECFDF3", color: "#16A34A" },
};

// ---------- Active Loans Card (borrower) ----------
function ActiveLoansCard({ loans }: { loans: LoanData[] }) {
  const activeLoans = loans.filter(
    (l) =>
      l.stage &&
      !["paid_off", "payoff", "denied", "withdrawn"].includes(l.stage)
  );

  if (activeLoans.length === 0) {
    return (
      <Card className="rounded-xl border-[#E5E5E7] bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2">
            <DollarSign className="h-4 w-4" strokeWidth={1.5} />
            Active Loans
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="No active loans"
            description="Start a new loan application for this borrower."
            icon={DollarSign}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl border-[#E5E5E7] bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2">
          <DollarSign className="h-4 w-4" strokeWidth={1.5} />
          Active Loans ({activeLoans.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeLoans.slice(0, 3).map((loan) => {
          const loanTypeLabel = loan.type
            ? loan.type.toUpperCase()
            : null;
          const purposeLabel = loan.purpose
            ? loan.purpose.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
            : null;
          return (
            <Link
              key={loan.id}
              href={`/admin/loans/${loan.id}`}
              className="block rounded-lg border border-[#E5E5E7] p-3 hover:bg-[#F7F7F8] transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-[#1A1A1A] truncate">
                  {loan.property_address || "No address"}
                </p>
                {loan.stage && <StagePill stage={loan.stage} />}
              </div>
              <div className="flex items-center gap-3 text-xs text-[#6B6B6B] flex-wrap">
                <MonoValue>{formatCurrency(loan.loan_amount)}</MonoValue>
                {loan.interest_rate != null && (
                  <MonoValue>{loan.interest_rate}%</MonoValue>
                )}
                {loan.ltv != null && <MonoValue>{loan.ltv}% LTV</MonoValue>}
                {loanTypeLabel && (
                  <span className="bg-[#F7F7F8] text-[#6B6B6B] px-1.5 py-0.5 rounded text-[10px] font-medium">
                    {loanTypeLabel}
                  </span>
                )}
                {purposeLabel && (
                  <span className="text-[#9A9A9A]">{purposeLabel}</span>
                )}
              </div>
            </Link>
          );
        })}
        {activeLoans.length > 3 && (
          <p className="text-xs text-[#6B6B6B] text-center">
            +{activeLoans.length - 3} more loans
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ---------- Investment Summary Card (investor) ----------
function InvestmentSummaryCard({
  commitments,
}: {
  commitments: InvestorCommitmentData[];
}) {
  const totalCommitted = commitments.reduce(
    (s, c) => s + (c.commitment_amount || 0),
    0
  );
  const totalFunded = commitments.reduce(
    (s, c) => s + (c.funded_amount || 0),
    0
  );

  if (commitments.length === 0) {
    return (
      <Card className="rounded-xl border-[#E5E5E7] bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2">
            <TrendingUp className="h-4 w-4" strokeWidth={1.5} />
            Investments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="No investments yet"
            description="Record a new investment for this investor."
            icon={TrendingUp}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl border-[#E5E5E7] bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2">
          <TrendingUp className="h-4 w-4" strokeWidth={1.5} />
          Investment Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-[#6B6B6B]">Total Committed</p>
            <MonoValue className="text-sm font-semibold text-[#1A1A1A]">
              {formatCurrency(totalCommitted)}
            </MonoValue>
          </div>
          <div>
            <p className="text-xs text-[#6B6B6B]">Total Funded</p>
            <MonoValue className="text-sm font-semibold text-[#1A1A1A]">
              {formatCurrency(totalFunded)}
            </MonoValue>
          </div>
        </div>
        {commitments.slice(0, 3).map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between rounded-lg border border-[#E5E5E7] p-3"
          >
            <div>
              <p className="text-sm font-medium text-[#1A1A1A]">
                {c.fund_name || "Unknown Fund"}
              </p>
              <MonoValue className="text-xs text-[#6B6B6B]">
                {formatCurrency(c.commitment_amount)}
              </MonoValue>
            </div>
            {c.status && <StagePill stage={c.status} />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ---------- Servicing Summary Card (lender) ----------
function ServicingSummaryCard({ loans }: { loans: LoanData[] }) {
  const servicingLoans = loans.filter(
    (l) => l.stage === "funded" || l.stage === "servicing"
  );
  return (
    <Card className="rounded-xl border-[#E5E5E7] bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2">
          <Briefcase className="h-4 w-4" strokeWidth={1.5} />
          Servicing Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        {servicingLoans.length === 0 ? (
          <EmptyState
            title="No serviced loans"
            description="No loans currently being serviced by this lender."
            icon={Briefcase}
          />
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <p className="text-xs text-[#6B6B6B]">Active Loans</p>
                <MonoValue className="text-sm font-semibold text-[#1A1A1A]">
                  {servicingLoans.length}
                </MonoValue>
              </div>
              <div>
                <p className="text-xs text-[#6B6B6B]">Total Balance</p>
                <MonoValue className="text-sm font-semibold text-[#1A1A1A]">
                  {formatCurrency(
                    servicingLoans.reduce(
                      (s, l) => s + (l.loan_amount || 0),
                      0
                    )
                  )}
                </MonoValue>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------- Referral Summary Card (broker) ----------
function ReferralSummaryCard() {
  return (
    <Card className="rounded-xl border-[#E5E5E7] bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2">
          <Users className="h-4 w-4" strokeWidth={1.5} />
          Referral Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <EmptyState
          title="No referrals tracked"
          description="Referral tracking data will appear here."
          icon={Users}
        />
      </CardContent>
    </Card>
  );
}

// ---------- Recent Activity Card (always) ----------
function RecentActivityCard({ activities }: { activities: ActivityData[] }) {
  const recent = activities.slice(0, 5);

  return (
    <Card className="rounded-xl border-[#E5E5E7] bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2">
          <Activity className="h-4 w-4" strokeWidth={1.5} />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recent.length === 0 ? (
          <p className="text-sm text-[#6B6B6B] text-center py-4">
            No recent activity.
          </p>
        ) : (
          <div className="space-y-0">
            {recent.map((act, i) => {
              const config =
                activityIconConfig[act.activity_type] ||
                activityIconConfig.note;
              return (
                <TimelineEvent
                  key={act.id}
                  icon={config.icon}
                  iconBg={config.bg}
                  iconColor={config.color}
                  title={
                    act.subject ||
                    act.activity_type.replace(/_/g, " ").replace(/\b\w/g, (c) =>
                      c.toUpperCase()
                    )
                  }
                  description={act.description}
                  timestamp={act.created_at}
                  actor={act.created_by_name}
                  isLast={i === recent.length - 1}
                />
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------- Associated Entities Card ----------
function AssociatedEntitiesCard({
  borrowerEntities,
  investingEntities,
  company,
}: {
  borrowerEntities: BorrowerEntityData[];
  investingEntities: InvestingEntityData[];
  company: CompanyData | null;
}) {
  const allEntities = [
    ...borrowerEntities.map((e) => ({ ...e, category: "Borrower Entity" as const })),
    ...investingEntities.map((e) => ({ ...e, category: "Investing Entity" as const })),
  ];

  if (allEntities.length === 0 && !company) return null;

  return (
    <Card className="rounded-xl border-[#E5E5E7] bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2">
          <Building className="h-4 w-4" strokeWidth={1.5} />
          Associated Entities
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {company && (
          <Link
            href={`/admin/crm/companies/${company.id}`}
            className="flex items-center gap-3 rounded-lg border border-[#E5E5E7] p-3 hover:bg-[#F7F7F8] transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EFF6FF] shrink-0">
              <Building2 className="h-4 w-4 text-[#2563EB]" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1A1A1A] truncate">{company.name}</p>
              <p className="text-xs text-[#6B6B6B]">
                {company.company_type
                  ? company.company_type.charAt(0).toUpperCase() + company.company_type.slice(1)
                  : "Company"}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-[#9A9A9A] shrink-0" strokeWidth={1.5} />
          </Link>
        )}

        {allEntities.map((entity) => {
          const location = [entity.city, entity.state].filter(Boolean).join(", ");
          return (
            <div
              key={entity.id}
              className="flex items-center gap-3 rounded-lg border border-[#E5E5E7] p-3"
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${
                  entity.category === "Borrower Entity"
                    ? "bg-[#ECFDF3]"
                    : "bg-[#F5F3FF]"
                }`}
              >
                <Building
                  className={`h-4 w-4 ${
                    entity.category === "Borrower Entity"
                      ? "text-[#16A34A]"
                      : "text-[#7C3AED]"
                  }`}
                  strokeWidth={1.5}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1A1A1A] truncate">
                  {entity.entity_name}
                </p>
                <div className="flex items-center gap-2 text-xs text-[#6B6B6B]">
                  <span>{entity.entity_type}</span>
                  {entity.state_of_formation && (
                    <>
                      <span className="text-[#E5E5E7]">&middot;</span>
                      <span>{entity.state_of_formation}</span>
                    </>
                  )}
                  {location && (
                    <>
                      <span className="text-[#E5E5E7]">&middot;</span>
                      <span>{location}</span>
                    </>
                  )}
                </div>
              </div>
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  entity.category === "Borrower Entity"
                    ? "bg-[#ECFDF3] text-[#16A34A]"
                    : "bg-[#F5F3FF] text-[#7C3AED]"
                }`}
              >
                {entity.category === "Borrower Entity" ? "Borrower" : "Investor"}
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ---------- Associated Properties Card ----------
function AssociatedPropertiesCard({ loans }: { loans: LoanData[] }) {
  // Extract unique properties from loans
  const properties = loans
    .filter((l) => l.property_address || l.property_city)
    .map((l) => ({
      loanId: l.id,
      loanNumber: l.loan_number,
      address: l.property_address,
      city: l.property_city,
      state: l.property_state,
      zip: l.property_zip,
      propertyType: l.property_type,
      stage: l.stage,
      loanAmount: l.loan_amount,
    }));

  if (properties.length === 0) return null;

  const formatPropertyType = (type: string | null) => {
    if (!type) return null;
    return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <Card className="rounded-xl border-[#E5E5E7] bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2">
          <Home className="h-4 w-4" strokeWidth={1.5} />
          Associated Properties ({properties.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {properties.map((prop) => (
          <Link
            key={prop.loanId}
            href={`/admin/loans/${prop.loanId}`}
            className="flex items-center gap-3 rounded-lg border border-[#E5E5E7] p-3 hover:bg-[#F7F7F8] transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFF7ED] shrink-0">
              <MapPin className="h-4 w-4 text-[#C2410C]" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1A1A1A] truncate">
                {prop.address || "No address"}
              </p>
              <div className="flex items-center gap-2 text-xs text-[#6B6B6B]">
                {(prop.city || prop.state) && (
                  <span>
                    {[prop.city, prop.state].filter(Boolean).join(", ")}
                    {prop.zip ? ` ${prop.zip}` : ""}
                  </span>
                )}
                {prop.propertyType && (
                  <>
                    <span className="text-[#E5E5E7]">&middot;</span>
                    <span>{formatPropertyType(prop.propertyType)}</span>
                  </>
                )}
                {prop.loanAmount != null && (
                  <>
                    <span className="text-[#E5E5E7]">&middot;</span>
                    <MonoValue>{formatCurrency(prop.loanAmount)}</MonoValue>
                  </>
                )}
              </div>
            </div>
            {prop.stage && <StagePill stage={prop.stage} />}
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

// ---------- Overview Tab ----------
interface OverviewTabProps {
  contact: ContactData;
  activeRelationships: string[];
  loans: LoanData[];
  investorCommitments: InvestorCommitmentData[];
  borrowerEntities: BorrowerEntityData[];
  investingEntities: InvestingEntityData[];
  activities: ActivityData[];
  company: CompanyData | null;
}

export function OverviewTab({
  contact,
  activeRelationships,
  loans,
  investorCommitments,
  borrowerEntities,
  investingEntities,
  activities,
  company,
}: OverviewTabProps) {
  const showLoans = activeRelationships.includes("borrower");
  const showInvestments = activeRelationships.includes("investor");
  const showServicing = activeRelationships.includes("lender");
  const showReferrals = activeRelationships.includes("broker");
  const hasRelationships = activeRelationships.length > 0;

  const hasEntities =
    borrowerEntities.length > 0 || investingEntities.length > 0 || !!company;

  return (
    <div className="space-y-4">
      {!hasRelationships && (
        <Card className="rounded-xl border-[#E5E5E7] bg-white">
          <CardContent className="py-8">
            <EmptyState
              title="No relationships defined"
              description="Add a relationship to see more details about this contact."
              icon={UserPlus}
              action={
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg border-[#E5E5E7]"
                >
                  <UserPlus className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.5} />
                  Add Relationship
                </Button>
              }
            />
          </CardContent>
        </Card>
      )}

      {/* Associated Entities (company + borrower/investor entities) */}
      {hasEntities && (
        <AssociatedEntitiesCard
          borrowerEntities={borrowerEntities}
          investingEntities={investingEntities}
          company={company}
        />
      )}

      {showLoans && <ActiveLoansCard loans={loans} />}

      {/* Associated Properties from deals */}
      {showLoans && loans.length > 0 && (
        <AssociatedPropertiesCard loans={loans} />
      )}

      {showInvestments && (
        <InvestmentSummaryCard commitments={investorCommitments} />
      )}
      {showServicing && <ServicingSummaryCard loans={loans} />}
      {showReferrals && <ReferralSummaryCard />}

      <RecentActivityCard activities={activities} />
    </div>
  );
}
