import type { ReactNode } from "react";
import { CTA } from "@/lib/brand";
import { checkoutHref, checkoutIsExternal } from "@/lib/pay";

export function PayCta({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  const href = checkoutHref();
  const external = checkoutIsExternal();

  return (
    <a
      href={href}
      className={className}
      {...(external
        ? { target: "_blank", rel: "noreferrer" }
        : {})}
    >
      {children ?? CTA}
    </a>
  );
}
