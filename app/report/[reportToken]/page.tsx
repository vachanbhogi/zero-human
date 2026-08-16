import { notFound } from "next/navigation";
import { getReportByToken } from "@/lib/report/lookup";
import {
  renderReport,
  ReportRenderValidationError,
  type ClaimViewModel,
  type ReportViewModel,
} from "@/lib/report/render";

export const dynamic = "force-dynamic";

// terac/variantUsed are validated by renderReport but not surfaced on
// ReportViewModel, so read them from the stored JSON after validation passes.
interface TeracDisplay {
  studyId: string;
  aScore: number;
  bScore: number;
  metric: string;
  variantUsed: string;
}

function teracFromStored(stored: unknown): TeracDisplay | null {
  if (!stored || typeof stored !== "object") return null;
  const s = stored as { terac?: unknown; variantUsed?: unknown };
  if (!s.terac || typeof s.terac !== "object") return null;
  const t = s.terac as Record<string, unknown>;
  if (t.status !== "completed") return null;
  return {
    studyId: String(t.studyId),
    aScore: Number(t.aScore),
    bScore: Number(t.bScore),
    metric: String(t.metric),
    variantUsed: typeof s.variantUsed === "string" ? s.variantUsed : "A",
  };
}

function Claim({ label, claim }: { label: string; claim: ClaimViewModel }) {
  return (
    <div className="mt-2">
      <p className="text-[13px] uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-1 text-[15px] text-neutral-200">{claim.text}</p>
      {claim.disclosure.type === "sources" ? (
        <ul className="mt-1 space-y-0.5">
          {claim.disclosure.sources.map((s) => (
            <li key={s.url} className="text-[12px] text-neutral-500">
              Source: <span className="break-all">{s.url}</span> (retrieved {s.retrievedAt})
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-[12px] italic text-neutral-500">
          Inferred by the analyst agent; not backed by a scanned source.
        </p>
      )}
    </div>
  );
}

function Report({ vm, terac }: { vm: ReportViewModel; terac: TeracDisplay | null }) {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12 text-neutral-100">
      <p className="text-[13px] uppercase tracking-widest text-indigo-400">Tack growth sprint</p>
      <h1 className="mt-2 text-3xl font-semibold">{vm.company}</h1>
      <p className="mt-1 text-[13px] text-neutral-500">Generated {vm.generatedAt}</p>

      <section className="mt-8">
        <h2 className="text-xl font-medium">Executive summary</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-neutral-300">{vm.execSummary}</p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-medium">Competitor teardown</h2>
        {vm.competitors.map((c) => (
          <div key={c.name} className="mt-4 rounded-lg border border-neutral-800 p-4">
            <h3 className="text-[16px] font-medium">{c.name}</h3>
            <Claim label="Positioning" claim={c.positioning} />
            <Claim label="Weakness" claim={c.weakness} />
          </div>
        ))}
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-medium">Personas</h2>
        {vm.personas.map((p) => (
          <div key={p.name} className="mt-3">
            <p className="text-[15px] font-medium">{p.name}</p>
            <p className="text-[14px] text-neutral-400">Pain: {p.pain}</p>
            <p className="text-[14px] text-neutral-400">Trigger: {p.trigger}</p>
          </div>
        ))}
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-medium">10 outreach angles</h2>
        <ol className="mt-2 space-y-4">
          {vm.outreach.map((o) => (
            <li key={o.position} className="rounded-lg border border-neutral-800 p-4">
              <p className="text-[14px] font-medium">
                {o.position}. {o.angle}
              </p>
              {o.subject ? (
                <p className="mt-1 text-[13px] text-neutral-500">Subject: {o.subject}</p>
              ) : null}
              <p className="mt-2 whitespace-pre-wrap text-[14px] text-neutral-300">{o.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-medium">One next move</h2>
        <p className="mt-2 text-[15px] text-neutral-300">{vm.nextMove}</p>
      </section>

      <section className="mt-8 rounded-lg border border-indigo-900/60 bg-indigo-950/20 p-4">
        <h2 className="text-[15px] font-medium text-indigo-300">Human preference check (Terac)</h2>
        {terac ? (
          <p className="mt-2 text-[14px] text-neutral-300">
            This report&apos;s copy uses Variant {terac.variantUsed}, selected by real human raters
            in Terac study {terac.studyId} ({terac.metric}: Variant A {terac.aScore} vs Variant B{" "}
            {terac.bScore}).
          </p>
        ) : (
          <p className="mt-2 text-[14px] text-neutral-400">
            No completed Terac study is attached to this report.
          </p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-[15px] font-medium text-neutral-400">Sources</h2>
        <ul className="mt-2 space-y-1">
          {vm.sources.map((s) => (
            <li key={s.url} className="text-[12px] text-neutral-500">
              <span className="break-all">{s.url}</span> (retrieved {s.retrievedAt})
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

export default async function ReportPage({
  params,
}: {
  params: Promise<{ reportToken: string }>;
}) {
  const { reportToken } = await params;
  const stored = await getReportByToken(reportToken);
  if (!stored) notFound();

  let vm: ReportViewModel;
  try {
    vm = renderReport(stored.resultJson);
  } catch (err) {
    if (err instanceof ReportRenderValidationError) {
      console.error(`report render validation failed for ${stored.orderId}:`, err.issues);
    } else {
      console.error(`report render failed for ${stored.orderId}:`, err);
    }
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#08090a] px-5 text-center">
        <p className="text-[15px] text-neutral-400">
          This report could not be displayed. Contact hello@tack.ai with your order id.
        </p>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#08090a]">
      <Report vm={vm} terac={teracFromStored(stored.resultJson)} />
    </div>
  );
}
