import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { GmailIntegration } from "@/components/shared/gmail-integration";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Settings"
        description="Manage your integrations and preferences"
      />
      <Suspense
        fallback={
          <div className="space-y-3">
            <Skeleton className="h-40 w-full max-w-2xl" />
          </div>
        }
      >
        <GmailIntegration />
      </Suspense>
    </div>
  );
}
