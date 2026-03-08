import { createAdminClient } from "@/lib/supabase/admin";
import { PageLayoutManagerView } from "./PageLayoutManagerView";

export const dynamic = "force-dynamic";

export default async function PageLayoutsPage() {
  const admin = createAdminClient();

  // Fetch all active layouts with their section counts
  const { data: layouts } = await admin
    .from("page_layouts")
    .select("id, object_type, name")
    .eq("is_active", true)
    .is("role", null)
    .order("object_type");

  // Fetch field configurations to show unassigned fields
  const { data: fieldConfigs } = await admin
    .from("field_configurations")
    .select("id, module, field_key, field_label, field_type")
    .eq("is_visible", true)
    .order("module")
    .order("display_order", { ascending: true });

  return (
    <PageLayoutManagerView
      initialLayouts={layouts ?? []}
      fieldConfigs={fieldConfigs ?? []}
    />
  );
}
