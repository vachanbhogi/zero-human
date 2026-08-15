import { OrderResponse } from "@/lib/types";
import { LIST_LABEL, PRICE_LABEL } from "@/lib/brand";

export interface CompetitorTeardown {
  name: string;
  whatTheyLeadWith: string;
  gapYouCanOwn: string;
}

export interface CustomerPersona {
  who: string;
  whyTheyCare: string;
  firstMessage: string;
}

export interface OutreachPlay {
  id: number;
  channel: "Email" | "In person" | "DM";
  subject?: string;
  body: string;
  cta: string;
}

export interface TeracDraft {
  question: string;
  cohort: string;
  variantA: string;
  variantB: string;
  status: "queued";
}

export interface SprintReportData {
  orderId: string;
  companyName: string;
  url: string;
  niche: string;
  audience: string;
  generatedAt: string;
  summary: string;
  competitors: CompetitorTeardown[];
  personas: CustomerPersona[];
  outreachPlays: OutreachPlay[];
  terac: TeracDraft;
  nextMove: {
    title: string;
    why: string;
    steps: string[];
  };
}

function displayHost(url: string): string {
  try {
    const withProto = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    return new URL(withProto).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }
}

function brandFromOrder(order: OrderResponse): string {
  if (order.company?.trim()) return order.company.trim();
  const host = displayHost(order.url);
  const stem = host.split(".")[0] ?? "Company";
  return stem.charAt(0).toUpperCase() + stem.slice(1);
}

function competitorNames(order: OrderResponse, brand: string): string[] {
  const named = (order.competitors ?? []).map((c) => c.trim()).filter(Boolean);
  if (named.length >= 3) return named.slice(0, 5);
  const fallbacks = [
    `${brand} lookalike on Product Hunt`,
    "The incumbent they get compared to",
    "The DIY spreadsheet they replace",
  ];
  return [...named, ...fallbacks].slice(0, 3);
}

export function generateSprintReport(order: OrderResponse): SprintReportData {
  const brand = brandFromOrder(order);
  const host = displayHost(order.url);
  const niche = order.niche?.trim() || "early-stage product";
  const audience =
    order.audience?.trim() ||
    "founders and builders who already feel the problem";
  const names = competitorNames(order, brand);
  const primaryBuyer = audience.split(/,| and /)[0]?.trim() || audience;

  const competitors: CompetitorTeardown[] = names.map((name, i) => {
    if (i === 0) {
      return {
        name,
        whatTheyLeadWith: "Broad platform language. Sounds big, sells slowly.",
        gapYouCanOwn: `${brand} wins by being specific: one URL in, a campaign out today.`,
      };
    }
    if (i === 1) {
      return {
        name,
        whatTheyLeadWith: "Feature list and 'AI-powered' with no proof of a sendable artifact.",
        gapYouCanOwn: `Lead with the artifact — teardown, 10 lines, one next move — not the model.`,
      };
    }
    return {
      name,
      whatTheyLeadWith: "Manual research they never finish during a hackathon.",
      gapYouCanOwn: `${brand} is the desk that actually runs while they pitch.`,
    };
  });

  const personas: CustomerPersona[] = [
    {
      who: primaryBuyer,
      whyTheyCare: `They need something they can send tonight for ${niche}, not a login to a marketing suite.`,
      firstMessage: `Paste ${host}. Get the teardown and 10 lines. Pay ${PRICE_LABEL} founding if the first three are usable.`,
    },
    {
      who: "Someone standing next to them with a live URL",
      whyTheyCare: "Impulse buy. They can evaluate the product by reading the report, not a pitch deck.",
      firstMessage: `Want us to run Tack on yours? URL, ${PRICE_LABEL} founding (${LIST_LABEL} list), ~3 minutes.`,
    },
  ];

  const outreachPlays: OutreachPlay[] = [
    {
      id: 1,
      channel: "In person",
      body: `We're an agent-run growth desk. Give me ${host} — we map competitors, write 10 outreach lines, and have real people on Terac pick the stronger angle. ${LIST_LABEL} list. ${PRICE_LABEL} founding if you pay on this call. Want us to run it on yours?`,
      cta: "Open the Payment Link on the phone.",
    },
    {
      id: 2,
      channel: "Email",
      subject: `3-minute teardown of ${host}`,
      body: `Hey — we ran ${brand} (${host}) through Tack. Scout pulled the live site, we drafted competitor gaps in ${niche}, and queued two headline variants for a Terac preference study (general population).\n\nIf the first three lines below are wrong, tell us. If they're right, you can send them tonight.`,
      cta: "Reply with the URL you actually want us to run.",
    },
    {
      id: 3,
      channel: "Email",
      subject: `${names[0]} vs ${brand} — the gap`,
      body: `Quick note: ${names[0]} leads with platform. ${brand} can lead with a finished campaign. That's the wedge for ${primaryBuyer}.\n\nWe wrote 10 lines from that angle. Want the pack?`,
      cta: "Yes — send the 10.",
    },
    {
      id: 4,
      channel: "DM",
      body: `Saw ${host}. If you're drowning in "we should do outreach" and never sending: Tack Desk is ${PRICE_LABEL} founding — 90% off ${LIST_LABEL}. URL in, report out. Agents do the research. Humans on Terac rate the copy.`,
      cta: "Drop the URL.",
    },
    {
      id: 5,
      channel: "Email",
      subject: `Who ${brand} should talk to first`,
      body: `Primary buyer we used: ${primaryBuyer}.\n\nThat's who the 10 lines are written for. If that's wrong, reply with one sentence and we regenerate.`,
      cta: "Correct the buyer in one sentence.",
    },
    {
      id: 6,
      channel: "In person",
      body: `Don't ask "would you use an AI marketing tool." Ask: "Want 10 emails for ${brand} in three minutes at ${PRICE_LABEL} founding?"`,
      cta: "Hand them the QR.",
    },
    {
      id: 7,
      channel: "Email",
      subject: `Terac will pick the line — we won't guess`,
      body: `Two drafts for ${brand}:\nA) Generic category claim.\nB) Specific: URL in, campaign out, humans rate it.\n\nUntil the study returns, send B. After it returns, we keep the winner and log before vs after.`,
      cta: "We'll show you the preference delta when it's real.",
    },
    {
      id: 8,
      channel: "DM",
      body: `If ${names[1] ?? names[0]} is the comparison everyone makes, don't argue features. Send the report. The artifact is the demo.`,
      cta: "Forward the sprint link.",
    },
    {
      id: 9,
      channel: "Email",
      subject: `One next move for ${brand}`,
      body: `Don't build a dashboard. Send plays 1–3 to people you can tap today. Record who paid. That's the company.`,
      cta: "Start with the person in the room.",
    },
    {
      id: 10,
      channel: "Email",
      subject: `${brand} — request → pay → deliver`,
      body: `This is the loop we have to prove: you request, you pay on Stripe, agents deliver, Terac changes the copy, we keep the evidence.\n\n${host} is the input. The report is the output. Nothing in between is a human employee.`,
      cta: `Pay ${PRICE_LABEL} founding so the run is real.`,
    },
  ];

  const variantA = `${brand}: AI-powered ${niche} platform.`;
  const variantB = `Give ${host} to Tack. Agents research ${niche}, write outreach for ${primaryBuyer}, and Terac picks the line that lands.`;

  return {
    orderId: order.orderId,
    companyName: brand,
    url: host,
    niche,
    audience,
    generatedAt: new Date().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }),
    summary: `${brand} (${host}) — ${niche}. Built for ${audience}. This pack is Tack Desk at founding ${PRICE_LABEL} (list ${LIST_LABEL}): competitors, who to talk to, 10 sendable lines, and two headlines queued for Terac. Preference numbers appear only after a real study completes.`,
    competitors,
    personas,
    outreachPlays,
    terac: {
      question: `Which line would make you more likely to try ${brand} / reply to ${host}?`,
      cohort: "General population (Terac default)",
      variantA,
      variantB,
      status: "queued",
    },
    nextMove: {
      title: "Send three. Collect one payment. Log the rest.",
      why: "The company is not a dashboard. It is request → Stripe → agents → Terac → this report. The next move is to use the report, not expand it.",
      steps: [
        `Walk to someone with a URL. Use play #1. Take ${PRICE_LABEL} founding on the Payment Link.`,
        `Send plays #2 and #3 to two people you already know. Do not wait for Terac to finish.`,
        `When Terac returns, keep the winning headline, record before vs after, and attach it to this order. Until then, variant B is the working line — labeled as a draft, not a completed study.`,
      ],
    },
  };
}
