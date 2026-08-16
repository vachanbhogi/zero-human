import { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export async function isUserPaid(userId?: string, user?: User | null): Promise<boolean> {
  if (!userId && !user) return false;

  // 1. Check user metadata directly
  if (user?.user_metadata?.has_paid === true) {
    return true;
  }

  // 2. Check Supabase orders table for any paid order
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const targetUserId = userId || user?.id;
    const targetEmail = user?.email;

    if (targetUserId) {
      const { data: userOrders } = await supabase
        .from("orders")
        .select("id, status")
        .eq("user_id", targetUserId)
        .eq("status", "paid")
        .limit(1);

      if (userOrders && userOrders.length > 0) {
        return true;
      }
    }

    if (targetEmail) {
      const { data: emailOrders } = await supabase
        .from("orders")
        .select("id, status")
        .eq("email", targetEmail)
        .eq("status", "paid")
        .limit(1);

      if (emailOrders && emailOrders.length > 0) {
        return true;
      }
    }
  } catch (err) {
    console.warn("[Subscription Check Warning]:", err);
  }

  return false;
}
