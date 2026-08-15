import { listOrdersForOwner, saveOrder } from "@/lib/orders";
import { upsertBusinessFromBrief } from "@/lib/workspace";

export async function hydrateDeskFromOrders(
  ownerId: string | null,
  email: string | null,
) {
  const orders = await listOrdersForOwner(ownerId, email);
  for (const order of orders) {
    if (!order.url) continue;
    const business = await upsertBusinessFromBrief({
      businessId: order.businessId,
      name: order.company ?? "",
      website: order.url,
      niche: order.niche,
      audience: order.audience,
      competitors: order.competitors,
      ownerId: order.ownerId ?? ownerId,
      ownerEmail: order.email || email,
    });
    if (order.businessId !== business.id) {
      order.businessId = business.id;
      await saveOrder(order);
    }
  }
}
