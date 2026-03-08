"use client";

import { PageManagerView } from "../_components/PageManagerView";
import type { PageSection, PageField, FieldConfigInfo } from "../actions";

interface ContactPageManagerViewProps {
  initialSections: PageSection[];
  initialFields: PageField[];
  availableFieldConfigs: FieldConfigInfo[];
}

export function ContactPageManagerView({
  initialSections,
  initialFields,
  availableFieldConfigs,
}: ContactPageManagerViewProps) {
  return (
    <PageManagerView
      pageType="contact_detail"
      pageTitle="Contact Detail Layout"
      pageDescription="Manage sections and fields displayed on the contact detail page."
      initialSections={initialSections}
      initialFields={initialFields}
      availableFieldConfigs={availableFieldConfigs}
    />
  );
}
