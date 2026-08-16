import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { OnboardingFlow } from "../components/OnboardingFlow";
import { getBusiness, listBusinessesForOwner } from "@/lib/workspace";
import { hydrateDeskFromOrders } from "@/lib/hydrate-desk";
import { emptyAgentBrief, type AgentBrief } from "@/lib/types";
import { createClient } from "@/utils/supabase/server";

import { isUserPaid } from "@/lib/subscription";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ businessId?: string; new?: string }>;
}) {
  const { businessId, new: startNew } = await searchParams;
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const paid = user ? await isUserPaid(user.id, user) : false;

  if (user && paid && !businessId && startNew !== "1") {
    await hydrateDeskFromOrders(user.id, user.email ?? null);
    const businesses = await listBusinessesForOwner(user.id, user.email ?? null);
    if (businesses.length > 0) {
      redirect("/dashboard");
    }
  }

  let initialBrief: AgentBrief | undefined;
  if (businessId) {
    const business = await getBusiness(businessId);
    if (business) {
      initialBrief = {
        ...emptyAgentBrief(),
        url: business.website,
        company: business.name,
        niche: business.niche,
        audience: business.audience,
        competitors: business.competitors.join(", "),
      };
    }
  }

  return (
    <OnboardingFlow initialBrief={initialBrief} businessId={businessId} />
  );
}
