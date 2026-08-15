import { ArrowRight } from "../icons";
import { LIST_LABEL, OFFER_NAME, PRICE_LABEL } from "@/lib/brand";

const pillars = [
  {
    id: "research",
    title: "Research, not a chatbot",
    body: "Scout reads the live site. Strategist maps competitors, pricing, and the gap you can actually own.",
    fig: "FIG 1",
  },
  {
    id: "humans",
    title: "Humans rate the copy",
    body: "Terac recruits real people to pick the stronger angle. Agents keep the winner and record the delta.",
    fig: "FIG 2",
  },
  {
    id: "delivery",
    title: "A campaign you can send",
    body: `Publisher packages the teardown, personas, and 10 outreach lines into one report. Founding rate ${PRICE_LABEL} — 90% off ${LIST_LABEL}.`,
    fig: "FIG 3",
  },
] as const;

function PillarFig({ id }: { id: (typeof pillars)[number]["id"] }) {
  if (id === "research") {
    return (
      <div className="absolute inset-6 flex flex-col rounded-lg border border-white/8 bg-[#0f1011]/90 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] text-tertiary">Scout</span>
          <span className="font-mono text-[10px] text-accent">live fetch</span>
        </div>
        <div className="space-y-1.5">
          {["northstar.example", "Positioning extracted", "3 competitors queued"].map(
            (row) => (
              <div
                key={row}
                className="rounded-md border border-white/6 bg-white/3 px-2 py-1.5 text-[11px] text-secondary"
              >
                {row}
              </div>
            ),
          )}
        </div>
      </div>
    );
  }

  if (id === "humans") {
    return (
      <div className="absolute inset-6 flex flex-col justify-between rounded-lg border border-white/8 bg-[#0f1011]/90 p-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-tertiary">Terac preference</span>
          <span className="rounded-full border border-brand/35 bg-brand/15 px-2 py-0.5 font-mono text-[10px] text-accent">
            A/B
          </span>
        </div>
        <div>
          <div className="font-mono text-[28px] font-medium leading-none tracking-[-0.03em] text-foreground">
            +18 pts
          </div>
          <div className="mt-1 text-[11px] text-secondary">After vs before</div>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/6">
          <div className="h-full w-[59%] rounded-full bg-brand" />
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-6 flex flex-col rounded-lg border border-white/8 bg-[#0f1011]/90 p-3">
      <div className="mb-2 text-[10px] text-tertiary">Deliverable</div>
      <div className="space-y-1.5">
        {[
          { label: "Teardown", meta: "5 pillars" },
          { label: "Personas", meta: "Matrix" },
          { label: "Outreach", meta: "10 lines" },
          { label: "Next move", meta: "1 call" },
        ].map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between rounded-md border border-white/6 bg-white/3 px-2 py-1.5"
          >
            <span className="text-[11px] text-foreground">{row.label}</span>
            <span className="font-mono text-[10px] text-tertiary">{row.meta}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Pipeline() {
  return (
    <section id="pipeline" className="scroll-mt-16 border-t border-white/6">
      <div className="mx-auto max-w-300 px-5 py-24 md:px-8 md:py-32">
        <h2 className="mx-auto max-w-205 text-center text-[28px] font-medium leading-[1.2] tracking-[-0.03em] text-foreground md:text-[40px]">
          An agent-run company, not a marketing SaaS. Tack takes a URL, does the
          research, asks humans when copy is ambiguous, and delivers a campaign you
          can send this week.
        </h2>

        <div className="mt-16 grid gap-10 md:mt-24 md:grid-cols-3 md:gap-8">
          {pillars.map((p) => (
            <div key={p.id}>
              <div className="zh-panel relative mb-5 aspect-4/3 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(94,106,210,0.18),transparent_55%)]" />
                <div className="absolute inset-0 opacity-40 zh-grain" />
                <div className="absolute bottom-3 left-3 z-10 rounded bg-black/40 px-2 py-1 font-mono text-[10px] text-tertiary">
                  {p.fig}
                </div>
                <PillarFig id={p.id} />
              </div>
              <h3 className="text-[17px] font-medium tracking-[-0.01em]">{p.title}</h3>
              <p className="mt-2 text-[14px] leading-6 text-secondary">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionLink({ index, label }: { index: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-[14px] text-foreground">
      <span className="font-mono text-[12px] text-tertiary">{index}</span>
      <span className="font-medium">{label}</span>
      <ArrowRight className="opacity-50" />
    </span>
  );
}

function Chip({ label, active }: { label: string; active?: boolean }) {
  return (
    <span
      className={
        active
          ? "rounded-md border border-brand/40 bg-brand/15 px-2.5 py-1 text-[11px] font-medium text-accent"
          : "rounded-md border border-white/8 bg-white/3 px-2.5 py-1 text-[11px] text-secondary"
      }
    >
      {label}
    </span>
  );
}

export function Scan() {
  return (
    <section id="scan" className="border-t border-white/6">
      <div className="mx-auto max-w-300 px-5 py-24 md:px-8 md:py-28">
        <div className="max-w-160">
          <SectionLink index="1.0" label="Scan" />
          <h2 className="mt-5 text-[32px] font-medium leading-[1.15] tracking-[-0.03em] md:text-[40px]">
            One field. The rest is the company&apos;s job.
          </h2>
          <p className="mt-4 text-[16px] leading-7 text-secondary">
            Paste a website. Scout extracts name, offer, and audience so the
            desk starts from the live product — not a blank brief.
          </p>
        </div>

        <div className="zh-panel mt-12 overflow-hidden p-4 md:p-6">
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-white/6 bg-white/2 px-3 py-2.5">
            <span className="text-[11px] text-tertiary">Import from</span>
            <span className="font-mono text-[12px] text-foreground">
              https://northstar.example
            </span>
            <span className="ml-auto rounded-md border border-live/25 bg-live/10 px-2 py-0.5 text-[11px] text-live">
              Scanned
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-b border-white/6 pb-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-[13px] font-bold text-white">
              N
            </span>
            <div className="min-w-0">
              <div className="text-[14px] font-medium text-foreground">
                Northstar Apparel
              </div>
              <div className="text-[12px] text-tertiary">
                northstar.example · DTC apparel · sample
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-6 md:grid-cols-3">
            <div>
              <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.12em] text-tertiary">
                Who they sell to
              </div>
              <p className="text-[13px] leading-5 text-secondary">
                Seed-stage founders who need a campaign this week, not a 12-week
                retainer.
              </p>
            </div>
            <div>
              <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.12em] text-tertiary">
                Focus
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Chip label="Competitor teardown" active />
                <Chip label="Outreach copy" active />
                <Chip label="Ads" />
              </div>
            </div>
            <div>
              <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.12em] text-tertiary">
                Stage
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Chip label="Pre-launch" />
                <Chip label="Early traction" active />
                <Chip label="Scaling" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Competitors() {
  const cards = [
    {
      name: "Rival Labs",
      domain: "rivallabs.com",
      hook: "Price-slash homepage, soft CTA",
      counter: "Lead with proof, not discount",
    },
    {
      name: "Atlas Wear",
      domain: "atlaswear.co",
      hook: "Founder unbox, 6s punch-in",
      counter: "Match pace; own the close-up",
    },
    {
      name: "Cove Supply",
      domain: "covesupply.com",
      hook: "Lifestyle montage, muted VO",
      counter: "Sharper product, named buyer",
    },
  ];

  return (
    <section id="competitors" className="border-t border-white/6">
      <div className="mx-auto max-w-300 px-5 py-24 md:px-8 md:py-28">
        <div className="max-w-160">
          <SectionLink index="2.0" label="Competitors" />
          <h2 className="mt-5 text-[32px] font-medium leading-[1.15] tracking-[-0.03em] md:text-[40px]">
            Five competitors. The gap you can own.
          </h2>
          <p className="mt-4 text-[16px] leading-7 text-secondary">
            Positioning, pricing, and messaging — enough to write outreach that
            doesn&apos;t sound like theirs. Sample cards below.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {cards.map((c) => (
            <article key={c.name} className="zh-panel flex flex-col p-5">
              <h3 className="text-[15px] font-medium text-white">{c.name}</h3>
              <p className="mt-0.5 text-[11px] text-tertiary">{c.domain}</p>
              <div className="mt-4 space-y-3 text-[12px] leading-5">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-tertiary">
                    What they lead with
                  </p>
                  <p className="mt-1 text-secondary">{c.hook}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-tertiary">
                    Your counter
                  </p>
                  <p className="mt-1 text-secondary">{c.counter}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Terac() {
  return (
    <section id="terac" className="border-t border-white/6">
      <div className="mx-auto max-w-300 px-5 py-24 md:px-8 md:py-28">
        <div className="max-w-160">
          <SectionLink index="3.0" label="Terac" />
          <h2 className="mt-5 text-[32px] font-medium leading-[1.15] tracking-[-0.03em] md:text-[40px]">
            Agents don&apos;t guess which line lands. People vote.
          </h2>
          <p className="mt-4 text-[16px] leading-7 text-secondary">
            When copy is ambiguous, Tack opens a Terac study. Real participants
            pick A or B. The company keeps the winner and logs before vs after.
          </p>
        </div>

        <div className="zh-panel mt-12 grid gap-0 overflow-hidden md:grid-cols-2">
          <div className="border-b border-white/6 p-6 md:border-b-0 md:border-r">
            <p className="text-[11px] text-tertiary">Before · agent draft</p>
            <p className="mt-4 text-[20px] font-medium leading-snug tracking-[-0.02em]">
              The all-in-one platform for modern teams.
            </p>
            <p className="mt-6 font-mono text-[28px] text-secondary">41%</p>
            <p className="text-[12px] text-tertiary">Preference</p>
          </div>
          <div className="p-6">
            <p className="text-[11px] text-accent">After · Terac winner</p>
            <p className="mt-4 text-[20px] font-medium leading-snug tracking-[-0.02em]">
              Ship a campaign today — competitors mapped, 10 emails written.
            </p>
            <p className="mt-6 font-mono text-[28px] text-white">59%</p>
            <p className="text-[12px] text-tertiary">Preference · sample illustration</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Report() {
  return (
    <section id="report" className="border-t border-white/6">
      <div className="mx-auto max-w-300 px-5 py-24 md:px-8 md:py-28">
        <div className="max-w-160">
          <SectionLink index="4.0" label="Deliverable" />
          <h2 className="mt-5 text-[32px] font-medium leading-[1.15] tracking-[-0.03em] md:text-[40px]">
            What {PRICE_LABEL} buys: a desk you can send from tonight.
          </h2>
          <p className="mt-4 text-[16px] leading-7 text-secondary">
            Not a dashboard login. A concrete package: teardown, personas,
            outreach, and one next move.
          </p>
        </div>

        <div className="zh-panel mt-12 overflow-hidden">
          <div className="border-b border-white/6 px-5 py-3 text-[12px] text-tertiary">
            {OFFER_NAME} · sample table of contents
          </div>
          <ol className="divide-y divide-white/6">
            {[
              "Market snapshot — who you are vs who they think you are",
              "Five competitors — positioning, pricing, the hole they leave",
              "Persona matrix — who to talk to first",
              "Ten outreach lines — personalized, Terac-ranked",
              "If we ran your growth desk tomorrow — one recommendation",
            ].map((item, i) => (
              <li
                key={item}
                className="flex items-start gap-4 px-5 py-4 text-[14px] text-secondary"
              >
                <span className="font-mono text-[12px] text-tertiary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {item}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
