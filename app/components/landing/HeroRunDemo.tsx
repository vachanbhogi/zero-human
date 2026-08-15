const NAV = [
  { label: "Scan", active: false },
  { label: "Competitors", active: false },
  { label: "Outreach", active: false },
  { label: "Terac", active: true },
  { label: "Report", active: false },
];

const COMPETITORS = [
  { name: "Rival Labs", move: "Price-first homepage", gap: "No proof, weak CTA" },
  { name: "Atlas Wear", move: "Founder-led UGC", gap: "Slow load, buried pricing" },
  { name: "Cove Supply", move: "Lifestyle montage", gap: "Generic audience" },
];

export function HeroRunDemo() {
  return (
    <div
      aria-hidden
      className="relative overflow-hidden rounded-xl border border-white/8 bg-[#08090a] shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_30px_80px_rgba(0,0,0,0.55)]"
    >
      <div className="zh-grain pointer-events-none absolute inset-0 opacity-30" />

      <div className="relative flex min-h-[34rem] flex-col md:min-h-[38rem] md:flex-row">
        <aside className="relative hidden w-48 shrink-0 flex-col border-r border-white/6 bg-[#08090a] md:flex">
          <div className="relative border-b border-white/6 px-3 py-3">
            <div className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand text-[11px] font-bold text-white">
                N
              </span>
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium leading-tight text-white">
                Northstar
              </span>
            </div>
          </div>

          <nav className="relative flex flex-1 flex-col gap-0.5 px-2 py-3">
            {NAV.map((item) => (
              <div
                key={item.label}
                className={
                  item.active
                    ? "flex items-center gap-2.5 rounded-lg border border-brand/35 bg-brand/10 px-2.5 py-2 text-[12.5px] font-medium text-brand"
                    : "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px] text-[#8a8f98]"
                }
              >
                {item.label}
              </div>
            ))}
          </nav>

          <div className="border-t border-white/6 px-3 py-3">
            <p className="text-[10px] uppercase tracking-[0.12em] text-tertiary">
              Sample run
            </p>
            <p className="mt-1 font-mono text-[11px] text-secondary">ord_demo</p>
          </div>
        </aside>

        <div className="relative flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-white/6 px-4 py-3 md:px-6">
            <div>
              <p className="text-[13px] font-medium text-white">Human preference</p>
              <p className="text-[11px] text-tertiary">
                Terac panel · general population · labeled sample
              </p>
            </div>
            <span className="rounded-md border border-live/30 bg-live/10 px-2 py-0.5 text-[11px] text-live">
              Study complete
            </span>
          </div>

          <div className="grid flex-1 gap-4 p-4 md:grid-cols-[1.1fr_0.9fr] md:p-6">
            <div className="space-y-3">
              <div className="zh-panel p-4">
                <div className="flex items-baseline justify-between">
                  <p className="text-[12px] text-tertiary">Variant A · first draft</p>
                  <p className="font-mono text-[18px] text-secondary">41%</p>
                </div>
                <p className="mt-2 text-[14px] leading-5 text-secondary">
                  “The all-in-one platform for modern teams.”
                </p>
              </div>
              <div className="zh-panel border-brand/30 p-4">
                <div className="flex items-baseline justify-between">
                  <p className="text-[12px] text-accent">Variant B · after Terac</p>
                  <p className="font-mono text-[18px] text-white">59%</p>
                </div>
                <p className="mt-2 text-[14px] leading-5 text-white">
                  “Ship a campaign today — competitors mapped, 10 emails written.”
                </p>
              </div>
              <p className="text-[11px] leading-4 text-tertiary">
                Agents keep the winner. Preference rate is the before/after measure.
              </p>
            </div>

            <div className="zh-panel flex flex-col p-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-tertiary">
                Scouted competitors
              </p>
              <div className="mt-3 space-y-2">
                {COMPETITORS.map((c) => (
                  <div
                    key={c.name}
                    className="rounded-lg border border-white/6 bg-white/2 px-3 py-2"
                  >
                    <p className="text-[12px] font-medium text-white">{c.name}</p>
                    <p className="text-[11px] text-secondary">{c.move}</p>
                    <p className="text-[11px] text-tertiary">{c.gap}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
