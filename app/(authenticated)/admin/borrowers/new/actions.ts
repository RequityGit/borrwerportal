"use server";

import { createClient } from "@/lib/supabase/server";
import type { BorrowerInsert } from "@/lib/supabase/types";

interface AddBorrowerInput {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  ssn_last_four?: string;
  is_us_citizen?: boolean;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  credit_score?: number;
  credit_report_date?: string;
  experience_count?: number;
  notes?: string;
}

export async function addBorrowerAction(input: AddBorrowerInput) {
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

  const borrowerData: BorrowerInsert = {
    first_name: input.first_name,
    last_name: input.last_name,
    email: input.email || null,
    phone: input.phone || null,
    date_of_birth: input.date_of_birth || null,
    ssn_last_four: input.ssn_last_four || null,
    is_us_citizen: input.is_us_citizen ?? true,
    address_line1: input.address_line1 || null,
    address_line2: input.address_line2 || null,
    city: input.city || null,
    state: input.state || null,
    zip: input.zip || null,
    country: input.country || "US",
    credit_score: input.credit_score ?? null,
    credit_report_date: input.credit_report_date || null,
    experience_count: input.experience_count ?? 0,
    notes: input.notes || null,
  };

  const { data, error } = await supabase
    .from("borrowers")
    .insert(borrowerData)
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  return { success: true, borrowerId: data.id };
}

interface UpdateBorrowerInput extends AddBorrowerInput {
  id: string;
}

export async function updateBorrowerAction(input: UpdateBorrowerInput) {
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

  const { error } = await supabase
    .from("borrowers")
    .update({
      first_name: input.first_name,
      last_name: input.last_name,
      email: input.email || null,
      phone: input.phone || null,
      date_of_birth: input.date_of_birth || null,
      ssn_last_four: input.ssn_last_four || null,
      is_us_citizen: input.is_us_citizen ?? true,
      address_line1: input.address_line1 || null,
      address_line2: input.address_line2 || null,
      city: input.city || null,
      state: input.state || null,
      zip: input.zip || null,
      country: input.country || "US",
      credit_score: input.credit_score ?? null,
      credit_report_date: input.credit_report_date || null,
      experience_count: input.experience_count ?? 0,
      notes: input.notes || null,
    })
    .eq("id", input.id);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
