import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { listOrdersForOwner } from "@/lib/orders";
import { hydrateDeskFromOrders } from "@/lib/hydrate-desk";
import { isUserPaid } from "@/lib/subscription";
import {
  getSelectedBusinessId,
  listBusinessesForOwner,
  listProducts,
} from "@/lib/workspace";
import {
  DashboardShell,
  type DashboardTab,
} from "@/app/components/dashboard/DashboardShell";

const tabs = new Set<DashboardTab>([
  "business",
  "products",
  "sprints",
  "settings",
]);

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?modal=login&redirectTo=/dashboard");
  }

  // Enforce Paid Membership
  const paid = await isUserPaid(user.id, user);
  if (!paid) {
    redirect("/onboarding?step=launch&notice=membership_required");
  }

  const email = user.email ?? null;
  await hydrateDeskFromOrders(user.id, email);

  const businesses = await listBusinessesForOwner(user.id, email);
  const selectedBusinessId =
    (await getSelectedBusinessId(user.id, email)) ?? businesses[0]?.id ?? null;
  const [products, sprints] = await Promise.all([
    selectedBusinessId ? listProducts(selectedBusinessId) : Promise.resolve([]),
    listOrdersForOwner(user.id, email),
  ]);

  const { tab } = await searchParams;
  const initialTab =
    tab && tabs.has(tab as DashboardTab) ? (tab as DashboardTab) : "sprints";

  return (
    <DashboardShell
      displayName={
        (user.user_metadata?.full_name as string | undefined) ??
        email?.split("@")[0] ??
        "You"
      }
      email={email ?? ""}
      businesses={businesses}
      initialSelectedBusinessId={selectedBusinessId}
      initialProducts={products}
      sprints={sprints}
      initialTab={initialTab}
    />
  );
}
