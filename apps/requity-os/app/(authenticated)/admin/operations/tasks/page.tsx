import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { TaskBoard } from "@/components/tasks/task-board";
import { WorkflowTaskBoard } from "@/components/tasks/workflow-task-board";
import { TasksPageTabs } from "./tasks-page-tabs";
import type { OpsTask, Profile } from "@/lib/tasks";
import type { WorkflowTask, TaskProfile } from "@/lib/workflow-tasks";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();

  const [opsTasksRes, workflowTasksRes, profilesRes] = await Promise.all([
    supabase
      .from("ops_tasks")
      .select("*")
      .order("sort_order", { ascending: true }),
    admin
      .from("tasks")
      .select("*")
      .or(
        `assignee_user_id.eq.${user.id},and(active_party.eq.requestor,requestor_user_id.eq.${user.id})`
      )
      .order("created_at", { ascending: false }),
    admin
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .not("full_name", "is", null)
      .order("full_name"),
  ]);

  const opsTasks = (opsTasksRes.data ?? []) as unknown as OpsTask[];
  const workflowTasks = (workflowTasksRes.data ?? []) as unknown as WorkflowTask[];
  const profiles: Profile[] = (profilesRes.data ?? []).map(
    (p: {
      id: string;
      full_name: string | null;
      email: string | null;
      avatar_url: string | null;
    }) => ({
      id: p.id,
      full_name: p.full_name || p.email || "Unknown",
      avatar_url: p.avatar_url,
    })
  );

  const taskProfiles: TaskProfile[] = profiles.map((p) => ({
    id: p.id,
    full_name: p.full_name,
    avatar_url: p.avatar_url,
  }));

  return (
    <TasksPageTabs
      opsBoard={
        <TaskBoard
          initialTasks={opsTasks}
          profiles={profiles}
          currentUserId={user.id}
        />
      }
      workflowBoard={
        <WorkflowTaskBoard
          initialTasks={workflowTasks}
          profiles={taskProfiles}
          currentUserId={user.id}
        />
      }
      workflowCount={workflowTasks.length}
    />
  );
}
