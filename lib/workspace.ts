import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  Business,
  BusinessInput,
  hostKey,
  normalizeWebsite,
  ownerKey,
  Product,
  ProductInput,
  WorkspaceFile,
} from "@/lib/workspace-types";

const dataDir = path.join(process.cwd(), ".data");
const dataFile = path.join(dataDir, "workspace.json");

async function readWorkspace(): Promise<WorkspaceFile> {
  try {
    const raw = await readFile(dataFile, "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return { businesses: [], products: [], selectedByOwner: {} };
    }
    const file = parsed as Partial<WorkspaceFile>;
    return {
      businesses: Array.isArray(file.businesses) ? file.businesses : [],
      products: Array.isArray(file.products) ? file.products : [],
      selectedByOwner:
        file.selectedByOwner && typeof file.selectedByOwner === "object"
          ? file.selectedByOwner
          : {},
    };
  } catch {
    return { businesses: [], products: [], selectedByOwner: {} };
  }
}

async function writeWorkspace(file: WorkspaceFile) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(dataFile, JSON.stringify(file, null, 2), "utf8");
}

function newId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function parseCompetitors(value?: string): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function ownsBusiness(
  business: Business,
  ownerId: string | null,
  email: string | null,
) {
  if (ownerId && business.ownerId === ownerId) return true;
  if (email && business.ownerEmail?.toLowerCase() === email.toLowerCase()) {
    return true;
  }
  return false;
}

export async function listBusinessesForOwner(
  ownerId: string | null,
  email: string | null,
): Promise<Business[]> {
  const file = await readWorkspace();
  return file.businesses
    .filter((business) => ownsBusiness(business, ownerId, email))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getBusiness(id: string): Promise<Business | null> {
  const file = await readWorkspace();
  return file.businesses.find((business) => business.id === id) ?? null;
}

export async function getSelectedBusinessId(
  ownerId: string | null,
  email: string | null,
): Promise<string | null> {
  const file = await readWorkspace();
  return file.selectedByOwner[ownerKey(ownerId, email)] ?? null;
}

export async function setSelectedBusinessId(
  ownerId: string | null,
  email: string | null,
  businessId: string,
) {
  const file = await readWorkspace();
  file.selectedByOwner[ownerKey(ownerId, email)] = businessId;
  await writeWorkspace(file);
}

export async function upsertBusinessFromBrief(input: {
  businessId?: string;
  name: string;
  website: string;
  niche?: string;
  audience?: string;
  competitors?: string[];
  ownerId: string | null;
  ownerEmail: string | null;
}): Promise<Business> {
  const file = await readWorkspace();
  const now = new Date().toISOString();
  const website = normalizeWebsite(input.website);
  const key = hostKey(website);
  const name = input.name.trim() || key || "Untitled";

  const existing =
    (input.businessId
      ? file.businesses.find((business) => business.id === input.businessId)
      : undefined) ??
    file.businesses.find(
      (business) =>
        ownsBusiness(business, input.ownerId, input.ownerEmail) &&
        hostKey(business.website) === key,
    );

  if (existing) {
    existing.name = name;
    existing.website = website || existing.website;
    existing.niche = input.niche?.trim() || existing.niche;
    existing.audience = input.audience?.trim() || existing.audience;
    existing.competitors = input.competitors?.length
      ? input.competitors
      : existing.competitors;
    existing.ownerId = input.ownerId ?? existing.ownerId;
    existing.ownerEmail = input.ownerEmail ?? existing.ownerEmail;
    existing.updatedAt = now;
    file.selectedByOwner[ownerKey(input.ownerId, input.ownerEmail)] = existing.id;
    await writeWorkspace(file);
    return existing;
  }

  const created: Business = {
    id: newId("biz"),
    name,
    website,
    niche: input.niche?.trim() ?? "",
    audience: input.audience?.trim() ?? "",
    competitors: input.competitors ?? [],
    ownerId: input.ownerId,
    ownerEmail: input.ownerEmail,
    createdAt: now,
    updatedAt: now,
  };
  file.businesses.push(created);
  file.selectedByOwner[ownerKey(input.ownerId, input.ownerEmail)] = created.id;
  await writeWorkspace(file);
  return created;
}

export async function createBusiness(
  input: BusinessInput,
  ownerId: string | null,
  ownerEmail: string | null,
): Promise<Business | { error: string }> {
  const name = input.name.trim();
  const website = normalizeWebsite(input.website);
  if (!name) return { error: "Business name is required." };
  if (!website) return { error: "Website is required." };

  return upsertBusinessFromBrief({
    name,
    website,
    niche: input.niche,
    audience: input.audience,
    competitors: parseCompetitors(input.competitors),
    ownerId,
    ownerEmail,
  });
}

export async function updateBusiness(
  id: string,
  input: BusinessInput,
  ownerId: string | null,
  ownerEmail: string | null,
): Promise<Business | { error: string }> {
  const file = await readWorkspace();
  const business = file.businesses.find((item) => item.id === id);
  if (!business || !ownsBusiness(business, ownerId, ownerEmail)) {
    return { error: "That business isn't in this desk." };
  }
  const name = input.name.trim();
  const website = normalizeWebsite(input.website);
  if (!name) return { error: "Business name is required." };
  if (!website) return { error: "Website is required." };

  business.name = name;
  business.website = website;
  business.niche = input.niche?.trim() ?? "";
  business.audience = input.audience?.trim() ?? "";
  business.competitors = parseCompetitors(input.competitors);
  business.updatedAt = new Date().toISOString();
  await writeWorkspace(file);
  return business;
}

export async function deleteBusiness(
  id: string,
  ownerId: string | null,
  ownerEmail: string | null,
): Promise<{ error?: string }> {
  const file = await readWorkspace();
  const business = file.businesses.find((item) => item.id === id);
  if (!business || !ownsBusiness(business, ownerId, ownerEmail)) {
    return { error: "That business isn't in this desk." };
  }
  file.businesses = file.businesses.filter((item) => item.id !== id);
  file.products = file.products.filter((item) => item.businessId !== id);
  const key = ownerKey(ownerId, ownerEmail);
  if (file.selectedByOwner[key] === id) {
    const next = file.businesses.find((item) =>
      ownsBusiness(item, ownerId, ownerEmail),
    );
    if (next) file.selectedByOwner[key] = next.id;
    else delete file.selectedByOwner[key];
  }
  await writeWorkspace(file);
  return {};
}

export async function listProducts(businessId: string): Promise<Product[]> {
  const file = await readWorkspace();
  return file.products
    .filter((product) => product.businessId === businessId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function createProduct(
  businessId: string,
  input: ProductInput,
  ownerId: string | null,
  ownerEmail: string | null,
): Promise<Product | { error: string }> {
  const file = await readWorkspace();
  const business = file.businesses.find((item) => item.id === businessId);
  if (!business || !ownsBusiness(business, ownerId, ownerEmail)) {
    return { error: "That business isn't in this desk." };
  }
  const name = input.name.trim();
  if (!name) return { error: "Product name is required." };

  const now = new Date().toISOString();
  const product: Product = {
    id: newId("prd"),
    businessId,
    name,
    price: input.price?.trim() ?? "",
    description: input.description?.trim() ?? "",
    createdAt: now,
    updatedAt: now,
  };
  file.products.push(product);
  business.updatedAt = now;
  await writeWorkspace(file);
  return product;
}

export async function updateProduct(
  id: string,
  input: ProductInput,
  ownerId: string | null,
  ownerEmail: string | null,
): Promise<Product | { error: string }> {
  const file = await readWorkspace();
  const product = file.products.find((item) => item.id === id);
  if (!product) return { error: "That product isn't on this desk." };
  const business = file.businesses.find((item) => item.id === product.businessId);
  if (!business || !ownsBusiness(business, ownerId, ownerEmail)) {
    return { error: "That product isn't on this desk." };
  }
  const name = input.name.trim();
  if (!name) return { error: "Product name is required." };
  product.name = name;
  product.price = input.price?.trim() ?? "";
  product.description = input.description?.trim() ?? "";
  product.updatedAt = new Date().toISOString();
  await writeWorkspace(file);
  return product;
}

export async function deleteProduct(
  id: string,
  ownerId: string | null,
  ownerEmail: string | null,
): Promise<{ error?: string }> {
  const file = await readWorkspace();
  const product = file.products.find((item) => item.id === id);
  if (!product) return { error: "That product isn't on this desk." };
  const business = file.businesses.find((item) => item.id === product.businessId);
  if (!business || !ownsBusiness(business, ownerId, ownerEmail)) {
    return { error: "That product isn't on this desk." };
  }
  file.products = file.products.filter((item) => item.id !== id);
  await writeWorkspace(file);
  return {};
}
