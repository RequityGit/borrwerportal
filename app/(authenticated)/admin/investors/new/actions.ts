"use server";

import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@supabase/supabase-js";

interface AddInvestorInput {
  email: string;
  full_name: string;
  company_name?: string;
  phone?: string;
}

export async function addInvestorAction(input: AddInvestorInput) {
  // Verify the current user is an admin
  const supabase = await createServerClient();
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

  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch {
    return {
      error:
        "Server configuration error: unable to create investors. Please contact your system administrator.",
    };
  }

  const { data: newUser, error: createError } =
    await adminClient.auth.admin.createUser({
      email: input.email,
      email_confirm: true,
      user_metadata: { role: "investor", full_name: input.full_name },
    });

  if (createError) {
    return { error: createError.message };
  }

  if (!newUser.user) {
    return { error: "Failed to create user" };
  }

  // Update the auto-created profile with additional details + pending status
  const { error: updateError } = await adminClient
    .from("profiles")
    .update({
      full_name: input.full_name,
      company_name: input.company_name || null,
      phone: input.phone || null,
      activation_status: "pending",
    })
    .eq("id", newUser.user.id);

  if (updateError) {
    return { error: updateError.message };
  }

  return { success: true, investorId: newUser.user.id };
}

export async function sendActivationLinkAction(investorId: string) {
  // Verify the current user is an admin
  const supabase = await createServerClient();
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

  // Get the investor's email
  const { data: investor } = await supabase
    .from("profiles")
    .select("email, activation_status")
    .eq("id", investorId)
    .eq("role", "investor")
    .single();

  if (!investor) {
    return { error: "Investor not found" };
  }

  // Send a magic link (OTP) so the investor can sign in and activate
  // Prefer admin client (service role key) for generateLink, fall back to anon client for OTP
  try {
    const adminClient = createAdminClient();
    const { error: linkError } =
      await adminClient.auth.admin.generateLink({
        type: "magiclink",
        email: investor.email,
      });

    if (linkError) {
      return { error: linkError.message };
    }
  } catch {
    // Service role key not available, fall back to anon OTP flow
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return {
        error:
          "Server configuration error: unable to send activation link. Please contact your system administrator.",
      };
    }

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error: otpError } = await anonClient.auth.signInWithOtp({
      email: investor.email,
      options: {
        shouldCreateUser: false,
      },
    });

    if (otpError) {
      return { error: otpError.message };
    }
  }

  // Mark as link_sent
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ activation_status: "link_sent" })
    .eq("id", investorId);

  if (updateError) {
    return { error: updateError.message };
  }

  return { success: true };
}
