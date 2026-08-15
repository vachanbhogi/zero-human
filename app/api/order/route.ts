import { NextRequest, NextResponse } from "next/server";
import { OrderResponse } from "@/lib/types";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

// In-memory fallback store to ensure zero downtime
const inMemoryOrders = new Map<string, OrderResponse>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, niche, email, company, audience, competitors, focus, stage } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "A valid website URL is required." },
        { status: 400 }
      );
    }

    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newOrder: OrderResponse = {
      orderId,
      status: "pending_payment",
      createdAt: new Date().toISOString(),
      url: url.trim(),
      niche: (niche || "B2B SaaS / Tech Startup").trim(),
      email: (email || "anonymous@zero-human.ai").trim(),
      company: typeof company === "string" ? company.trim() : undefined,
      audience: typeof audience === "string" ? audience.trim() : undefined,
      competitors: Array.isArray(competitors)
        ? competitors.filter((c): c is string => typeof c === "string")
        : undefined,
      focus: typeof focus === "string" ? focus.trim() : undefined,
      stage: typeof stage === "string" ? stage.trim() : undefined,
    };

    // Always cache in memory
    inMemoryOrders.set(orderId, newOrder);

    // Attempt Supabase database persistence
    try {
      const cookieStore = await cookies();
      const supabase = createClient(cookieStore);
      const {
        data: { user },
      } = await supabase.auth.getUser();

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
        focus: newOrder.focus ?? null,
        stage: newOrder.stage ?? null,
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

  // Check in-memory first for instant speed
  const cached = inMemoryOrders.get(id);
  if (cached) {
    return NextResponse.json({ success: true, order: cached });
  }

  // Check Supabase database
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();

    if (data && !error) {
      const dbOrder: OrderResponse = {
        orderId: data.id,
        status: data.status,
        createdAt: data.created_at,
        url: data.url,
        niche: data.niche,
        email: data.email,
        company: data.company ?? undefined,
        audience: data.audience ?? undefined,
        competitors: data.competitors ?? undefined,
        focus: data.focus ?? undefined,
        stage: data.stage ?? undefined,
      };
      return NextResponse.json({ success: true, order: dbOrder });
    }
  } catch (err) {
    console.warn("[Supabase Order Get Exception]:", err);
  }

  return NextResponse.json({ error: "Order not found" }, { status: 404 });
}
