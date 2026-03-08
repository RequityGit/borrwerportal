"use client";

import { useState, useCallback, useMemo, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  Building2,
  MapPin,
  Landmark,
  FileText,
  Banknote,
  Target,
  Eye,
  EyeOff,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SectionCard,
  MetricCard,
  FieldRow,
} from "@/components/crm/contact-360/contact-detail-shared";
import {
  CrmEditSectionDialog,
  type CrmSectionField,
  type CrmFieldType,
} from "@/components/crm/crm-edit-section-dialog";
import { useToast } from "@/components/ui/use-toast";
import { formatDate, formatPhoneInput } from "@/lib/format";
import { ClickToCallNumber } from "@/components/ui/ClickToCallNumber";
import { updateCompanyAction } from "@/app/(authenticated)/admin/crm/company-actions";
import type {
  CompanyDetailData,
  CompanyWireData,
  CompanyFileData,
} from "../types";
import {
  COMPANY_TYPE_CONFIG,
  SUBTYPE_LABELS,
  PROGRAM_LABELS,
  ASSET_LABELS,
  CAPABILITY_LABELS,
} from "../types";
import type { FieldLayout } from "@/components/crm/contact-360/types";

interface OverviewTabProps {
  company: CompanyDetailData;
  wireInstructions: CompanyWireData | null;
  files: CompanyFileData[];
  sectionFields: Record<string, FieldLayout[]>;
  onEditLenderDetails?: () => void;
}

const COMPANY_TYPE_OPTIONS = Object.entries(COMPANY_TYPE_CONFIG).map(
  ([value, { label }]) => ({ value, label })
);

// --- Dropdown option fallbacks for built-in company fields ---
const DROPDOWN_FALLBACKS: Record<string, { label: string; value: string }[]> = {
  company_type: COMPANY_TYPE_OPTIONS,
};

// --- field_type → CrmFieldType mapping for edit dialogs ---
const FC_TYPE_TO_CRM: Record<string, CrmFieldType> = {
  text: "text",
  email: "text",
  phone: "text",
  number: "number",
  currency: "currency",
  date: "date",
  boolean: "boolean",
  dropdown: "select",
  percentage: "number",
};

// --- Field key → property name mapping for mismatches ---
const FIELD_KEY_TO_PROP: Record<string, string> = {
  legal_name: "name",
  dba_names: "other_names",
  subtype: "company_subtype",
  status: "is_active",
  is_title_co_verified: "title_company_verified",
};

// --- Custom renderers for fields with special display logic ---
type FieldRenderer = (val: unknown, company: CompanyDetailData) => ReactNode | null;
const FIELD_RENDERERS: Record<string, FieldRenderer> = {
  company_type: (v) => {
    if (!v) return undefined;
    const cfg = COMPANY_TYPE_CONFIG[v as string];
    return cfg?.label ?? String(v);
  },
  subtype: (v) => {
    if (!v) return undefined;
    return SUBTYPE_LABELS[v as string] ?? String(v);
  },
  phone: (v) => {
    if (!v) return undefined;
    return <ClickToCallNumber number={v as string} showIcon={false} />;
  },
  website: (v) => {
    if (!v) return undefined;
    return String(v).replace(/^https?:\/\//, "");
  },
  status: (v) => {
    return v ? "Active" : "Inactive";
  },
  is_title_co_verified: (v) => {
    return v ? "Yes" : "No";
  },
};

// --- Dynamic field rendering helper ---
function renderDynamicFields(
  fields: FieldLayout[],
  dataObj: Record<string, unknown>,
  company: CompanyDetailData,
): ReactNode {
  const visible = fields
    .filter((f) => f.is_visible)
    .sort((a, b) => a.display_order - b.display_order);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
      {visible.map((f) => {
        const propKey = FIELD_KEY_TO_PROP[f.field_key] ?? f.field_key;
        const rawValue = dataObj[propKey];

        // Check for custom renderer
        const customRender = FIELD_RENDERERS[f.field_key];
        if (customRender) {
          const rendered = customRender(rawValue, company);
          if (rendered === null) return null; // skip field
          return (
            <FieldRow
              key={f.field_key}
              label={f.field_label}
              value={rendered}
              mono={f.field_type === "currency"}
            />
          );
        }

        // Standard rendering by field_type
        let displayValue: ReactNode;
        switch (f.field_type) {
          case "currency":
            displayValue = rawValue != null ? `$${Number(rawValue).toLocaleString()}` : undefined;
            break;
          case "date":
            displayValue = formatDate(rawValue as string | null);
            break;
          case "boolean":
            displayValue = rawValue != null ? (rawValue ? "Yes" : "No") : undefined;
            break;
          case "dropdown":
            displayValue = rawValue
              ? String(rawValue).charAt(0).toUpperCase() + String(rawValue).slice(1).replace(/_/g, " ")
              : undefined;
            break;
          default:
            displayValue = rawValue != null ? String(rawValue) : undefined;
        }

        return (
          <FieldRow
            key={f.field_key}
            label={f.field_label}
            value={displayValue}
            mono={f.field_type === "currency"}
          />
        );
      })}
    </div>
  );
}

// --- Mask sensitive values (show last 4 chars) ---
function maskValue(val: string): string {
  return val.replace(/./g, (c, i) => (i < val.length - 4 ? "●" : c));
}

// --- Masked fields in wire instructions ---
const MASKED_WIRE_FIELDS = new Set(["account_number", "routing_number"]);

// --- Dynamic wire instructions renderer with masking ---
function renderWireFields(
  fields: FieldLayout[],
  wire: CompanyWireData,
  showWire: boolean,
): ReactNode {
  const wireData = wire as unknown as Record<string, unknown>;
  const visible = fields
    .filter((f) => f.is_visible)
    .sort((a, b) => a.display_order - b.display_order);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
      {visible.map((f) => {
        const rawValue = wireData[f.field_key];
        const isMasked = MASKED_WIRE_FIELDS.has(f.field_key);

        let displayValue: ReactNode;
        if (isMasked && typeof rawValue === "string") {
          displayValue = showWire ? rawValue : maskValue(rawValue);
        } else if (f.field_type === "dropdown" && rawValue) {
          displayValue = String(rawValue).charAt(0).toUpperCase() + String(rawValue).slice(1);
        } else if (f.field_type === "date" && rawValue) {
          displayValue = formatDate(rawValue as string);
        } else {
          displayValue = rawValue != null ? String(rawValue) : undefined;
        }

        return (
          <FieldRow
            key={f.field_key}
            label={f.field_label}
            value={displayValue}
            mono={isMasked}
          />
        );
      })}
    </div>
  );
}

// --- Build edit dialog fields from layout data ---
function buildEditFields(
  fields: FieldLayout[],
  dataObj: Record<string, unknown>,
): CrmSectionField[] {
  return fields
    .filter((f) => f.is_visible)
    .sort((a, b) => a.display_order - b.display_order)
    .map((f) => {
      const propKey = FIELD_KEY_TO_PROP[f.field_key] ?? f.field_key;
      const options = f.dropdown_options ?? DROPDOWN_FALLBACKS[f.field_key] ?? undefined;
      let value = dataObj[propKey] as string | number | boolean | null | undefined;

      // Format phone for edit input
      if (f.field_type === "phone" && typeof value === "string") {
        value = formatPhoneInput(value) || value;
      }

      return {
        label: f.field_label,
        fieldName: propKey,
        fieldType: FC_TYPE_TO_CRM[f.field_type] ?? "text",
        options,
        value,
      };
    });
}

function ChipGroup({
  items,
  labelMap,
  color,
}: {
  items: string[];
  labelMap: Record<string, string>;
  color: string;
}) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {items.map((item) => (
        <span
          key={item}
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border whitespace-nowrap"
          style={{ borderColor: color, color }}
        >
          {labelMap[item] ||
            item
              .replace(/_/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase())}
        </span>
      ))}
      {items.length === 0 && (
        <span className="text-xs text-muted-foreground italic">None configured</span>
      )}
    </div>
  );
}

export function CompanyOverviewTab({
  company,
  wireInstructions,
  files,
  sectionFields,
  onEditLenderDetails,
}: OverviewTabProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [showWire, setShowWire] = useState(false);
  const [editCompanyOpen, setEditCompanyOpen] = useState(false);
  const [editAddressOpen, setEditAddressOpen] = useState(false);
  const [editAgreementsOpen, setEditAgreementsOpen] = useState(false);
  const [editNotesOpen, setEditNotesOpen] = useState(false);
  const isLender = company.company_type === "lender";
  const typeCfg =
    COMPANY_TYPE_CONFIG[company.company_type] || COMPANY_TYPE_CONFIG.other;

  // Compute NDA status for display
  const ndaStatusPill = (() => {
    if (!company.nda_created_date) return { label: "Missing", color: "#E5453D" };
    if (!company.nda_expiration_date) return { label: "On File", color: "#22A861" };
    const exp = new Date(company.nda_expiration_date);
    const now = new Date();
    if (exp < now) return { label: "Expired", color: "#E5453D" };
    return { label: "On File", color: "#22A861" };
  })();

  // NDA expiration danger flag (within ~3 months)
  const ndaExpDanger =
    company.nda_expiration_date &&
    new Date(company.nda_expiration_date).getTime() - new Date().getTime() <
      90 * 86400000;

  const saveField = useCallback(
    async (field: string, value: string | number | boolean | null) => {
      const result = await updateCompanyAction({
        id: company.id,
        [field]: value,
      });
      if ("error" in result && result.error) {
        toast({ title: "Error saving", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Saved" });
      }
      router.refresh();
    },
    [company.id, router, toast]
  );

  // Data object for dynamic field rendering
  const companyData = company as unknown as Record<string, unknown>;

  // --- Section field definitions for edit dialogs ---
  const companyInfoFields: CrmSectionField[] = useMemo(
    () => sectionFields.company_information?.length
      ? buildEditFields(sectionFields.company_information, companyData)
      : [
          { label: "Legal Name", fieldName: "name", fieldType: "text", value: company.name },
          { label: "DBA / Other Names", fieldName: "other_names", fieldType: "text", value: company.other_names },
          { label: "Company Type", fieldName: "company_type", fieldType: "select", value: company.company_type, options: COMPANY_TYPE_OPTIONS },
          { label: "Phone", fieldName: "phone", fieldType: "text", value: formatPhoneInput(company.phone ?? "") || company.phone },
          { label: "Email", fieldName: "email", fieldType: "text", value: company.email },
          { label: "Website", fieldName: "website", fieldType: "text", value: company.website },
          { label: "Source", fieldName: "source", fieldType: "text", value: company.source },
          { label: "Status", fieldName: "is_active", fieldType: "boolean", value: company.is_active },
          { label: "Title Co. Verified", fieldName: "title_company_verified", fieldType: "boolean", value: company.title_company_verified },
        ],
    [sectionFields, companyData, company]
  );

  const addressFields: CrmSectionField[] = [
    { label: "Address Line 1", fieldName: "address_line1", fieldType: "text", value: company.address_line1 },
    { label: "Address Line 2", fieldName: "address_line2", fieldType: "text", value: company.address_line2 },
    { label: "City", fieldName: "city", fieldType: "text", value: company.city },
    { label: "State", fieldName: "state", fieldType: "text", value: company.state },
    { label: "Zip", fieldName: "zip", fieldType: "text", value: company.zip },
    { label: "Country", fieldName: "country", fieldType: "text", value: company.country || "US" },
  ];

  const agreementFields: CrmSectionField[] = [
    { label: "NDA Created", fieldName: "nda_created_date", fieldType: "date", value: company.nda_created_date },
    { label: "NDA Expiration", fieldName: "nda_expiration_date", fieldType: "date", value: company.nda_expiration_date },
    { label: "Fee Agreement On File", fieldName: "fee_agreement_on_file", fieldType: "boolean", value: company.fee_agreement_on_file },
  ];

  const notesFields: CrmSectionField[] = [
    { label: "Description", fieldName: "notes", fieldType: "textarea", value: company.notes },
  ];

  function SectionEditButton({ onClick }: { onClick: () => void }) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="gap-1 text-xs h-7 text-muted-foreground"
        onClick={onClick}
      >
        <Pencil size={12} strokeWidth={1.5} /> Edit
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Lender Performance Metrics - placeholder for future data */}
      {isLender && (
        <SectionCard title="Lender Performance" icon={TrendingUp}>
          <div className="flex gap-5 flex-wrap">
            <MetricCard label="Deals Submitted" value="—" />
            <MetricCard label="Deals Funded" value="—" />
            <MetricCard label="Hit Rate" value="—" mono />
            <MetricCard label="Funded Volume" value="—" mono />
            <MetricCard label="Avg Rate" value="—" mono />
            <MetricCard label="Avg Close Time" value="—" mono />
          </div>
        </SectionCard>
      )}

      {/* Company Information */}
      <SectionCard title="Company Information" icon={Building2} action={<SectionEditButton onClick={() => setEditCompanyOpen(true)} />}>
        {sectionFields.company_information?.length
          ? renderDynamicFields(sectionFields.company_information, companyData, company)
          : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
              <FieldRow label="Legal Name" value={company.name} />
              <FieldRow label="DBA / Other Names" value={company.other_names} />
              <FieldRow label="Company Type" value={typeCfg.label} />
              {company.company_subtype && (
                <FieldRow
                  label="Subtype"
                  value={SUBTYPE_LABELS[company.company_subtype] || company.company_subtype}
                />
              )}
              <FieldRow
                label="Phone"
                value={company.phone ? <ClickToCallNumber number={company.phone} showIcon={false} /> : undefined}
              />
              <FieldRow label="Email" value={company.email} />
              <FieldRow
                label="Website"
                value={company.website ? company.website.replace(/^https?:\/\//, "") : undefined}
              />
              <FieldRow label="Source" value={company.source} />
              <FieldRow label="Status" value={company.is_active ? "Active" : "Inactive"} />
              <FieldRow label="Title Co. Verified" value={company.title_company_verified ? "Yes" : "No"} />
            </div>
          )}
      </SectionCard>

      {/* Address */}
      <SectionCard title="Address" icon={MapPin} action={<SectionEditButton onClick={() => setEditAddressOpen(true)} />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
          <FieldRow label="Address Line 1" value={company.address_line1} />
          <FieldRow label="Address Line 2" value={company.address_line2} />
          <FieldRow label="City" value={company.city} />
          <FieldRow label="State" value={company.state} />
          <FieldRow label="Zip" value={company.zip} mono />
          <FieldRow label="Country" value={company.country || "US"} />
        </div>
      </SectionCard>

      {/* Lender Details */}
      {isLender && (
        <SectionCard
          title="Lender Details"
          icon={Landmark}
          action={
            onEditLenderDetails ? (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-xs h-7 text-muted-foreground"
                onClick={onEditLenderDetails}
              >
                <Pencil size={12} strokeWidth={1.5} /> Edit
              </Button>
            ) : undefined
          }
        >
          <div className="flex flex-col gap-5">
            <div>
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Programs
              </div>
              <ChipGroup
                items={company.lender_programs ?? []}
                labelMap={PROGRAM_LABELS}
                color="#3B82F6"
              />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Asset Types
              </div>
              <ChipGroup
                items={company.asset_types ?? []}
                labelMap={ASSET_LABELS}
                color="#E5930E"
              />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Geographies
              </div>
              <ChipGroup
                items={company.geographies ?? []}
                labelMap={{}}
                color="#22A861"
              />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Capabilities
              </div>
              <ChipGroup
                items={company.company_capabilities ?? []}
                labelMap={CAPABILITY_LABELS}
                color="#8B5CF6"
              />
            </div>
          </div>
        </SectionCard>
      )}

      {/* Non-lender: capabilities/asset_types/geographies if populated */}
      {!isLender &&
        ((company.company_capabilities ?? []).length > 0 ||
          (company.asset_types ?? []).length > 0 ||
          (company.geographies ?? []).length > 0) && (
          <SectionCard title="Capabilities & Coverage" icon={Target}>
            <div className="flex flex-col gap-4">
              {(company.company_capabilities ?? []).length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Capabilities
                  </div>
                  <ChipGroup
                    items={company.company_capabilities!}
                    labelMap={CAPABILITY_LABELS}
                    color="#8B5CF6"
                  />
                </div>
              )}
              {(company.asset_types ?? []).length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Asset Types
                  </div>
                  <ChipGroup
                    items={company.asset_types!}
                    labelMap={ASSET_LABELS}
                    color="#E5930E"
                  />
                </div>
              )}
              {(company.geographies ?? []).length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Geographies
                  </div>
                  <ChipGroup
                    items={company.geographies!}
                    labelMap={{}}
                    color="#22A861"
                  />
                </div>
              )}
            </div>
          </SectionCard>
        )}

      {/* Agreements */}
      <SectionCard title="Agreements" icon={FileText} action={<SectionEditButton onClick={() => setEditAgreementsOpen(true)} />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
          <FieldRow
            label="NDA Status"
            value={
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                style={{
                  backgroundColor: `${ndaStatusPill.color}14`,
                  color: ndaStatusPill.color,
                }}
              >
                {ndaStatusPill.label}
              </span>
            }
          />
          <FieldRow
            label="NDA Created"
            value={
              company.nda_created_date
                ? formatDate(company.nda_created_date)
                : undefined
            }
          />
          <FieldRow
            label="NDA Expiration"
            value={
              company.nda_expiration_date
                ? formatDate(company.nda_expiration_date)
                : undefined
            }
            danger={!!ndaExpDanger}
          />
          <FieldRow
            label="Fee Agreement"
            value={
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                style={{
                  backgroundColor: company.fee_agreement_on_file
                    ? "#22A86114"
                    : "#E5453D14",
                  color: company.fee_agreement_on_file ? "#22A861" : "#E5453D",
                }}
              >
                {company.fee_agreement_on_file ? "On File" : "Missing"}
              </span>
            }
          />
        </div>
      </SectionCard>

      {/* Wire Instructions */}
      <SectionCard
        title="Wire Instructions"
        icon={Banknote}
        action={
          wireInstructions ? (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs h-7 text-muted-foreground"
              onClick={() => setShowWire(!showWire)}
            >
              {showWire ? (
                <EyeOff size={13} strokeWidth={1.5} />
              ) : (
                <Eye size={13} strokeWidth={1.5} />
              )}
              {showWire ? "Hide" : "Reveal"}
            </Button>
          ) : undefined
        }
      >
        {wireInstructions ? (
          sectionFields.wire_instructions?.length
            ? renderWireFields(sectionFields.wire_instructions, wireInstructions, showWire)
            : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
                <FieldRow label="Bank Name" value={wireInstructions.bank_name} />
                <FieldRow label="Account Name" value={wireInstructions.account_name} />
                <FieldRow
                  label="Account Number"
                  value={showWire ? wireInstructions.account_number : maskValue(wireInstructions.account_number)}
                  mono
                />
                <FieldRow
                  label="Routing Number"
                  value={showWire ? wireInstructions.routing_number : maskValue(wireInstructions.routing_number)}
                  mono
                />
                <FieldRow
                  label="Wire Type"
                  value={wireInstructions.wire_type.charAt(0).toUpperCase() + wireInstructions.wire_type.slice(1)}
                />
              </div>
            )
        ) : (
          <span className="text-[13px] text-muted-foreground">
            No wire instructions on file.
          </span>
        )}
      </SectionCard>

      {/* Description */}
      <SectionCard title="Description" icon={FileText} action={<SectionEditButton onClick={() => setEditNotesOpen(true)} />}>
        <p className="text-[13px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {company.notes || "No notes."}
        </p>
      </SectionCard>

      {/* Section Edit Dialogs */}
      <CrmEditSectionDialog
        open={editCompanyOpen}
        onOpenChange={setEditCompanyOpen}
        title="Company Information"
        fields={companyInfoFields}
        onSave={saveField}
      />
      <CrmEditSectionDialog
        open={editAddressOpen}
        onOpenChange={setEditAddressOpen}
        title="Address"
        fields={addressFields}
        onSave={saveField}
      />
      <CrmEditSectionDialog
        open={editAgreementsOpen}
        onOpenChange={setEditAgreementsOpen}
        title="Agreements"
        fields={agreementFields}
        onSave={saveField}
      />
      <CrmEditSectionDialog
        open={editNotesOpen}
        onOpenChange={setEditNotesOpen}
        title="Description"
        fields={notesFields}
        onSave={saveField}
      />
    </div>
  );
}
