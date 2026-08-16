"use client";

import { useState } from "react";
import Link from "next/link";
import { BRAND, CTA, DISCOUNT, LIST_LABEL, OFFER_NAME, PRICE_LABEL } from "@/lib/brand";
import { TackMark, CheckIcon, ArrowRight } from "../icons";

const FAQS = [
  {
    q: "How fast do the agents generate my growth pack?",
    a: "You paste a URL, confirm the brief, and pay. The pack is drafted from that brief — competitors, who to talk to, and 10 outreach lines you can send.",
  },
  {
    q: "Can I manage multiple products or businesses?",
    a: "Yes! Your Tack Growth Desk workspace allows you to manage multiple companies, track separate competitor watchlists, and rerun sprints whenever your product evolves.",
  },
  {
    q: "What if my startup is pre-launch or behind a waitlist?",
    a: "You can enter your website URL, and our Onboarding Flow lets you manually customize your target audience, value prop, and competitors in seconds.",
  },
  {
    q: "How does the Terac human preference loop work?",
    a: "When we open a Terac study, real participants rate two headline variants. Results show in the pack after the study completes — until then those lines are drafts.",
  },
  {
    q: "Is this a subscription or a one-time charge?",
    a: `The founding offer is ${PRICE_LABEL} (${DISCOUNT} from the ${LIST_LABEL} list price). That unlocks the desk for this account. To stop, email us from the address on the desk — there is no cancel button in settings yet.`,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-20 border-t border-white/6 py-20 md:py-28">
      <div className="mx-auto max-w-300 px-5 md:px-8">
        <div className="mx-auto max-w-200 text-center">
          <div className="inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.1em] text-accent">
            <span>04 · Simple Pricing</span>
          </div>
          <h2 className="mt-3 text-[32px] font-semibold tracking-[-0.03em] text-white sm:text-[44px]">
            One membership. Your autonomous growth team.
          </h2>
          <p className="mt-4 text-[16px] leading-7 text-[#8a8f98]">
            Lock in the founding rate today. No agency retainers, no long onboarding calls.
          </p>
        </div>

        <div className="mx-auto mt-14 max-w-lg">
          <div className="zh-panel relative overflow-hidden p-8 sm:p-10 border-brand/35 shadow-[0_24px_80px_rgba(94,106,210,0.18)]">
            <div className="absolute right-6 top-6 rounded-full border border-brand/40 bg-brand/15 px-3 py-1 font-mono text-[11px] font-medium text-accent">
              {DISCOUNT} Founding Rate
            </div>

            <p className="text-[13px] font-mono uppercase tracking-wider text-secondary">
              {OFFER_NAME} Membership
            </p>

            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-[48px] font-bold tracking-[-0.04em] text-white">
                {PRICE_LABEL}
              </span>
              <span className="text-[20px] text-tertiary line-through font-medium">
                {LIST_LABEL}
              </span>
            </div>

            <p className="mt-3 text-[14px] text-secondary">
              Full autonomous access to competitor analysis, persona generation, and outreach playbooks.
            </p>

            <div className="mt-8 space-y-3.5 border-t border-white/8 pt-6">
              {[
                "Unlimited Website Scans & Competitor Audits",
                "10 Multi-Channel Outreach Plays per sprint",
                "Terac Human-in-the-Loop Copy Preference Testing",
                "Multi-Business & Product Workspace Dashboard",
                "Instant 1-Click Play Copy & PDF Brief Export",
                "Direct Access to Next Move Action Plans",
              ].map((feat) => (
                <div key={feat} className="flex items-center gap-3 text-[14px] text-[#e1e4ea]">
                  <div className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-live/15 text-live">
                    <CheckIcon className="h-3 w-3" />
                  </div>
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <Link
                href="/onboarding"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-white text-[15px] font-medium text-[#08090a] transition-all hover:opacity-90 active:scale-[0.98]"
              >
                <span>{CTA}</span>
                <ArrowRight className="h-4 w-4 opacity-70" />
              </Link>
              <p className="mt-3 text-center text-[12px] text-tertiary">
                Apple Pay and cards · desk opens after payment
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-20 border-t border-white/6 py-20 md:py-28">
      <div className="mx-auto max-w-300 px-5 md:px-8">
        <div className="max-w-200">
          <div className="inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.1em] text-accent">
            <span>05 · Frequently Asked</span>
          </div>
          <h2 className="mt-3 text-[30px] font-semibold tracking-[-0.03em] text-white sm:text-[40px]">
            Common questions about Tack.
          </h2>
        </div>

        <div className="mt-12 max-w-3xl divide-y divide-white/6 overflow-hidden rounded-xl border border-white/8 bg-[#0c0d0e]">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={faq.q} className="transition-colors">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="flex w-full items-center justify-between p-5 text-left text-[15px] font-medium text-white transition-colors hover:text-accent sm:p-6"
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  <span className="ml-4 font-mono text-[18px] text-tertiary">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-6 text-[14px] leading-6 text-secondary sm:px-6">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="border-t border-white/6 py-24 md:py-32">
      <div className="relative mx-auto max-w-300 overflow-hidden px-5 text-center md:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(94,106,210,0.18),transparent_65%)]" />
        <h2 className="relative text-[36px] font-semibold tracking-[-0.035em] text-white sm:text-[50px]">
          Ready to launch your growth desk?
        </h2>
        <p className="relative mx-auto mt-4 max-w-xl text-[16px] leading-7 text-[#8a8f98]">
          Paste your website URL, confirm the brief, and get the competitor
          gaps, buyer personas, and 10 outreach lines.
        </p>
        <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/onboarding"
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-white px-6 text-[15px] font-medium text-[#08090a] transition-all hover:opacity-90 active:scale-[0.98]"
          >
            <span>{CTA}</span>
            <ArrowRight className="h-4 w-4 opacity-70" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-white/6 bg-[#08090a] py-8">
      <div className="mx-auto flex max-w-300 flex-col items-center justify-between gap-4 px-5 sm:flex-row md:px-8">
        <div className="flex items-center gap-2.5 text-white">
          <TackMark className="h-4 w-4" />
          <span className="text-[14px] font-[510]">{BRAND}</span>
          <span className="text-[12px] text-tertiary">
            © {new Date().getFullYear()} {BRAND} · Autonomous Growth Desk
          </span>
        </div>

        <div className="flex items-center gap-6 text-[13px] text-secondary">
          <Link href="/onboarding" className="hover:text-white transition-colors">
            Start desk
          </Link>
          <Link href="/dashboard" className="hover:text-white transition-colors">
            Desk
          </Link>
        </div>
      </div>
    </footer>
  );
}
