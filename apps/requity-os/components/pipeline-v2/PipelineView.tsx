"use client";

import { useState, useMemo, useCallback } from "react";
import { DealFilters, type FilterState } from "./DealFilters";
import { PipelineKanban } from "./PipelineKanban";
import { PipelineTable } from "./PipelineTable";
import { DealDrawer } from "./DealDrawer";
import { NewDealSheet } from "./NewDealSheet";
import type {
  UnifiedDeal,
  UnifiedCardType,
  StageConfig,
  ChecklistItem,
  DealActivity,
} from "./pipeline-types";

interface PipelineViewProps {
  deals: UnifiedDeal[];
  cardTypes: UnifiedCardType[];
  stageConfigs: StageConfig[];
  checklistItems: ChecklistItem[];
  activities: DealActivity[];
  relationshipDealIds: Set<string>;
  teamMembers: { id: string; full_name: string }[];
}

export function PipelineView({
  deals,
  cardTypes,
  stageConfigs,
  checklistItems,
  activities,
  relationshipDealIds,
  teamMembers,
}: PipelineViewProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    capitalSide: "all",
    cardTypeSlug: "all",
    assetClass: "all",
    view: "kanban",
  });
  const [selectedDeal, setSelectedDeal] = useState<UnifiedDeal | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [newDealOpen, setNewDealOpen] = useState(false);

  const cardTypeMap = useMemo(
    () => new Map(cardTypes.map((ct) => [ct.id, ct])),
    [cardTypes]
  );

  // Filter deals
  const filteredDeals = useMemo(() => {
    return deals.filter((d) => {
      if (
        filters.capitalSide !== "all" &&
        d.capital_side !== filters.capitalSide
      )
        return false;

      if (filters.cardTypeSlug !== "all") {
        const ct = cardTypeMap.get(d.card_type_id);
        if (ct?.slug !== filters.cardTypeSlug) return false;
      }

      if (filters.assetClass !== "all" && d.asset_class !== filters.assetClass)
        return false;

      if (filters.search) {
        const q = filters.search.toLowerCase();
        const match =
          d.name.toLowerCase().includes(q) ||
          d.deal_number?.toLowerCase().includes(q) ||
          d.primary_contact?.first_name?.toLowerCase().includes(q) ||
          d.primary_contact?.last_name?.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [deals, filters, cardTypeMap]);

  const handleDealClick = useCallback(
    (deal: UnifiedDeal) => {
      setSelectedDeal(deal);
      setDrawerOpen(true);
    },
    []
  );

  const selectedCardType = selectedDeal
    ? cardTypeMap.get(selectedDeal.card_type_id) ?? null
    : null;

  const dealChecklist = selectedDeal
    ? checklistItems.filter((c) => c.deal_id === selectedDeal.id)
    : [];

  const dealActivities = selectedDeal
    ? activities.filter((a) => a.deal_id === selectedDeal.id)
    : [];

  return (
    <div className="space-y-4">
      <DealFilters
        filters={filters}
        onChange={setFilters}
        cardTypes={cardTypes}
        onNewDeal={() => setNewDealOpen(true)}
      />

      {filters.view === "kanban" ? (
        <PipelineKanban
          deals={filteredDeals}
          cardTypes={cardTypes}
          stageConfigs={stageConfigs}
          relationshipDealIds={relationshipDealIds}
          onDealClick={handleDealClick}
        />
      ) : (
        <PipelineTable
          deals={filteredDeals}
          cardTypes={cardTypes}
          stageConfigs={stageConfigs}
          onDealClick={handleDealClick}
        />
      )}

      <DealDrawer
        deal={selectedDeal}
        cardType={selectedCardType}
        checklist={dealChecklist}
        activities={dealActivities}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />

      <NewDealSheet
        open={newDealOpen}
        onOpenChange={setNewDealOpen}
        cardTypes={cardTypes}
        teamMembers={teamMembers}
      />
    </div>
  );
}
