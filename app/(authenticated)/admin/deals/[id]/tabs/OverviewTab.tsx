"use client";

import {
  FileText,
  Building2,
  Shield,
} from "lucide-react";
import {
  SectionCard,
  fmt,
  fP,
  cap,
  type DealData,
} from "../components";
import { EditableFieldRow } from "../EditableFieldRow";
import type { SelectOption } from "../EditableFieldRow";
import {
  LOAN_DB_TYPES,
  LOAN_PURPOSES,
  FUNDING_CHANNELS,
  INVESTMENT_STRATEGIES,
  DEAL_FINANCING_OPTIONS,
  DEBT_TRANCHES,
} from "@/lib/constants";
import { PROPERTY_TYPE_OPTIONS } from "@/lib/constants";

interface OverviewTabProps {
  deal: DealData;
  onSave?: (field: string, value: string | number | null) => Promise<boolean>;
  onSaveRelated?: (
    table: string,
    id: string,
    field: string,
    value: string | number | null
  ) => Promise<boolean>;
}

// Helper to convert const arrays to SelectOption[]
function toOptions(
  arr: readonly { value: string; label: string }[]
): SelectOption[] {
  return arr.map((i) => ({ value: i.value, label: i.label }));
}

export function OverviewTab({ deal, onSave, onSaveRelated }: OverviewTabProps) {
  const d = deal;

  return (
    <div className="flex flex-col gap-4">
      {/* Loan Details */}
      <SectionCard title="Loan Details" icon={FileText}>
        <div className="grid grid-cols-2 gap-x-8">
          <EditableFieldRow
            label="Loan Number"
            value={d.loan_number}
            fieldName="loan_number"
            mono
          />
          <EditableFieldRow
            label="Type"
            value={d.type || d.loan_type}
            displayValue={cap(d.type || d.loan_type)}
            fieldName="type"
            fieldType="select"
            options={toOptions(LOAN_DB_TYPES)}
            onSave={onSave}
          />
          <EditableFieldRow
            label="Purpose"
            value={d.purpose || d.loan_purpose}
            displayValue={cap(d.purpose || d.loan_purpose)}
            fieldName="purpose"
            fieldType="select"
            options={toOptions(LOAN_PURPOSES)}
            onSave={onSave}
          />
          <EditableFieldRow
            label="Channel"
            value={d.funding_channel}
            displayValue={cap(d.funding_channel)}
            fieldName="funding_channel"
            fieldType="select"
            options={toOptions(FUNDING_CHANNELS)}
            onSave={onSave}
          />
          <EditableFieldRow
            label="Strategy"
            value={d.strategy || d.investment_strategy}
            displayValue={cap(d.strategy || d.investment_strategy)}
            fieldName="strategy"
            fieldType="select"
            options={toOptions(INVESTMENT_STRATEGIES)}
            onSave={onSave}
          />
          <EditableFieldRow
            label="Financing"
            value={d.financing || d.deal_financing}
            displayValue={cap(d.financing || d.deal_financing)}
            fieldName="financing"
            fieldType="select"
            options={toOptions(DEAL_FINANCING_OPTIONS)}
            onSave={onSave}
          />
          <EditableFieldRow
            label="Tranche"
            value={d.debt_tranche}
            displayValue={cap(d.debt_tranche)}
            fieldName="debt_tranche"
            fieldType="select"
            options={toOptions(DEBT_TRANCHES)}
            onSave={onSave}
          />
          <EditableFieldRow
            label="Programs"
            value={d.deal_programs?.join(", ")}
            fieldName="deal_programs"
            onSave={onSave}
          />
        </div>
      </SectionCard>

      {/* Property */}
      <SectionCard title="Property" icon={Building2}>
        <div className="grid grid-cols-2 gap-x-8">
          <EditableFieldRow
            label="Address"
            value={d.property_address_line1 || d.property_address?.split(",")[0]}
            fieldName="property_address_line1"
            onSave={onSave}
          />
          <EditableFieldRow
            label="City"
            value={d.property_city}
            fieldName="property_city"
            onSave={onSave}
          />
          <EditableFieldRow
            label="State"
            value={d.property_state}
            fieldName="property_state"
            onSave={onSave}
          />
          <EditableFieldRow
            label="Zip"
            value={d.property_zip}
            fieldName="property_zip"
            onSave={onSave}
          />
          <EditableFieldRow
            label="Property Type"
            value={d.property_type}
            displayValue={cap(d.property_type)}
            fieldName="property_type"
            fieldType="select"
            options={PROPERTY_TYPE_OPTIONS as unknown as SelectOption[]}
            onSave={onSave}
          />
          <EditableFieldRow
            label="Units"
            value={d.property_units ?? d.number_of_units}
            fieldName="property_units"
            fieldType="number"
            mono
            onSave={onSave}
          />
          <EditableFieldRow
            label="Year Built"
            value={d._property_year_built}
            fieldName="_property_year_built"
            fieldType="number"
            mono
            onSave={onSave}
          />
          <EditableFieldRow
            label="Sq Ft"
            value={d._property_sqft}
            displayValue={d._property_sqft ? d._property_sqft.toLocaleString() : null}
            fieldName="_property_sqft"
            fieldType="number"
            mono
            onSave={onSave}
          />
          <EditableFieldRow
            label="Appraised Value"
            value={d.appraised_value}
            displayValue={fmt(d.appraised_value)}
            fieldName="appraised_value"
            fieldType="currency"
            mono
            onSave={onSave}
          />
          <EditableFieldRow
            label="Purchase Price"
            value={d.purchase_price}
            displayValue={fmt(d.purchase_price)}
            fieldName="purchase_price"
            fieldType="currency"
            mono
            onSave={onSave}
          />
        </div>
      </SectionCard>

      {/* Borrower Entity */}
      <SectionCard title="Borrower Entity" icon={Shield}>
        <div className="grid grid-cols-2 gap-x-8">
          <EditableFieldRow
            label="Entity Name"
            value={d._entity_name}
            fieldName="entity_name"
            relatedTable="borrower_entities"
            relatedId={d.borrower_entity_id}
            onSaveRelated={onSaveRelated}
          />
          <EditableFieldRow
            label="Entity Type"
            value={d._entity_type}
            displayValue={cap(d._entity_type)}
            fieldName="entity_type"
            fieldType="select"
            options={[
              { value: "llc", label: "LLC" },
              { value: "corporation", label: "Corporation" },
              { value: "partnership", label: "Partnership" },
              { value: "trust", label: "Trust" },
              { value: "individual", label: "Individual" },
              { value: "other", label: "Other" },
            ]}
            relatedTable="borrower_entities"
            relatedId={d.borrower_entity_id}
            onSaveRelated={onSaveRelated}
          />
          <EditableFieldRow
            label="Guarantor"
            value={d._borrower_name}
            fieldName="first_name"
            relatedTable="borrowers"
            relatedId={d.borrower_id}
            onSaveRelated={onSaveRelated}
          />
          <EditableFieldRow
            label="FICO"
            value={d._borrower_credit_score}
            fieldName="credit_score"
            fieldType="number"
            mono
            relatedTable="borrowers"
            relatedId={d.borrower_id}
            onSaveRelated={onSaveRelated}
          />
          <EditableFieldRow
            label="Liquidity"
            value={d._borrower_liquidity}
            displayValue={fmt(d._borrower_liquidity)}
            fieldName="verified_liquidity"
            fieldType="currency"
            mono
            relatedTable="borrowers"
            relatedId={d.borrower_id}
            onSaveRelated={onSaveRelated}
          />
          <EditableFieldRow
            label="Experience"
            value={d._borrower_experience}
            displayValue={
              d._borrower_experience != null
                ? `${d._borrower_experience} properties`
                : null
            }
            fieldName="experience_count"
            fieldType="number"
            relatedTable="borrowers"
            relatedId={d.borrower_id}
            onSaveRelated={onSaveRelated}
          />
        </div>
      </SectionCard>
    </div>
  );
}
