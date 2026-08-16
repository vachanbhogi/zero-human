import { ArrowRight, CheckIcon } from "../icons";
import { BRAND } from "@/lib/brand";
import Link from "next/link";

const pillars = [
  {
    id: "scout",
    title: "1. Scout Agent",
    subtitle: "Real-time crawler & meta extraction",
    body: "Scout visits your live website, extracts value propositions, tech stack signals, and detects who you are competing with in the wild.",
    badge: "Live Web Fetch",
  },
  {
    id: "analyst",
    title: "2. Strategist Agent",
    subtitle: "Competitor gap & persona mapping",
    body: "Dissects your top 3 rivals. Uncovers their messaging blind spots, pricing gaps, and builds high-intent buyer personas.",
    badge: "Deep Reasoning",
  },
  {
    id: "terac",
    title: "3. Terac Human Loop",
    subtitle: "Real human preference validation",
    body: "When copy is ambiguous, Terac deploys real-time crowd preference studies. Humans vote, and the winning headline is locked into your playbook.",
    badge: "Human Feedback",
  },
] as const;

export function Pipeline() {
  return (
    <section id="pipeline" className="scroll-mt-20 border-t border-white/6 py-20 md:py-28">
      <div className="mx-auto max-w-300 px-5 md:px-8">
        <div className="max-w-200">
          <div className="inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.1em] text-accent">
            <span>01 · The Engine</span>
          </div>
          <h2 className="mt-3 text-[30px] font-semibold leading-[1.12] tracking-[-0.03em] text-white sm:text-[40px]">
            An autonomous company, not another marketing SaaS.
          </h2>
          <p className="mt-4 text-[16px] leading-7 text-[#8a8f98]">
            {BRAND} replaces months of agency retainers and incomplete spreadsheets with an
            always-on growth desk that turns a URL and a brief into a first campaign.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {pillars.map((p) => (
            <div
              key={p.id}
              className="zh-panel flex flex-col justify-between p-6 transition-all duration-200 hover:border-white/16 hover:bg-white/[0.02]"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full border border-white/10 bg-white/4 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-secondary">
                    {p.badge}
                  </span>
                </div>
                <h3 className="mt-6 text-[18px] font-medium text-white">{p.title}</h3>
                <p className="mt-1 text-[13px] font-mono text-accent">{p.subtitle}</p>
                <p className="mt-3 text-[14px] leading-6 text-secondary">{p.body}</p>
              </div>

              <div className="mt-8 border-t border-white/6 pt-4">
                <span className="inline-flex items-center gap-1 text-[12px] font-medium text-white">
                  <span>Autonomous execution</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-live" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Deliverables() {
  const features = [
    {
      title: "Competitor Intelligence Matrix",
      desc: "Top 3 competitors mapped by what they lead with, where they are vulnerable, and the exact positioning gap your startup can own.",
    },
    {
      title: "Target Persona Scoring",
      desc: "Detailed buyer profiles with pain triggers, urgent priorities, and the specific opening message that prompts a reply.",
    },
    {
      title: "10 Multi-Channel Outreach Plays",
      desc: "Ready-to-send copy across Email, LinkedIn DMs, and Cold Calls tailored to your product with 1-click copy.",
    },
    {
      title: "1 Next Move Playbook",
      desc: "A concrete, zero-fluff immediate action plan to execute today instead of waiting for a 12-week marketing roadmap.",
    },
  ];

  return (
    <section id="deliverables" className="scroll-mt-20 border-t border-white/6 py-20 md:py-28">
      <div className="mx-auto max-w-300 px-5 md:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.1em] text-accent">
              <span>02 · The Deliverable</span>
            </div>
            <h2 className="mt-3 text-[30px] font-semibold leading-[1.12] tracking-[-0.03em] text-white sm:text-[40px]">
              What you receive: A campaign you can send tonight.
            </h2>
            <p className="mt-4 text-[16px] leading-7 text-[#8a8f98]">
              No blank templates or speculative advice. You receive a structured,
              executive intelligence brief built directly from your URL.
            </p>

            <div className="mt-8 space-y-4">
              {features.map((f) => (
                <div key={f.title} className="flex gap-3.5">
                  <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/20 text-accent">
                    <CheckIcon className="h-3 w-3" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-medium text-white">{f.title}</h3>
                    <p className="mt-1 text-[13px] leading-5 text-secondary">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10">
              <Link
                href="/onboarding"
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-white px-5 text-[14px] font-medium text-[#08090a] transition-all hover:opacity-90 active:scale-[0.98]"
              >
                <span>Generate Your Campaign</span>
                <ArrowRight className="h-3.5 w-3.5 opacity-70" />
              </Link>
            </div>
          </div>

          {/* Interactive Report Sample Card */}
          <div className="zh-panel overflow-hidden p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/8 pb-4">
              <div>
                <p className="text-[11px] font-mono uppercase text-tertiary">Deliverable Sample</p>
                <p className="text-[15px] font-medium text-white">Executive Intelligence Report</p>
              </div>
              <span className="rounded-md border border-live/30 bg-live/10 px-2 py-0.5 text-[11px] text-live font-medium">
                Verified Output
              </span>
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-lg border border-white/6 bg-white/2 p-3.5">
                <p className="text-[10px] font-mono uppercase text-tertiary">Play #01 · Email Angle</p>
                <p className="mt-1 text-[13px] font-medium text-white">
                  Subject: One gap vs the incumbent they already named
                </p>
                <p className="mt-1.5 text-[12px] leading-5 text-secondary">
                  “Hey — we ran your website through {BRAND}. Here are the 2 gaps your top rival leaves wide open...”
                </p>
              </div>

              <div className="rounded-lg border border-white/6 bg-white/2 p-3.5">
                <p className="text-[10px] font-mono uppercase text-tertiary">Play #02 · Direct Message</p>
                <p className="mt-1 text-[12px] leading-5 text-secondary">
                  “Saw your product launch on Product Hunt. If you are struggling with customer reply rates, here is the exact hook that rated 59% higher on Terac...”
                </p>
              </div>

              <div className="rounded-lg border border-brand/30 bg-brand/5 p-3.5">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-mono uppercase text-accent">Next Move Recommendation</p>
                  <span className="text-[11px] font-mono text-accent">Immediate</span>
                </div>
                <p className="mt-1.5 text-[13px] font-medium text-white">
                  Send plays 1–3 to 10 high-intent prospects before expanding your product scope.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function TeracLoop() {
  return (
    <section id="terac" className="scroll-mt-20 border-t border-white/6 py-20 md:py-28">
      <div className="mx-auto max-w-300 px-5 md:px-8">
        <div className="max-w-200">
          <div className="inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.1em] text-accent">
            <span>03 · Real-World Validation</span>
          </div>
          <h2 className="mt-3 text-[30px] font-semibold leading-[1.12] tracking-[-0.03em] text-white sm:text-[40px]">
            Agents don&apos;t guess which copy converts. Real humans vote.
          </h2>
          <p className="mt-4 text-[16px] leading-7 text-[#8a8f98]">
            Traditional AI tools hallucinate subjective quality. {BRAND} connects to
            the Terac human preference network to A/B test headline variants with real people.
          </p>
        </div>

        <div className="zh-panel mt-12 grid overflow-hidden md:grid-cols-2">
          <div className="border-b border-white/6 p-6 md:border-b-0 md:border-r">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-tertiary">Draft Variant A</span>
              <span className="text-[12px] text-tertiary">Unverified</span>
            </div>
            <p className="mt-4 text-[18px] font-medium leading-snug text-secondary">
              “The all-in-one platform for modern startups to grow faster.”
            </p>
            <div className="mt-8 flex items-baseline gap-2">
              <span className="font-mono text-[32px] font-semibold text-secondary">41%</span>
              <span className="text-[12px] text-tertiary">Human Preference</span>
            </div>
            <p className="mt-1 text-[12px] text-tertiary">
              Feedback: Too generic, sounds like every other B2B landing page.
            </p>
          </div>

          <div className="bg-brand/[0.04] p-6">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-accent">Optimized Variant B</span>
              <span className="rounded-full border border-live/30 bg-live/10 px-2 py-0.5 text-[10px] font-mono text-live font-medium">
                Terac Winner (+18 pts)
              </span>
            </div>
            <p className="mt-4 text-[18px] font-medium leading-snug text-white">
              “URL in, campaign out — competitors, who to talk to, 10 lines to send.”
            </p>
            <div className="mt-8 flex items-baseline gap-2">
              <span className="font-mono text-[32px] font-semibold text-white">59%</span>
              <span className="text-[12px] text-accent">Human Preference</span>
            </div>
            <p className="mt-1 text-[12px] text-secondary">
              Feedback: Specific deliverable, clear time-to-value, highly actionable.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
