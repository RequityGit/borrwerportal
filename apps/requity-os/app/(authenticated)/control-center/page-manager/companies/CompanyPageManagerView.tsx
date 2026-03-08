"use client";

import { PageManagerView } from "../_components/PageManagerView";
import type { PageSection, PageField, FieldConfigInfo } from "../actions";

interface CompanyPageManagerViewProps {
  initialSections: PageSection[];
  initialFields: PageField[];
  availableFieldConfigs: FieldConfigInfo[];
}

export function CompanyPageManagerView({
  initialSections,
  initialFields,
  availableFieldConfigs,
}: CompanyPageManagerViewProps) {
  return (
    <PageManagerView
      pageType="company_detail"
      pageTitle="Company Detail Layout"
      pageDescription="Manage sections and fields displayed on the company detail page."
      initialSections={initialSections}
      initialFields={initialFields}
      availableFieldConfigs={availableFieldConfigs}
    />
  );
}
