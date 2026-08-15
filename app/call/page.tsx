import { PayCta } from "@/app/components/PayCta";
import { TackMark } from "@/app/components/icons";
import {
  BRAND,
  CALL_CLOSE,
  CALL_OPEN,
  CTA,
  DELIVERABLE,
  DISCOUNT,
  LIST_LABEL,
  OFFER_NAME,
  PRICE_LABEL,
} from "@/lib/brand";
import { checkoutIsExternal } from "@/lib/pay";
import Link from "next/link";

const objections = [
  {
    hear: "Send me a deck.",
    say: "No deck. Paste the URL, I run it live. The report is the demo.",
  },
  {
    hear: "We're already on HubSpot / Clay / an intern.",
    say: `Those don't write 10 lines for your site in three minutes. ${PRICE_LABEL} founding. Cancel after the first pack if it's junk.`,
  },
  {
    hear: "I need to think / ask my cofounder.",
    say: `${DISCOUNT} is for this call. ${LIST_LABEL} after I hang up. Apple Pay, 20 seconds, I stay on the line.`,
  },
  {
    hear: "Is this a subscription?",
    say: `Yes. ${OFFER_NAME} is ${LIST_LABEL}. Founding rate ${PRICE_LABEL} if you pay now. First month is what we collect on this link.`,
  },
];

export default function CallPage() {
  const stripeLive = checkoutIsExternal();

  return (
    <div className="relative min-h-screen bg-[#08090a] text-white">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(88,92,140,0.2),transparent_55%)]"
        aria-hidden
      />

      <header className="relative z-10 mx-auto flex h-16 max-w-220 items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2 text-white">
          <TackMark className="h-4.5 w-4.5" />
          <span className="text-[15px] font-[510]">{BRAND}</span>
          <span className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.08em] text-secondary">
            Call close
          </span>
        </Link>
        <Link href="/onboarding" className="text-[13px] text-secondary hover:text-white">
          Intake
        </Link>
      </header>

      <main className="relative z-10 mx-auto max-w-220 px-5 pb-24">
        <p className="text-[13px] text-secondary">
          Read this. Don&apos;t improvise. Get the URL, then the card.
        </p>
        <h1 className="mt-3 text-[36px] font-semibold leading-[1.08] tracking-[-0.035em] sm:text-[48px]">
          {LIST_LABEL} desk.
          <br />
          {PRICE_LABEL} if they pay on this call.
        </h1>
        <p className="mt-4 max-w-[62ch] text-[16px] leading-7 text-secondary">
          {DISCOUNT} founding rate. Same deliverable you already ship: URL in,
          campaign out, ~3 minutes. Do not say $15. Do not say sprint.
        </p>

        <div className="mt-8 flex flex-wrap items-end gap-3">
          <div>
            <p className="text-[12px] text-tertiary">List</p>
            <p className="text-[28px] font-medium tracking-[-0.03em] text-tertiary line-through">
              {LIST_LABEL}
            </p>
          </div>
          <div className="mb-1 text-[18px] text-tertiary">{DISCOUNT} →</div>
          <div>
            <p className="text-[12px] text-accent">Due today</p>
            <p className="text-[40px] font-semibold tracking-[-0.04em] text-white">
              {PRICE_LABEL}
            </p>
          </div>
        </div>

        <PayCta className="mt-8 inline-flex h-12 items-center rounded-lg bg-white px-6 text-[16px] font-medium text-[#08090a] transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.97]">
          {stripeLive ? `Take ${PRICE_LABEL} on Stripe` : `${CTA} — set the Payment Link`}
        </PayCta>
        {!stripeLive ? (
          <p className="mt-3 max-w-[55ch] text-[13px] leading-5 text-tertiary">
            Create a Stripe Payment Link for {PRICE_LABEL} (founding month or
            subscription). Put it in{" "}
            <code className="font-mono text-[12px] text-secondary">
              NEXT_PUBLIC_STRIPE_PAYMENT_LINK
            </code>{" "}
            in <code className="font-mono text-[12px] text-secondary">.env.local</code>.
            Until then this button goes to intake.
          </p>
        ) : (
          <p className="mt-3 text-[13px] text-live">
            Payment Link is live. Send it, stay on the call, then paste their URL.
          </p>
        )}

        <ol className="mt-14 space-y-6">
          <li className="zh-panel p-6">
            <p className="font-mono text-[11px] text-tertiary">01 · Open</p>
            <p className="mt-3 text-[18px] leading-7 text-white">{CALL_OPEN}</p>
          </li>
          <li className="zh-panel p-6">
            <p className="font-mono text-[11px] text-tertiary">02 · What they get</p>
            <ul className="mt-4 space-y-2">
              {DELIVERABLE.map((item) => (
                <li key={item} className="text-[15px] leading-6 text-secondary">
                  {item}
                </li>
              ))}
            </ul>
          </li>
          <li className="zh-panel p-6">
            <p className="font-mono text-[11px] text-tertiary">03 · Close</p>
            <p className="mt-3 text-[18px] leading-7 text-white">{CALL_CLOSE}</p>
          </li>
          <li className="zh-panel p-6">
            <p className="font-mono text-[11px] text-tertiary">04 · After they pay</p>
            <p className="mt-3 text-[15px] leading-6 text-secondary">
              Open{" "}
              <Link href="/onboarding" className="text-white underline-offset-4 hover:underline">
                /onboarding
              </Link>
              , paste the URL, create the order, show the report. Log them into
              the desk so they can reopen it. Do not claim Terac results until
              a study returns.
            </p>
          </li>
        </ol>

        <h2 className="mt-16 text-[22px] font-medium tracking-[-0.02em]">
          If they stall
        </h2>
        <div className="mt-6 divide-y divide-white/6 overflow-hidden rounded-xl border border-white/8">
          {objections.map((row) => (
            <article key={row.hear} className="bg-[#0c0d0e] px-5 py-5">
              <p className="text-[13px] text-tertiary">They say</p>
              <p className="mt-1 text-[15px] text-white">{row.hear}</p>
              <p className="mt-3 text-[13px] text-tertiary">You say</p>
              <p className="mt-1 text-[15px] leading-6 text-secondary">{row.say}</p>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
