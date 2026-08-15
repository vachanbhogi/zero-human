import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { signup } from "@/app/auth/actions";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthShell } from "@/components/auth/AuthShell";
import { createClient } from "@/utils/supabase/server";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirectTo?: string }>;
}) {
  const params = await searchParams;
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <AuthShell title="Sign up for an account">
      <AuthForm
        mode="signup"
        action={signup}
        redirectTo={params.redirectTo ?? "/dashboard"}
        error={params.error}
      />
    </AuthShell>
  );
}
