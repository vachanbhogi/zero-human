/** Stripe Payment Link for the $20/mo founding close. Leave unset until the live link exists. */
export function stripePaymentLink(): string | null {
  const url = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK?.trim();
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function checkoutHref(): string {
  return stripePaymentLink() ?? "/onboarding";
}

export function checkoutIsExternal(): boolean {
  return Boolean(stripePaymentLink());
}
