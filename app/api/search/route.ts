import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const entityFilter = searchParams.get("filter") || null;
  const limit = Math.min(parseInt(searchParams.get("limit") || "25", 10), 50);

  if (!query.trim()) {
    return NextResponse.json({ results: [] });
  }

  const supabase = createClient();

  // Verify authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user's active role
  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("is_active", true);

  // Determine effective role from cookie or user_roles
  const cookieStore = request.cookies;
  const activeRoleCookie = cookieStore.get("active_role")?.value;

  let role = "borrower"; // Default to most restrictive
  if (activeRoleCookie && userRoles?.some((r) => r.role === activeRoleCookie)) {
    role = activeRoleCookie;
  } else if (userRoles && userRoles.length > 0) {
    // Pick most privileged role
    const roleOrder = ["super_admin", "admin", "investor", "borrower"];
    for (const r of roleOrder) {
      if (userRoles.some((ur) => ur.role === r)) {
        role = r;
        break;
      }
    }
  }

  // Build entity filter array
  const filterArray = entityFilter
    ? entityFilter.split(",").filter(Boolean)
    : null;

  // Call the search RPC function
  // Note: search_portal is created by migration but not yet in generated types.
  // After running the migration and regenerating types, this cast can be removed.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)("search_portal", {
    query_text: query.trim().slice(0, 100),
    user_role: role,
    user_id: user.id,
    entity_filter: filterArray,
    result_limit: limit,
  });

  if (error) {
    console.error("Search RPC error:", error);
    return NextResponse.json(
      { error: "Search failed. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ results: data || [] });
}
