import { OrderResponse } from "@/lib/types";

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
        gapYouCanOwn: `${brand} can be specific for ${primaryBuyer}: one clear outcome, not a category claim.`,
      };
    }
    if (i === 1) {
      return {
        name,
        whatTheyLeadWith: "Feature list and 'AI-powered' with no proof of a sendable artifact.",
        gapYouCanOwn: `Lead with something ${primaryBuyer} can use this week — not the roadmap.`,
      };
    }
    return {
      name,
      whatTheyLeadWith: "Manual research they start and never finish.",
      gapYouCanOwn: `${brand} can be the option that actually ships the first send.`,
    };
  });

  const personas: CustomerPersona[] = [
    {
      who: primaryBuyer,
      whyTheyCare: `They need a first send for ${niche} tonight, not another tool to log into.`,
      firstMessage: `Looked at ${host}. For ${primaryBuyer}, the open that works is the specific outcome — not the category. Want the three lines we drafted?`,
    },
    {
      who: `Someone who already compared you to ${names[0]}`,
      whyTheyCare: `They need a reason ${brand} is not just another ${niche} option.`,
      firstMessage: `${names[0]} is the comparison. Don't argue features — send the teardown of ${host}.`,
    },
  ];

  const outreachPlays: OutreachPlay[] = [
    {
      id: 1,
      channel: "In person",
      body: `${brand} is for ${primaryBuyer} in ${niche}. The difference vs ${names[0]} is a first campaign you can send today, not a longer feature list. I can walk ${host} in two minutes.`,
      cta: "Ask if they want the first three lines.",
    },
    {
      id: 2,
      channel: "Email",
      subject: `${host} — one gap vs ${names[0]}`,
      body: `Hey — looked at how ${primaryBuyer} evaluates ${niche}. ${names[0]} leads with platform. ${brand} can lead with a finished first send.\n\nIf that's the wrong buyer, reply in one sentence and I'll rewrite.`,
      cta: "Send to two people you already know.",
    },
    {
      id: 3,
      channel: "Email",
      subject: `${names[0]} vs ${brand} — the gap`,
      body: `Quick note: ${names[0]} sounds big and sells slowly. ${brand} can show ${primaryBuyer} a campaign from ${host} instead of a feature list.\n\nThree lines are ready if you want them tonight.`,
      cta: "Yes — send the 10.",
    },
    {
      id: 4,
      channel: "DM",
      body: `Saw ${host}. If outreach keeps slipping: here are 10 lines written for ${primaryBuyer}. Send the first three as-is and see who replies.`,
      cta: "Offer to send play #1.",
    },
    {
      id: 5,
      channel: "Email",
      subject: `Who ${brand} should talk to first`,
      body: `Primary buyer we used: ${primaryBuyer}.\n\nThat's who the 10 lines are written for. If that's wrong, reply with one sentence.`,
      cta: "Correct the buyer in one sentence.",
    },
    {
      id: 6,
      channel: "In person",
      body: `Don't ask if they need another ${niche} tool. Ask: "Want 10 emails for ${brand} you can send tonight?"`,
      cta: "Show them play #1 on the phone.",
    },
    {
      id: 7,
      channel: "Email",
      subject: `Two headlines for ${brand} — pick one`,
      body: `Two drafts for ${brand}:\nA) Generic category claim.\nB) Specific: what ${primaryBuyer} gets from ${host}.\n\nUntil a preference test returns, send B.`,
      cta: "Use variant B this week.",
    },
    {
      id: 8,
      channel: "DM",
      body: `If ${names[1] ?? names[0]} is the comparison everyone makes, don't argue features. Forward the teardown.`,
      cta: "Send the competitor section.",
    },
    {
      id: 9,
      channel: "Email",
      subject: `One next move for ${brand}`,
      body: `Don't wait for a bigger campaign. Send plays 1–3 to people you can reach today. That's the test.`,
      cta: "Start with someone you can tap today.",
    },
    {
      id: 10,
      channel: "Email",
      subject: `${brand} — send three, learn one thing`,
      body: `${host} is the input. These 10 lines are the output. Send three, note who replies, and we'll tighten the brief from that.`,
      cta: "Send plays 1–3 tonight.",
    },
  ];

  const variantA = `${brand}: AI-powered ${niche} platform.`;
  const variantB = `${brand} gives ${primaryBuyer} a first campaign from ${host} — not another ${niche} login.`;

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
    summary: `${brand} (${host}) — ${niche}. Built for ${audience}. This pack: competitor gaps, who to talk to, 10 sendable lines, and two headlines queued for a preference test. Preference numbers appear only after a real study completes.`,
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
      title: "Send three lines tonight.",
      why: `The pack is useful when ${primaryBuyer} sees it. Plays 1–3 are written to send as-is.`,
      steps: [
        "Send play #1 to someone you can reach today.",
        "Send plays #2 and #3 to two people already in your pipeline.",
        "If the buyer is wrong, edit the brief and run again. Until a preference test returns, variant B is the working headline — a draft, not a completed study.",
      ],
    },
  };
}
