import { fetchPageLayout, fetchAvailableFields } from "../actions";
import { ContactPageManagerView } from "./ContactPageManagerView";

export const dynamic = "force-dynamic";

const CONTACT_FIELD_MODULES = [
  "contact_profile",
  "borrower_profile",
  "investor_profile",
];

export default async function ContactPageManagerPage() {
  const [layoutResult, fieldsResult] = await Promise.all([
    fetchPageLayout("contact_detail"),
    fetchAvailableFields(CONTACT_FIELD_MODULES),
  ]);

  if (layoutResult.error || fieldsResult.error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-destructive">
          Failed to load layout: {layoutResult.error || fieldsResult.error}
        </p>
      </div>
    );
  }

  return (
    <ContactPageManagerView
      initialSections={layoutResult.sections ?? []}
      initialFields={layoutResult.fields ?? []}
      availableFieldConfigs={fieldsResult.data ?? []}
    />
  );
}
