"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

interface AddInvestorInput {
  email: string;
  full_name: string;
  company_name?: string;
  phone?: string;
}

export async function addInvestorAction(input: AddInvestorInput) {
  // Verify the current user is an admin
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: "Unauthorized" };
  }

  // Create the investor auth user via admin API
  const adminClient = createAdminClient();

  const { data: newUser, error: createError } =
    await adminClient.auth.admin.createUser({
      email: input.email,
      email_confirm: true,
      user_metadata: {
        role: "investor",
        full_name: input.full_name,
      },
    });

  if (createError) {
    return { error: createError.message };
  }

  if (!newUser.user) {
    return { error: "Failed to create user" };
  }

  // Update the auto-created profile with additional details
  const { error: updateError } = await adminClient
    .from("profiles")
    .update({
      full_name: input.full_name,
      company_name: input.company_name || null,
      phone: input.phone || null,
    })
    .eq("id", newUser.user.id);

  if (updateError) {
    return { error: updateError.message };
  }

  return { success: true, investorId: newUser.user.id };
}
