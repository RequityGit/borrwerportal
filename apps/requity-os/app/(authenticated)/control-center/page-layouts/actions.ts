"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PageObjectType =
  | "contact"
  | "company"
  | "opportunity"
  | "loan"
  | "property"
  | "investment"
  | "borrower_profile"
  | "investor_profile";

export interface LayoutTab {
  id?: string;
  tab_key: string;
  title: string;
  icon: string | null;
  sort_order: number;
  is_visible: boolean;
  badge_field: string | null;
}

export interface LayoutField {
  id?: string;
  field_key: string;
  label_override: string | null;
  column_position: number;
  sort_order: number;
  is_visible: boolean;
  is_read_only: boolean;
  span: number;
  display_format: string | null;
  placeholder: string | null;
  help_text: string | null;
}

export interface LayoutSection {
  id?: string;
  section_key: string;
  title: string;
  subtitle: string | null;
  icon: string | null;
  column_layout: string;
  sort_order: number;
  is_collapsible: boolean;
  is_collapsed_default: boolean;
  is_visible: boolean;
  tab_group: string | null;
  span: string;
  fields: LayoutField[];
}

export interface FullLayout {
  id: string;
  object_type: PageObjectType;
  name: string;
  description: string | null;
  tabs: LayoutTab[];
  sections: LayoutSection[];
}

// ---------------------------------------------------------------------------
// Fetch layout for an object type
// ---------------------------------------------------------------------------

export async function fetchPageLayout(objectType: PageObjectType) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // Get the active layout for this object type (default, no role override)
    const { data: layout, error: layoutError } = await admin
      .from("page_layouts")
      .select("*")
      .eq("object_type", objectType)
      .eq("is_active", true)
      .is("role", null)
      .single();

    if (layoutError && layoutError.code !== "PGRST116") {
      console.error("fetchPageLayout error:", layoutError);
      return { error: layoutError.message };
    }

    if (!layout) {
      return { data: null };
    }

    // Fetch tabs
    const { data: tabs } = await admin
      .from("page_layout_tabs")
      .select("*")
      .eq("layout_id", layout.id)
      .order("sort_order", { ascending: true });

    // Fetch sections with their fields
    const { data: sections } = await admin
      .from("page_layout_sections")
      .select("*")
      .eq("layout_id", layout.id)
      .order("sort_order", { ascending: true });

    const sectionIds = (sections ?? []).map((s) => s.id);

    let allFields: {
      id: string;
      section_id: string;
      field_key: string;
      label_override: string | null;
      column_position: number | null;
      sort_order: number;
      is_visible: boolean | null;
      is_read_only: boolean | null;
      span: number | null;
      display_format: string | null;
      placeholder: string | null;
      help_text: string | null;
    }[] = [];

    if (sectionIds.length > 0) {
      const { data: f } = await admin
        .from("page_layout_fields")
        .select("*")
        .in("section_id", sectionIds)
        .order("sort_order", { ascending: true });
      allFields = (f ?? []) as typeof allFields;
    }

    // Group fields by section_id
    const fieldsBySection = new Map<string, LayoutField[]>();
    for (const f of allFields) {
      const sectionFields = fieldsBySection.get(f.section_id) ?? [];
      sectionFields.push({
        id: f.id,
        field_key: f.field_key,
        label_override: f.label_override,
        column_position: f.column_position ?? 1,
        sort_order: f.sort_order,
        is_visible: f.is_visible ?? true,
        is_read_only: f.is_read_only ?? false,
        span: f.span ?? 1,
        display_format: f.display_format,
        placeholder: f.placeholder,
        help_text: f.help_text,
      });
      fieldsBySection.set(f.section_id, sectionFields);
    }

    const fullLayout: FullLayout = {
      id: layout.id,
      object_type: layout.object_type as PageObjectType,
      name: layout.name,
      description: layout.description,
      tabs: (tabs ?? []).map((t) => ({
        id: t.id,
        tab_key: t.tab_key,
        title: t.title,
        icon: t.icon,
        sort_order: t.sort_order,
        is_visible: t.is_visible ?? true,
        badge_field: t.badge_field,
      })),
      sections: (sections ?? []).map((s) => ({
        id: s.id,
        section_key: s.section_key,
        title: s.title,
        subtitle: s.subtitle,
        icon: s.icon,
        column_layout: s.column_layout ?? "2-col",
        sort_order: s.sort_order,
        is_collapsible: s.is_collapsible ?? true,
        is_collapsed_default: s.is_collapsed_default ?? false,
        is_visible: s.is_visible ?? true,
        tab_group: s.tab_group,
        span: s.span ?? "full",
        fields: fieldsBySection.get(s.id) ?? [],
      })),
    };

    return { data: fullLayout };
  } catch (err: unknown) {
    console.error("fetchPageLayout error:", err);
    return {
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}

// ---------------------------------------------------------------------------
// Save full layout (upsert layout + sections + fields + tabs)
// ---------------------------------------------------------------------------

export async function savePageLayout(
  objectType: PageObjectType,
  layoutName: string,
  tabs: LayoutTab[],
  sections: LayoutSection[]
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    const userId = auth.user.id;

    // 1. Upsert layout
    let layoutId: string;

    const { data: existing } = await admin
      .from("page_layouts")
      .select("id")
      .eq("object_type", objectType)
      .eq("is_active", true)
      .is("role", null)
      .single();

    if (existing) {
      layoutId = existing.id;
      await admin
        .from("page_layouts")
        .update({ name: layoutName, updated_at: new Date().toISOString() })
        .eq("id", layoutId);
    } else {
      const { data: newLayout, error: createErr } = await admin
        .from("page_layouts")
        .insert({
          object_type: objectType,
          name: layoutName,
          is_active: true,
          created_by: userId,
        })
        .select("id")
        .single();

      if (createErr || !newLayout) {
        console.error("savePageLayout create error:", createErr);
        return { error: createErr?.message ?? "Failed to create layout" };
      }
      layoutId = newLayout.id;
    }

    // 2. Delete existing tabs, sections, fields (cascade handles fields)
    await admin.from("page_layout_tabs").delete().eq("layout_id", layoutId);
    await admin
      .from("page_layout_sections")
      .delete()
      .eq("layout_id", layoutId);

    // 3. Insert tabs
    if (tabs.length > 0) {
      const { error: tabErr } = await admin.from("page_layout_tabs").insert(
        tabs.map((t, i) => ({
          layout_id: layoutId,
          tab_key: t.tab_key,
          title: t.title,
          icon: t.icon,
          sort_order: i,
          is_visible: t.is_visible,
          badge_field: t.badge_field,
        }))
      );
      if (tabErr) {
        console.error("savePageLayout tabs error:", tabErr);
        return { error: tabErr.message };
      }
    }

    // 4. Insert sections and fields
    for (let si = 0; si < sections.length; si++) {
      const section = sections[si];
      const { data: newSection, error: secErr } = await admin
        .from("page_layout_sections")
        .insert({
          layout_id: layoutId,
          section_key: section.section_key,
          title: section.title,
          subtitle: section.subtitle,
          icon: section.icon,
          column_layout: section.column_layout,
          sort_order: si,
          is_collapsible: section.is_collapsible,
          is_collapsed_default: section.is_collapsed_default,
          is_visible: section.is_visible,
          tab_group: section.tab_group,
          span: section.span,
        })
        .select("id")
        .single();

      if (secErr || !newSection) {
        console.error("savePageLayout section error:", secErr);
        return { error: secErr?.message ?? "Failed to create section" };
      }

      if (section.fields.length > 0) {
        const { error: fieldErr } = await admin
          .from("page_layout_fields")
          .insert(
            section.fields.map((f, fi) => ({
              section_id: newSection.id,
              field_key: f.field_key,
              label_override: f.label_override,
              column_position: f.column_position,
              sort_order: fi,
              is_visible: f.is_visible,
              is_read_only: f.is_read_only,
              span: f.span,
              display_format: f.display_format,
              placeholder: f.placeholder,
              help_text: f.help_text,
            }))
          );
        if (fieldErr) {
          console.error("savePageLayout fields error:", fieldErr);
          return { error: fieldErr.message };
        }
      }
    }

    // 5. Log history
    await admin.from("page_layout_history").insert({
      layout_id: layoutId,
      changed_by: userId,
      change_type: existing ? "layout_updated" : "layout_created",
      change_detail: {
        tabs_count: tabs.length,
        sections_count: sections.length,
        fields_count: sections.reduce((acc, s) => acc + s.fields.length, 0),
      },
    });

    revalidatePath("/control-center/page-layouts");
    return { success: true };
  } catch (err: unknown) {
    console.error("savePageLayout error:", err);
    return {
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}
