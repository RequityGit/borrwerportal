"use client";

import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { DynamicField } from "./DynamicField";
import { createClient } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PageObjectType =
  | "contact"
  | "company"
  | "opportunity"
  | "loan"
  | "property"
  | "investment"
  | "borrower_profile"
  | "investor_profile";

interface LayoutFieldConfig {
  field_key: string;
  label_override: string | null;
  column_position: number;
  sort_order: number;
  is_read_only: boolean;
  span: number;
  display_format: string | null;
  placeholder: string | null;
  help_text: string | null;
}

interface LayoutSectionConfig {
  section_key: string;
  title: string;
  subtitle: string | null;
  icon: string | null;
  column_layout: string;
  sort_order: number;
  is_collapsible: boolean;
  is_collapsed_default: boolean;
  tab_group: string | null;
  span: string;
  fields: LayoutFieldConfig[];
}

interface LayoutTabConfig {
  tab_key: string;
  title: string;
  icon: string | null;
  sort_order: number;
  badge_field: string | null;
}

interface PageLayoutConfig {
  layout_id: string;
  object_type: string;
  name: string;
  tabs: LayoutTabConfig[];
  sections: LayoutSectionConfig[];
}

// Field definition from field_configurations table
interface FieldDefinition {
  field_key: string;
  field_label: string;
  field_type: string;
  dropdown_options?: string[] | null;
}

export interface DynamicPageRendererProps {
  objectType: PageObjectType;
  record: Record<string, unknown>;
  onFieldChange: (fieldKey: string, value: unknown) => void;
  fieldDefinitions?: FieldDefinition[];
  isEditing?: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// Section component
// ---------------------------------------------------------------------------

function LayoutSection({
  section,
  record,
  fieldDefinitions,
  onFieldChange,
  isEditing,
}: {
  section: LayoutSectionConfig;
  record: Record<string, unknown>;
  fieldDefinitions: Map<string, FieldDefinition>;
  onFieldChange: (fieldKey: string, value: unknown) => void;
  isEditing: boolean;
}) {
  const [isOpen, setIsOpen] = useState(!section.is_collapsed_default);

  const colCount = parseInt(section.column_layout) || 2;
  const gridClass =
    colCount === 1
      ? "grid-cols-1"
      : colCount === 3
        ? "grid-cols-3"
        : "grid-cols-2";

  const content = (
    <div className={cn("grid gap-x-6", gridClass)}>
      {section.fields.map((field) => {
        const def = fieldDefinitions.get(field.field_key);
        const label = field.label_override ?? def?.field_label ?? field.field_key;
        const fieldType = field.display_format ?? def?.field_type ?? "text";
        const value = record[field.field_key];
        const colSpan =
          field.span > 1
            ? colCount === 3
              ? "col-span-3"
              : "col-span-2"
            : undefined;

        return (
          <div key={field.field_key} className={colSpan}>
            <DynamicField
              fieldKey={field.field_key}
              fieldType={fieldType}
              label={label}
              value={value}
              onChange={(v) => onFieldChange(field.field_key, v)}
              dropdownOptions={def?.dropdown_options}
              disabled={field.is_read_only || !isEditing}
            />
          </div>
        );
      })}
    </div>
  );

  if (!section.is_collapsible) {
    return (
      <div
        className={cn(
          "rounded-lg border border-border bg-card",
          section.span === "half" ? "col-span-1" : "col-span-2"
        )}
      >
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-[13px] font-semibold">{section.title}</h3>
          {section.subtitle && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {section.subtitle}
            </p>
          )}
        </div>
        <div className="px-4 py-1">{content}</div>
      </div>
    );
  }

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn(
        "rounded-lg border border-border bg-card",
        section.span === "half" ? "col-span-1" : "col-span-2"
      )}
    >
      <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 border-b border-border hover:bg-muted/30 transition-colors">
        <div>
          <h3 className="text-[13px] font-semibold text-left">{section.title}</h3>
          {section.subtitle && (
            <p className="text-[11px] text-muted-foreground mt-0.5 text-left">
              {section.subtitle}
            </p>
          )}
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-4 py-1">{content}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ---------------------------------------------------------------------------
// Main renderer
// ---------------------------------------------------------------------------

export function DynamicPageRenderer({
  objectType,
  record,
  onFieldChange,
  fieldDefinitions: providedFieldDefs,
  isEditing = true,
  className,
}: DynamicPageRendererProps) {
  const [layoutConfig, setLayoutConfig] = useState<PageLayoutConfig | null>(null);
  const [fieldDefs, setFieldDefs] = useState<FieldDefinition[]>(
    providedFieldDefs ?? []
  );
  const [loading, setLoading] = useState(true);

  // Load layout config from database
  useEffect(() => {
    let cancelled = false;

    async function loadLayout() {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc("get_page_layout", {
          p_object_type: objectType,
        });

        if (error) {
          console.error("Failed to load page layout:", error);
          setLayoutConfig(null);
        } else if (!cancelled) {
          setLayoutConfig(data as unknown as PageLayoutConfig);
        }

        // Load field definitions if not provided
        if (!providedFieldDefs) {
          const { data: configs } = await supabase
            .from("field_configurations")
            .select("field_key, field_label, field_type, dropdown_options")
            .order("module")
            .order("display_order", { ascending: true });

          if (configs && !cancelled) {
            setFieldDefs(
              configs.map((c) => ({
                field_key: c.field_key,
                field_label: c.field_label,
                field_type: c.field_type,
                dropdown_options: Array.isArray(c.dropdown_options)
                  ? (c.dropdown_options as string[])
                  : null,
              }))
            );
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadLayout();
    return () => {
      cancelled = true;
    };
  }, [objectType, providedFieldDefs]);

  const fieldDefMap = useMemo(() => {
    const map = new Map<string, FieldDefinition>();
    for (const def of fieldDefs) {
      map.set(def.field_key, def);
    }
    return map;
  }, [fieldDefs]);

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!layoutConfig) {
    return null;
  }

  const { tabs, sections } = layoutConfig;

  // No tabs — render sections directly
  if (tabs.length === 0) {
    return (
      <div className={cn("grid grid-cols-2 gap-4", className)}>
        {sections.map((section) => (
          <LayoutSection
            key={section.section_key}
            section={section}
            record={record}
            fieldDefinitions={fieldDefMap}
            onFieldChange={onFieldChange}
            isEditing={isEditing}
          />
        ))}
      </div>
    );
  }

  // Tabbed layout
  return (
    <Tabs defaultValue={tabs[0].tab_key} className={className}>
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.tab_key} value={tab.tab_key}>
            {tab.title}
            {tab.badge_field && record[tab.badge_field] != null && (
              <span className="ml-1.5 text-[10px] font-bold bg-primary/10 text-primary rounded-full px-1.5">
                {String(record[tab.badge_field])}
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => {
        const tabSections = sections.filter(
          (s) => s.tab_group === tab.tab_key
        );
        return (
          <TabsContent
            key={tab.tab_key}
            value={tab.tab_key}
            className="grid grid-cols-2 gap-4 mt-4"
          >
            {tabSections.map((section) => (
              <LayoutSection
                key={section.section_key}
                section={section}
                record={record}
                fieldDefinitions={fieldDefMap}
                onFieldChange={onFieldChange}
                isEditing={isEditing}
              />
            ))}
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
