import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { WorkflowBuilderShell } from "@/components/admin/workflow-builder/workflow-builder-shell";

export const dynamic = "force-dynamic";

export default async function WorkflowBuilderPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Verify admin access
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("is_active", true);

  const isAdmin = roles?.some(
    (r) => r.role === "admin" || r.role === "super_admin"
  );
  if (!isAdmin) redirect("/admin/dashboard");

  // Fetch all workflow definitions with stages and rules
  const { data: workflows } = await supabase
    .from("workflow_definitions")
    .select("*")
    .order("created_at", { ascending: true });

  const { data: stages } = await supabase
    .from("workflow_stages")
    .select("*")
    .order("position", { ascending: true });

  const { data: rules } = await supabase
    .from("workflow_rules")
    .select("*")
    .order("execution_order", { ascending: true });

  return (
    <WorkflowBuilderShell
      initialWorkflows={workflows ?? []}
      initialStages={stages ?? []}
      initialRules={rules ?? []}
    />
  );
}
