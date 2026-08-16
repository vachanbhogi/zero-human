import { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), timeoutMs)),
  ]);
}

export async function isUserPaid(userId?: string, user?: User | null): Promise<boolean> {
  if (!userId && !user) return false;

  // 1. Check user metadata directly (instant sync)
  if (user?.user_metadata?.has_paid === true) {
    return true;
  }

  // 2. Check Supabase orders table for any paid order with 2000ms max timeout
  try {
    const checkDb = async () => {
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

      return false;
    };

    return await withTimeout(checkDb(), 2000, false);
  } catch (err) {
    console.warn("[Subscription Check Warning]:", err);
    return false;
  }
}
