import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { PipelineView } from "@/components/pipeline-v2/PipelineView";
import {
  daysInStage,
  getAlertLevel,
  type UnifiedDeal,
  type UnifiedCardType,
  type StageConfig,
  type ChecklistItem,
  type DealActivity,
} from "@/components/pipeline-v2/pipeline-types";

export const dynamic = "force-dynamic";

export default async function PipelineV2Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();

  const [
    cardTypesResult,
    dealsResult,
    checklistResult,
    stageConfigsResult,
    relationshipsResult,
    activitiesResult,
    teamResult,
  ] = await Promise.all([
    admin
      .from("unified_card_types" as never)
      .select("*")
      .eq("status" as never, "active" as never)
      .order("sort_order" as never),
    admin
      .from("unified_deals" as never)
      .select(
        `*, primary_contact:crm_contacts(id, first_name, last_name), company:companies(id, name)`
      )
      .in("status" as never, ["active", "on_hold"] as never)
      .order("created_at" as never, { ascending: false }),
    admin
      .from("unified_deal_checklist" as never)
      .select("*"),
    admin
      .from("unified_stage_configs" as never)
      .select("*")
      .order("sort_order" as never),
    admin
      .from("unified_deal_relationships" as never)
      .select("deal_a_id, deal_b_id"),
    admin
      .from("unified_deal_activity" as never)
      .select("*")
      .order("created_at" as never, { ascending: false })
      .limit(500),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "admin")
      .order("full_name"),
  ]);

  const cardTypes = (cardTypesResult.data ?? []) as unknown as UnifiedCardType[];
  const stageConfigs = (stageConfigsResult.data ?? []) as unknown as StageConfig[];
  const checklistItems = (checklistResult.data ?? []) as unknown as ChecklistItem[];
  const activities = (activitiesResult.data ?? []) as unknown as DealActivity[];

  // Build checklist counts per deal
  const checklistCounts = new Map<string, { total: number; completed: number }>();
  for (const item of checklistItems) {
    const current = checklistCounts.get(item.deal_id) ?? {
      total: 0,
      completed: 0,
    };
    current.total++;
    if (item.completed) current.completed++;
    checklistCounts.set(item.deal_id, current);
  }

  // Build relationship set
  const relationshipDealIds = new Set<string>();
  for (const rel of (relationshipsResult.data ?? []) as { deal_a_id: string; deal_b_id: string }[]) {
    relationshipDealIds.add(rel.deal_a_id);
    relationshipDealIds.add(rel.deal_b_id);
  }

  // Compute stage config map for alert levels
  const stageConfigMap = new Map(stageConfigs.map((sc) => [sc.stage, sc]));

  // Enrich deals with computed fields
  const deals: UnifiedDeal[] = ((dealsResult.data ?? []) as unknown as UnifiedDeal[]).map(
    (deal) => {
      const counts = checklistCounts.get(deal.id);
      const days = daysInStage(deal.stage_entered_at);
      const config = stageConfigMap.get(deal.stage);
      return {
        ...deal,
        checklist_total: counts?.total ?? 0,
        checklist_completed: counts?.completed ?? 0,
        days_in_stage: days,
        alert_level: getAlertLevel(days, config),
      };
    }
  );

  const teamMembers = (teamResult.data ?? []).map(
    (t: { id: string; full_name: string | null }) => ({
      id: t.id,
      full_name: t.full_name ?? "Unknown",
    })
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pipeline"
        description="Unified deal pipeline across debt and equity."
      />
      <PipelineView
        deals={deals}
        cardTypes={cardTypes}
        stageConfigs={stageConfigs}
        checklistItems={checklistItems}
        activities={activities}
        relationshipDealIds={relationshipDealIds}
        teamMembers={teamMembers}
      />
    </div>
  );
}
