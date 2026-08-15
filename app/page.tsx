import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Landing } from "./components/landing/Landing";
import { AuthModal } from "@/components/auth/AuthModal";
import { createClient } from "@/utils/supabase/server";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    modal?: string;
    redirectTo?: string;
    error?: string;
    message?: string;
  }>;
}) {
  const params = await searchParams;
  const modal = params.modal === "login" || params.modal === "signup" ? params.modal : null;

  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && !modal) {
    redirect("/dashboard");
  }

  return (
    <>
      <Landing />
      {modal ? (
        <AuthModal
          mode={modal}
          redirectTo={params.redirectTo ?? "/dashboard"}
          error={params.error}
          message={params.message}
        />
      ) : null}
    </>
  );
}
