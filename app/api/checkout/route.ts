import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { configuredSiteOrigin } from "@/utils/site-origin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, company, url, email } = body;

    const secretKey = process.env.STRIPE_SECRET_KEY;
    const paymentLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK;

    const origin =
      configuredSiteOrigin() ||
      req.headers.get("origin") ||
      "http://localhost:3000";

    // If Stripe secret key is available, create dynamic server session
    if (secretKey && secretKey.startsWith("sk_")) {
      const params = new URLSearchParams();
      params.append("mode", "subscription");
      params.append("payment_method_types[0]", "card");
      params.append("line_items[0][price_data][currency]", "usd");
      params.append("line_items[0][price_data][unit_amount]", "2000");
      params.append("line_items[0][price_data][recurring][interval]", "month");
      params.append(
        "line_items[0][price_data][product_data][name]",
        `Tack Desk — ${company || "Autonomous Growth Desk"}`
      );
      params.append(
        "line_items[0][price_data][product_data][description]",
        "Founding Membership (90% off $200/mo list). Competitor teardown, 10 outreach plays, and Terac crowd study."
      );
      params.append("line_items[0][quantity]", "1");

      const cookieStore = await cookies();
      const supabase = createClient(cookieStore);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.id) {
        params.append("metadata[user_id]", user.id);
      }

      if (email && typeof email === "string" && email.includes("@")) {
        params.append("customer_email", email.trim());
      } else if (user?.email) {
        params.append("customer_email", user.email);
      }

      if (orderId) {
        params.append("client_reference_id", orderId);
        params.append("metadata[order_id]", orderId);
        params.append("metadata[website_url]", url || "");
      }

      const successTarget = orderId ? `/sprint/${orderId}?paid=true` : "/dashboard?paid=true";
      params.append("success_url", `${origin}${successTarget}&session_id={CHECKOUT_SESSION_ID}`);
      params.append("cancel_url", `${origin}/onboarding`);

      const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      if (stripeRes.ok) {
        const session = await stripeRes.json();
        if (session.url) {
          return NextResponse.json({ success: true, url: session.url });
        }
      } else {
        const errData = await stripeRes.json();
        console.warn("[Stripe API Session Error]:", errData);
      }
    }

    // Fallback to hosted Stripe Payment Link
    if (paymentLink) {
      return NextResponse.json({ success: true, url: paymentLink });
    }

    // Emergency demo fallback
    return NextResponse.json({
      success: true,
      url: orderId ? `/sprint/${orderId}?paid=true` : "/onboarding",
    });
  } catch (err) {
    console.error("[Checkout Route Error]:", err);
    return NextResponse.json(
      { error: "Failed to initiate checkout", details: String(err) },
      { status: 500 }
    );
  }
}
