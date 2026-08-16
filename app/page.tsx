import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Landing } from "./components/landing/Landing";
import { AuthModal } from "@/components/auth/AuthModal";
import { createClient } from "@/utils/supabase/server";
import { isUserPaid } from "@/lib/subscription";
import { listBusinessesForOwner } from "@/lib/workspace";

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), timeoutMs)),
  ]);
}

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

  let user = null;
  let paid = false;
  let activeBusinessName: string | null = null;

  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const hasAuthCookie = allCookies.some(
      (c) => c.name.startsWith("sb-") || c.name.includes("auth-token")
    );

    // Only query Supabase if an auth cookie is actually present
    if (hasAuthCookie) {
      const supabase = createClient(cookieStore);

      const userPromise = supabase.auth.getUser().then(
        (res) => res.data.user,
        () => null
      );
      user = await withTimeout(userPromise, 1500, null);

      if (user) {
        paid = await isUserPaid(user.id, user);
        try {
          const businesses = await withTimeout(
            listBusinessesForOwner(user.id, user.email ?? null),
            1000,
            []
          );
          activeBusinessName = businesses[0]?.name ?? null;
        } catch {
          /* ignore */
        }
      }
    }
  } catch (err) {
    console.warn("[Home Page Auth Warning]:", err);
  }

  if (user && paid && !modal) {
    redirect("/dashboard");
  }

  return (
    <>
      <Landing
        userEmail={user?.email ?? null}
        isPaid={paid}
        activeBusinessName={activeBusinessName}
      />
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
