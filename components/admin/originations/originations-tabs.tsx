"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoanListView } from "@/components/admin/loan-list-view";
import { ConditionsDashboard } from "@/components/admin/conditions-dashboard";
import { PricingProgramsManager } from "@/components/admin/pricing-programs-manager";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Home, ClipboardList, Calculator } from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface OriginationsTabsProps {
  // Pipeline tab
  loanRows: any[];
  teamMembers: { id: string; full_name: string }[];
  currentUserId: string;
  // Conditions tab
  conditions: any[];
  // Pricing tab
  programs: any[];
  adjusters: any[];
  versions: any[];
  // Counts for badges
  pipelineCount: number;
  pendingConditionsCount: number;
}

export function OriginationsTabs({
  loanRows,
  teamMembers,
  currentUserId,
  conditions,
  programs,
  adjusters,
  versions,
  pipelineCount,
  pendingConditionsCount,
}: OriginationsTabsProps) {
  return (
    <Tabs defaultValue="pipeline">
      <TabsList className="flex-wrap h-auto gap-1">
        <TabsTrigger value="pipeline" className="gap-1.5">
          <Home className="h-3.5 w-3.5" />
          Pipeline
          <span className="ml-1 rounded-full bg-slate-200 text-slate-700 text-[10px] font-semibold px-1.5 py-0.5">
            {pipelineCount}
          </span>
        </TabsTrigger>
        <TabsTrigger value="conditions" className="gap-1.5">
          <ClipboardList className="h-3.5 w-3.5" />
          Conditions
          {pendingConditionsCount > 0 && (
            <span className="ml-1 rounded-full bg-amber-200 text-amber-800 text-[10px] font-semibold px-1.5 py-0.5">
              {pendingConditionsCount}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="pricing" className="gap-1.5">
          <Calculator className="h-3.5 w-3.5" />
          Pricing
        </TabsTrigger>
      </TabsList>

      <TabsContent value="pipeline" className="mt-4">
        <LoanListView
          data={loanRows}
          teamMembers={teamMembers}
          currentUserId={currentUserId}
        />
      </TabsContent>

      <TabsContent value="conditions" className="mt-4">
        <ConditionsDashboard
          conditions={conditions}
          currentUserId={currentUserId}
        />
      </TabsContent>

      <TabsContent value="pricing" className="mt-4">
        <div className="space-y-4">
          <div className="flex justify-end">
            <Link href="/admin/pricing/calculator">
              <Button variant="outline" className="gap-2">
                <Calculator className="h-4 w-4" />
                Deal Calculator
              </Button>
            </Link>
          </div>
          <PricingProgramsManager
            programs={programs}
            adjusters={adjusters}
            versions={versions}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}
