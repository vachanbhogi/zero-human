import { NextRequest, NextResponse } from "next/server";
import { OrderResponse } from "@/lib/types";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { getOrder, saveOrder } from "@/lib/orders";
import { upsertBusinessFromBrief } from "@/lib/workspace";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, niche, email, company, audience, competitors, businessId } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "A valid website URL is required." },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const ownerEmail =
      (typeof email === "string" && email.trim()) || user?.email || null;
    const competitorList = Array.isArray(competitors)
      ? competitors.filter((c): c is string => typeof c === "string")
      : undefined;

    let savedBusinessId: string | undefined;
    try {
      const business = await upsertBusinessFromBrief({
        businessId: typeof businessId === "string" ? businessId : undefined,
        name: typeof company === "string" ? company : "",
        website: url,
        niche: typeof niche === "string" ? niche : "",
        audience: typeof audience === "string" ? audience : "",
        competitors: competitorList,
        ownerId: user?.id ?? null,
        ownerEmail,
      });
      savedBusinessId = business.id;
    } catch (workspaceErr) {
      console.warn("[Workspace persist warning]:", workspaceErr);
    }

    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newOrder: OrderResponse = {
      orderId,
      status: "pending_payment",
      createdAt: new Date().toISOString(),
      url: url.trim(),
      niche: (niche || "").trim(),
      email: (email || user?.email || "").trim(),
      company: typeof company === "string" ? company.trim() : undefined,
      audience: typeof audience === "string" ? audience.trim() : undefined,
      competitors: competitorList,
      businessId: savedBusinessId,
      ownerId: user?.id,
    };

    try {
      await saveOrder(newOrder);
    } catch (persistErr) {
      console.warn("[Order persist warning]:", persistErr);
    }

    try {
      const { error: dbError } = await supabase.from("orders").insert({
        id: orderId,
        user_id: user?.id ?? null,
        status: newOrder.status,
        url: newOrder.url,
        niche: newOrder.niche,
        email: newOrder.email,
        company: newOrder.company ?? null,
        audience: newOrder.audience ?? null,
        competitors: newOrder.competitors ?? null,
        business_id: savedBusinessId ?? null,
      });

      if (dbError) {
        console.warn("[Supabase Orders Insert Warning]:", dbError.message);
      }
    } catch (dbErr) {
      console.warn("[Supabase Orders DB Exception]:", dbErr);
    }

    return NextResponse.json({
      success: true,
      order: newOrder,
    });
  } catch (err) {
    console.error("[API Order Create Error]:", err);
    return NextResponse.json(
      { error: "Failed to create order", details: String(err) },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing order id" }, { status: 400 });
  }

  const order = await getOrder(id);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, order });
}
