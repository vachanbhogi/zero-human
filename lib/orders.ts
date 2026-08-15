import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { OrderResponse } from "@/lib/types";

const memory = new Map<string, OrderResponse>();
const dataDir = path.join(process.cwd(), ".data");
const dataFile = path.join(dataDir, "orders.json");

async function readDisk(): Promise<Record<string, OrderResponse>> {
  try {
    const raw = await readFile(dataFile, "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, OrderResponse>;
  } catch {
    return {};
  }
}

async function writeDisk(orders: Record<string, OrderResponse>) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(dataFile, JSON.stringify(orders), "utf8");
}

export async function saveOrder(order: OrderResponse) {
  memory.set(order.orderId, order);
  const all = await readDisk();
  all[order.orderId] = order;
  await writeDisk(all);
}

export async function listOrders(): Promise<OrderResponse[]> {
  const disk = await readDisk();
  for (const order of Object.values(disk)) {
    memory.set(order.orderId, order);
  }
  return Array.from(memory.values()).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export async function listOrdersForOwner(
  ownerId: string | null,
  email: string | null,
): Promise<OrderResponse[]> {
  const all = await listOrders();
  return all.filter((order) => {
    if (ownerId && order.ownerId === ownerId) return true;
    if (email && order.email?.toLowerCase() === email.toLowerCase()) return true;
    return false;
  });
}

export async function getOrder(orderId: string): Promise<OrderResponse | null> {
  const cached = memory.get(orderId);
  if (cached) return cached;

  const disk = await readDisk();
  if (disk[orderId]) {
    memory.set(orderId, disk[orderId]);
    return disk[orderId];
  }

  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (!data || error) return null;

    const order: OrderResponse = {
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
      businessId: data.business_id ?? undefined,
      productId: data.product_id ?? undefined,
      ownerId: data.user_id ?? undefined,
    };
    memory.set(orderId, order);
    return order;
  } catch {
    return null;
  }
}
