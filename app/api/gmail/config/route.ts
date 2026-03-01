import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Gmail OAuth is now managed by the Supabase edge function (gmail-oauth-start)
  // which stores GMAIL_CLIENT_ID in Supabase secrets. The frontend config check
  // no longer needs to verify Next.js env vars — the edge function handles its own config.
  return NextResponse.json({
    configured: true,
  });
}
