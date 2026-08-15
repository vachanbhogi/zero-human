import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { safeNextPath } from "@/utils/safe-next-url";
import { configuredSiteOrigin, normalizedOrigin } from "@/utils/site-origin";

async function getOrigin() {
  const configured = configuredSiteOrigin();
  if (configured) return configured;
  return "http://localhost:3000";
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const siteOrigin = await getOrigin();
      const destination = safeNextPath(next, siteOrigin);
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("Could not authenticate. Please try again.")}`);
}
