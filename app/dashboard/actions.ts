"use server";

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { listOrdersForOwner } from "@/lib/orders";
import {
  createBusiness,
  createProduct,
  deleteBusiness,
  deleteProduct,
  getSelectedBusinessId,
  listBusinessesForOwner,
  listProducts,
  setSelectedBusinessId,
  updateBusiness,
  updateProduct,
} from "@/lib/workspace";
import type { BusinessInput, ProductInput } from "@/lib/workspace-types";

async function currentOwner() {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return {
    ownerId: user.id,
    email: user.email ?? null,
    displayName:
      (user.user_metadata?.full_name as string | undefined) ??
      user.email?.split("@")[0] ??
      "You",
  };
}

export async function loadDesk() {
  const owner = await currentOwner();
  if (!owner) return { error: "Sign in to open the desk." as const };

  const [businesses, sprints] = await Promise.all([
    listBusinessesForOwner(owner.ownerId, owner.email),
    listOrdersForOwner(owner.ownerId, owner.email),
  ]);
  const selectedBusinessId =
    (await getSelectedBusinessId(owner.ownerId, owner.email)) ??
    businesses[0]?.id ??
    null;
  const products = selectedBusinessId
    ? await listProducts(selectedBusinessId)
    : [];

  return {
    owner,
    businesses,
    selectedBusinessId,
    products,
    sprints,
  };
}

export async function selectBusiness(businessId: string) {
  const owner = await currentOwner();
  if (!owner) return { error: "Sign in to switch businesses." };
  const businesses = await listBusinessesForOwner(owner.ownerId, owner.email);
  if (!businesses.some((business) => business.id === businessId)) {
    return { error: "That business isn't in this desk." };
  }
  await setSelectedBusinessId(owner.ownerId, owner.email, businessId);
  return { ok: true as const };
}

export async function saveBusiness(input: BusinessInput, businessId?: string) {
  const owner = await currentOwner();
  if (!owner) return { error: "Sign in to save a business." };
  if (businessId) {
    return updateBusiness(businessId, input, owner.ownerId, owner.email);
  }
  return createBusiness(input, owner.ownerId, owner.email);
}

export async function removeBusiness(businessId: string) {
  const owner = await currentOwner();
  if (!owner) return { error: "Sign in to remove a business." };
  return deleteBusiness(businessId, owner.ownerId, owner.email);
}

export async function saveProduct(
  businessId: string,
  input: ProductInput,
  productId?: string,
) {
  const owner = await currentOwner();
  if (!owner) return { error: "Sign in to save a product." };
  if (productId) {
    return updateProduct(productId, input, owner.ownerId, owner.email);
  }
  return createProduct(businessId, input, owner.ownerId, owner.email);
}

export async function removeProduct(productId: string) {
  const owner = await currentOwner();
  if (!owner) return { error: "Sign in to remove a product." };
  return deleteProduct(productId, owner.ownerId, owner.email);
}

export async function loadProducts(businessId: string) {
  const owner = await currentOwner();
  if (!owner) return { error: "Sign in to view products.", products: [] };
  const businesses = await listBusinessesForOwner(owner.ownerId, owner.email);
  if (!businesses.some((business) => business.id === businessId)) {
    return { error: "That business isn't in this desk.", products: [] };
  }
  return { products: await listProducts(businessId) };
}
