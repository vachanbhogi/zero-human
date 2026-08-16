import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    { error: "Durable dispatch store and run runner are not configured" },
    { status: 503 }
  );
}
