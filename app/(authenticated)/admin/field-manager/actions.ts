"use server";

import { requireSuperAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

interface FieldUpdate {
  id: string;
  module: string;
  field_key: string;
  field_label: string;
  field_type: string;
  column_position: string;
  display_order: number;
  is_visible: boolean;
  is_locked: boolean;
}

export async function publishFieldConfigurations(
  module: string,
  fields: FieldUpdate[]
) {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // Upsert all fields for this module in a batch
    const { error } = await admin.from("field_configurations").upsert(
      fields.map((f) => ({
        id: f.id,
        module: f.module,
        field_key: f.field_key,
        field_label: f.field_label,
        field_type: f.field_type,
        column_position: f.column_position,
        display_order: f.display_order,
        is_visible: f.is_visible,
        is_locked: f.is_locked,
      })),
      { onConflict: "module,field_key" }
    );

    if (error) {
      console.error("publishFieldConfigurations error:", error);
      return { error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error("publishFieldConfigurations error:", err);
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function fetchFieldConfigurations(module: string) {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("field_configurations")
      .select("*")
      .eq("module", module)
      .order("display_order", { ascending: true });

    if (error) {
      console.error("fetchFieldConfigurations error:", error);
      return { error: error.message };
    }

    return { data: data ?? [] };
  } catch (err: unknown) {
    console.error("fetchFieldConfigurations error:", err);
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function fetchAllFieldConfigurations() {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("field_configurations")
      .select("*")
      .order("module")
      .order("display_order", { ascending: true });

    if (error) {
      console.error("fetchAllFieldConfigurations error:", error);
      return { error: error.message };
    }

    return { data: data ?? [] };
  } catch (err: unknown) {
    console.error("fetchAllFieldConfigurations error:", err);
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}
