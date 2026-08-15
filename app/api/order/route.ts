import { NextRequest, NextResponse } from "next/server";
import { OrderResponse } from "@/lib/types";

// In-memory store for 2-hour hackathon MVP speed
const orders = new Map<string, OrderResponse>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, niche, email } = body;

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
    };

    orders.set(orderId, newOrder);

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

  const order = orders.get(id);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, order });
}
