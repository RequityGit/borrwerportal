"use client";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { DealCard } from "./DealCard";
import {
  type UnifiedDeal,
  type UnifiedCardType,
  type StageConfig,
  STAGES,
  formatCurrency,
} from "./pipeline-types";

interface PipelineKanbanProps {
  deals: UnifiedDeal[];
  cardTypes: UnifiedCardType[];
  stageConfigs: StageConfig[];
  relationshipDealIds: Set<string>;
  onDealClick: (deal: UnifiedDeal) => void;
}

export function PipelineKanban({
  deals,
  cardTypes,
  stageConfigs,
  relationshipDealIds,
  onDealClick,
}: PipelineKanbanProps) {
  const cardTypeMap = new Map(cardTypes.map((ct) => [ct.id, ct]));
  const stageConfigMap = new Map(stageConfigs.map((sc) => [sc.stage, sc]));

  return (
    <ScrollArea className="w-full">
      <div className="flex gap-4 pb-4 min-w-max">
        {STAGES.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage.key);
          const totalAmount = stageDeals.reduce(
            (sum, d) => sum + (d.amount ?? 0),
            0
          );

          return (
            <div
              key={stage.key}
              className="flex flex-col w-72 shrink-0"
            >
              {/* Column header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium">{stage.label}</h3>
                  <span className="text-xs text-muted-foreground num">
                    {stageDeals.length}
                  </span>
                </div>
                {totalAmount > 0 && (
                  <span className="text-xs text-muted-foreground num">
                    {formatCurrency(totalAmount, true)}
                  </span>
                )}
              </div>

              {/* Cards */}
              <div className="flex-1 space-y-2 min-h-[200px] rounded-lg bg-muted/30 p-2">
                {stageDeals.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    No deals
                  </p>
                ) : (
                  stageDeals.map((deal) => {
                    const ct = cardTypeMap.get(deal.card_type_id);
                    if (!ct) return null;
                    return (
                      <DealCard
                        key={deal.id}
                        deal={deal}
                        cardType={ct}
                        stageConfig={stageConfigMap.get(deal.stage)}
                        hasRelationships={relationshipDealIds.has(deal.id)}
                        onClick={() => onDealClick(deal)}
                      />
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
