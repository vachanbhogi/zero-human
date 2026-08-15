"use server";

import { createClient } from "@/utils/supabase/server";
import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { safeNextPath } from "@/utils/safe-next-url";
import { configuredSiteOrigin, normalizedOrigin } from "@/utils/site-origin";

async function getOrigin() {
  const headersList = await headers();
  const configured = configuredSiteOrigin();
  const isVercelPreview = process.env.VERCEL_ENV === "preview";
  if (configured && !isVercelPreview) return configured;

  const requestHost = (
    headersList.get("x-forwarded-host") ??
    headersList.get("host") ??
    ""
  )
    .split(",")[0]
    ?.trim();
  const requestOrigin = normalizedOrigin(headersList.get("origin"));
  if (requestOrigin && new URL(requestOrigin).host === requestHost) {
    return requestOrigin;
  }

  const forwardedProtocol = headersList
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  const protocol =
    forwardedProtocol === "http" || forwardedProtocol === "https"
      ? forwardedProtocol
      : "http";
  return normalizedOrigin(`${protocol}://${requestHost}`) ?? "http://localhost:3000";
}

function validEmail(value: string): string | null {
  const email = value.trim().toLowerCase();
  return email.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    !/[\u0000-\u001f\u007f]/.test(email)
    ? email
    : null;
}

function validPassword(value: string, minimumLength: number): boolean {
  const byteLength = new TextEncoder().encode(value).byteLength;
  return (
    value.length >= minimumLength &&
    value.length <= 128 &&
    byteLength <= 256 &&
    !value.includes("\u0000")
  );
}

function safeFullName(value: string): string | null {
  const fullName = value.trim();
  return fullName &&
    fullName.length <= 100 &&
    !/[\u0000-\u001f\u007f]/.test(fullName)
    ? fullName
    : null;
}

export async function login(formData: FormData) {
  const email = validEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/dashboard");
  const origin = await getOrigin();
  const destination = safeNextPath(redirectTo, origin);

  if (!email || !validPassword(password, 1)) {
    redirect(
      `/?modal=login&error=${encodeURIComponent("Invalid email or password.")}&redirectTo=${encodeURIComponent(destination)}`,
    );
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(
      `/?modal=login&error=${encodeURIComponent("Invalid email or password.")}&redirectTo=${encodeURIComponent(destination)}`,
    );
  }

  redirect(destination);
}

export async function signup(formData: FormData) {
  const email = validEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const fullName = safeFullName(String(formData.get("fullName") ?? ""));
  const redirectTo = String(formData.get("redirectTo") ?? "/dashboard");

  const origin = await getOrigin();
  const destination = safeNextPath(redirectTo, origin);
  if (!email || !validPassword(password, 12)) {
    redirect(
      `/?modal=signup&error=${encodeURIComponent("Use a valid email and a password with at least 12 characters.")}&redirectTo=${encodeURIComponent(destination)}`,
    );
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: fullName ? { full_name: fullName } : undefined,
      emailRedirectTo: new URL(destination, origin).href,
    },
  });

  if (error) {
    redirect(
      `/?modal=signup&error=${encodeURIComponent("The account could not be created. Check your details and try again.")}&redirectTo=${encodeURIComponent(destination)}`,
    );
  }

  if (data.session) {
    redirect(destination);
  }

  redirect("/?modal=login&message=Check your email to confirm your account");
}

export async function signOut() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  await supabase.auth.signOut();
  redirect("/");
}
