import Link from "next/link";
import { PRICE, TAGLINE } from "@/lib/brand";
import { ArrowRight } from "../icons";
import { HeroRunDemo } from "./HeroRunDemo";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-16">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[70vh] bg-[radial-gradient(ellipse_at_50%_20%,rgba(88,92,140,0.22),transparent_58%)]" />

      <div className="relative mx-auto max-w-300 px-5 md:px-8">
        <div className="max-w-205 pb-10 pt-16 md:pb-14 md:pt-22">
          <h1 className="animate-fade-up text-[40px] font-semibold leading-[1.05] tracking-[-0.035em] text-white sm:text-[52px] md:text-[64px]">
            {TAGLINE.split(". ").map((line, i, arr) => (
              <span key={line}>
                {line}
                {i < arr.length - 1 ? "." : ""}
                {i < arr.length - 1 ? <br /> : null}
              </span>
            ))}
          </h1>

          <div className="animate-fade-up-delay mt-6 flex flex-col gap-5 sm:mt-7 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
            <p className="max-w-105 text-[15px] leading-6 text-[#8a8f98] md:text-[16px] md:leading-7">
              Tack is an agent-run growth desk. Paste a URL — we research
              competitors, write outreach, rate it with real people, and hand
              back a campaign you can use today.
            </p>

            <div className="flex shrink-0 flex-wrap items-center gap-3 self-start sm:self-auto">
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-[14px] font-medium text-[#08090a] transition-[opacity,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:opacity-90 active:scale-[0.97]"
              >
                Run a {PRICE} sprint
                <ArrowRight className="h-3.5 w-3.5 opacity-70" />
              </Link>
              <a
                href="#pipeline"
                className="inline-flex items-center rounded-lg border border-white/10 px-4 py-2.5 text-[14px] text-[#c7cad1] transition-[background-color,color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-white/4 hover:text-white active:scale-[0.97]"
              >
                See the loop
              </a>
            </div>
          </div>
        </div>

        <div className="animate-fade-up-delay-2 relative">
          <HeroRunDemo />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-[#08090a] to-transparent md:h-40" />
        </div>
      </div>
    </section>
  );
}
