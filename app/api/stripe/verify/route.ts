import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || !secretKey.startsWith("sk_")) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  try {
    const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Stripe verification failed" }, { status: 400 });
    }

    const session = await res.json();
    // payment_status is the only server-authoritative signal; an unpaid
    // subscription session also has mode === "subscription", so mode alone
    // must never count as proof of payment.
    const isPaid = session.payment_status === "paid";

    if (!isPaid) {
      return NextResponse.json({ success: false, paid: false }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 1. Update Supabase user metadata to has_paid = true
    if (user) {
      await supabase.auth.updateUser({
        data: {
          has_paid: true,
          stripe_customer_id: session.customer ?? null,
          paid_at: new Date().toISOString(),
        },
      });
    }

    // 2. Update order status to paid in Supabase database
    const orderId = session.client_reference_id || session.metadata?.order_id;
    if (orderId) {
      await supabase
        .from("orders")
        .update({
          status: "paid",
          user_id: user?.id ?? null,
        })
        .eq("id", orderId);
    }

    return NextResponse.json({
      success: true,
      paid: true,
      orderId,
    });
  } catch (err) {
    console.error("[Stripe Session Verification Error]:", err);
    return NextResponse.json(
      { error: "Verification failed", details: String(err) },
      { status: 500 }
    );
  }
}
