export type Business = {
  id: string;
  name: string;
  website: string;
  niche: string;
  audience: string;
  competitors: string[];
  ownerId: string | null;
  ownerEmail: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BusinessInput = {
  name: string;
  website: string;
  niche?: string;
  audience?: string;
  competitors?: string;
};

export type Product = {
  id: string;
  businessId: string;
  name: string;
  price: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type ProductInput = {
  name: string;
  price?: string;
  description?: string;
};

export type WorkspaceFile = {
  businesses: Business[];
  products: Product[];
  selectedByOwner: Record<string, string>;
};

export function emptyBusinessInput(): BusinessInput {
  return {
    name: "",
    website: "",
    niche: "",
    audience: "",
    competitors: "",
  };
}

export function businessToInput(business: Business): BusinessInput {
  return {
    name: business.name,
    website: business.website,
    niche: business.niche,
    audience: business.audience,
    competitors: business.competitors.join(", "),
  };
}

export function hostKey(url: string): string {
  const raw = url.trim();
  if (!raw) return "";
  try {
    const parsed = raw.includes("://") ? new URL(raw) : new URL(`https://${raw}`);
    return parsed.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return raw.replace(/^www\./, "").toLowerCase();
  }
}

export function normalizeWebsite(url: string): string {
  const raw = url.trim();
  if (!raw) return "";
  try {
    const parsed = raw.includes("://") ? new URL(raw) : new URL(`https://${raw}`);
    const path = parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/$/, "");
    return `${parsed.protocol}//${parsed.host}${path}`;
  } catch {
    return raw;
  }
}

export function ownerKey(ownerId: string | null, email: string | null): string {
  if (ownerId) return `id:${ownerId}`;
  if (email) return `email:${email.trim().toLowerCase()}`;
  return "anon";
}
