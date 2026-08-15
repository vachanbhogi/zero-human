import Link from "next/link";
import { BRAND, PRICE } from "@/lib/brand";
import { TackMark } from "../icons";

const useCases = [
  {
    title: "Venue founders",
    body: "Someone next to you has a URL and twenty minutes. Tack is the impulse buy: pay, paste, walk away with outreach.",
  },
  {
    title: "Agent-run ops",
    body: "Scout, strategist, Terac, publisher. Each has a job and a boundary. Humans approve spend — not the research.",
  },
  {
    title: "Evidence, not theater",
    body: "Study request, real responses, applied change, before/after preference. Test charges stay labeled as test.",
  },
];

export function UseCases() {
  return (
    <section id="why" className="border-t border-white/6">
      <div className="mx-auto max-w-300 px-5 py-24 md:px-8 md:py-28">
        <h2 className="text-[28px] font-medium tracking-[-0.02em] md:text-[32px]">
          Built to close a loop today
        </h2>
        <div className="grid gap-10 md:grid-cols-3">
          {useCases.map((useCase) => (
            <article key={useCase.title} className="mt-10">
              <h3 className="text-[17px] font-medium tracking-[-0.01em]">
                {useCase.title}
              </h3>
              <p className="mt-3 text-[14px] leading-6 text-secondary">
                {useCase.body}
              </p>
            </article>
          ))}
        </div>
        <p className="mt-16 max-w-130 text-[16px] leading-7 text-secondary">
          Sample panels on this page are labeled illustrations of the sprint —
          not live customer results.
        </p>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="border-t border-white/6">
      <div className="relative mx-auto max-w-300 overflow-hidden px-5 py-28 text-center md:px-8 md:py-36">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(94,106,210,0.16),transparent_60%)]" />
        <h2 className="relative text-[36px] font-medium tracking-[-0.03em] md:text-[48px]">
          A company on payroll.
          <br />
          Agents doing the work.
        </h2>
        <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/onboarding"
            className="inline-flex h-10 items-center rounded-lg bg-white px-4 text-[14px] font-medium text-[#08090a] transition-[transform,opacity] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:opacity-90 active:scale-[0.97]"
          >
            Run a {PRICE} sprint
          </Link>
          <a
            href="#pipeline"
            className="inline-flex h-10 items-center rounded-lg border border-white/10 px-4 text-[14px] text-foreground transition-[transform,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-white/4 active:scale-[0.97]"
          >
            See the loop
          </a>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-white/6 bg-[#08090a]">
      <div className="mx-auto flex max-w-300 flex-col items-center justify-between gap-6 px-5 py-8 md:flex-row md:px-8">
        <div className="flex items-center gap-2 text-foreground">
          <TackMark className="h-4 w-4 text-white" />
          <span className="text-[14px] font-medium text-white">{BRAND}</span>
          <span className="ml-2 text-[12px] text-tertiary">
            © {new Date().getFullYear()} {BRAND}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-6 text-[13px] text-secondary">
          <Link href="/onboarding" className="font-medium text-white transition-colors hover:text-white/80">
            Start sprint
          </Link>
          <a href="#pipeline" className="transition-colors hover:text-white">
            How it runs
          </a>
        </div>
      </div>
    </footer>
  );
}
