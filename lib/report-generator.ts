export interface CompetitorTeardown {
  name: string;
  marketShare: string;
  strength: string;
  vulnerability: string;
  winningAngle: string;
}

export interface CustomerPersona {
  role: string;
  seniority: string;
  companyProfile: string;
  corePainPoint: string;
  triggerEvent: string;
  objectionKiller: string;
}

export interface OutreachPlay {
  id: number;
  channel: "Cold Email" | "LinkedIn DM" | "Twitter / X";
  subject?: string;
  hook: string;
  body: string;
  cta: string;
}

export interface TeracEvidence {
  question: string;
  variantA: string;
  variantB: string;
  winner: "Variant B" | "Variant A";
  preferenceDelta: string;
  sampleSize: number;
  keyFinding: string;
}

export interface SprintReportData {
  orderId: string;
  companyName: string;
  url: string;
  niche: string;
  stage: string;
  generatedAt: string;
  latencySeconds: number;
  executiveSummary: {
    coreOffering: string;
    targetMarket: string;
    positioningMoat: string;
    recommendedMotion: string;
  };
  competitors: CompetitorTeardown[];
  personas: CustomerPersona[];
  outreachPlays: OutreachPlay[];
  teracEvidence: TeracEvidence;
  nextMoveRecommendation: {
    title: string;
    timeframe: string;
    actionSteps: string[];
    expectedImpact: string;
  };
}

export function generateSprintReport(
  orderId: string,
  url: string,
  company?: string,
  niche?: string,
  audience?: string,
  competitorsList?: string[]
): SprintReportData {
  const cleanUrl = url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const brand =
    company?.trim() ||
    cleanUrl.split(".")[0].charAt(0).toUpperCase() + cleanUrl.split(".")[0].slice(1);
  const targetNiche = niche?.trim() || "B2B SaaS / Growth Infrastructure";
  const targetAudience =
    audience?.trim() || "High-velocity founders, product leaders, and growth operators";

  const rawCompetitors = competitorsList?.filter(Boolean).length
    ? competitorsList
    : ["Incumbent Leader", "Point Solution Rival", "Legacy Enterprise Tool"];

  const competitors: CompetitorTeardown[] = [
    {
      name: rawCompetitors[0] || "Incumbent Platform",
      marketShare: "42% Industry Share",
      strength: "Deep enterprise contracts and broad feature set.",
      vulnerability: "Slow onboarding, bloated pricing tiers, and lack of autonomous workflows.",
      winningAngle: `Position ${brand} as the modern, zero-overhead alternative delivering 10x faster time-to-value.`,
    },
    {
      name: rawCompetitors[1] || "Point Solution Rival",
      marketShare: "22% Industry Share",
      strength: "Niche feature focus in single vertical.",
      vulnerability: "High manual friction requiring developer duct-taping and constant upkeep.",
      winningAngle: `Highlight ${brand}'s unified autonomous intelligence that replaces 3 fragmented point tools.`,
    },
    {
      name: rawCompetitors[2] || "Legacy Alternative",
      marketShare: "18% Industry Share",
      strength: "Long-standing legacy brand recognition.",
      vulnerability: "Expensive per-seat pricing models and outdated user experience.",
      winningAngle: `Target dissatisfied users migrating away from clunky contracts with a frictionless self-serve entry.`,
    },
  ];

  const personas: CustomerPersona[] = [
    {
      role: "Founder / CEO",
      seniority: "Executive",
      companyProfile: "Seed to Series B ($1M - $10M ARR)",
      corePainPoint: "Burning engineering hours on manual workflows instead of shipping product.",
      triggerEvent: "Preparing for next funding round or aggressive Q3 revenue targets.",
      objectionKiller: `Guaranteed ROI within 14 days without requiring additional engineering hires.`,
    },
    {
      role: "VP of Growth / Demand Gen",
      seniority: "Director / VP",
      companyProfile: "High-growth B2B tech companies",
      corePainPoint: "High customer acquisition cost and low cold outreach conversion rates.",
      triggerEvent: "Plateaued inbound pipeline and need for high-intent outbound channels.",
      objectionKiller: `Tested with real human raters on Terac crowd benchmarking to ensure maximum copy response rate.`,
    },
    {
      role: "Lead Product Architect",
      seniority: "Senior / Staff",
      companyProfile: "Engineering-led organizations",
      corePainPoint: "Maintaining custom internal scripts and brittle integrations.",
      triggerEvent: "Technical debt review or team capacity bottleneck.",
      objectionKiller: `Drop-in API with 99.99% uptime and zero maintenance burden.`,
    },
  ];

  const outreachPlays: OutreachPlay[] = [
    {
      id: 1,
      channel: "Cold Email",
      subject: `quick teardown of {{Company}}'s growth bottleneck`,
      hook: `Noticed you're scaling operations in the ${targetNiche} space.`,
      body: `Hey {{FirstName}},\n\nMost teams in your vertical lose 12+ hours a week on manual workflow friction while competitors like ${rawCompetitors[0]} lock users into bloated contracts.\n\nWe ran an autonomous teardown on {{Company}} showing how to cut 80% of routine overhead using ${brand}.\n\nMind if I send over the 2-page brief?`,
      cta: `Open to a 60-second review?`,
    },
    {
      id: 2,
      channel: "LinkedIn DM",
      hook: `Saw your recent push around {{Company}}'s product roadmap.`,
      body: `Hey {{FirstName}}, quick observation—your positioning against ${rawCompetitors[0]} is strong, but there's an untapped wedge in how you frame ROI for ${targetAudience.slice(0, 30)}.\n\nWe built an autonomous intelligence loop that identified 3 competitor blindspots you can exploit immediately.`,
      cta: `Happy to drop the notes here if you're interested?`,
    },
    {
      id: 3,
      channel: "Cold Email",
      subject: `why teams are switching from ${rawCompetitors[0]} to ${brand}`,
      hook: `Are you currently locked into legacy per-seat pricing?`,
      body: `Hey {{FirstName}},\n\nWe surveyed high-growth operators and found that 68% are actively looking to replace bloated legacy tools with modern, autonomous engines.\n\n${brand} delivers the exact same output in 3 minutes with zero manual setup.`,
      cta: `Worth a quick look this week?`,
    },
    {
      id: 4,
      channel: "Twitter / X",
      hook: `Loved your take on scaling ${targetNiche}.`,
      body: `Hey {{FirstName}}, noticed you're building {{Company}}. We ran a crowd preference benchmark on your copy vs ${rawCompetitors[0]}—got some surprising feedback from 10 verified buyers on Terac that could double conversion.`,
      cta: `DM me and I'll send the raw study link!`,
    },
    {
      id: 5,
      channel: "Cold Email",
      subject: `10 high-intent customer angles for {{Company}}`,
      hook: `We mapped out where your highest-converting pipeline is hiding.`,
      body: `Hey {{FirstName}},\n\nInstead of broad cold outbound, we identified 3 micro-segments in ${targetNiche} that convert 3x higher when messaged around speed rather than cost.\n\nAttached the full persona breakdown tailored for {{Company}}.`,
      cta: `Let me know if this resonates!`,
    },
    {
      id: 6,
      channel: "LinkedIn DM",
      hook: `Congrats on the momentum at {{Company}}!`,
      body: `Hey {{FirstName}}, quick question—are you tracking how ${rawCompetitors[1] || "your rivals"} are adjusting their landing page copy this month? We caught a major gap in their onboarding that {{Company}} can easily capitalize on.`,
      cta: `Can send over the 1-pager if you want to see.`,
    },
    {
      id: 7,
      channel: "Cold Email",
      subject: `cutting customer acquisition latency in half`,
      hook: `Speed is the biggest differentiator in ${targetNiche} right now.`,
      body: `Hey {{FirstName}},\n\nBuyers are deciding in under 3 minutes. If your competitor is taking 48 hours to onboard, that's where you win.\n\n${brand} enables instant autonomous delivery that turns cold traffic into active accounts on day 1.`,
      cta: `Free for a 5-min walk-through on Thursday?`,
    },
    {
      id: 8,
      channel: "Twitter / X",
      hook: `Quick growth question for {{Company}}:`,
      body: `Hey {{FirstName}}! Saw your launch recently. If you're looking for warm outreach angles tested against live crowd raters, we put together a 5-pillar breakdown for you.`,
      cta: `Check out the preview here: ${cleanUrl}`,
    },
    {
      id: 9,
      channel: "Cold Email",
      subject: `the 3 competitor blindspots you can win today`,
      hook: `Incumbents are too slow to adapt to autonomous workflows.`,
      body: `Hey {{FirstName}},\n\nWe audited the top 3 players in your space. Their users complain most about complex configuration and lack of speed.\n\n${brand} was architected from the ground up to solve both.`,
      cta: `Can I share the benchmark data?`,
    },
    {
      id: 10,
      channel: "LinkedIn DM",
      hook: `Quick growth note for {{FirstName}}:`,
      body: `Hey {{FirstName}}, we just ran an AI intelligence sweep for {{Company}}. The data shows your highest LTV buyers are ${targetAudience.slice(0, 35)}. We drafted 5 ready-to-send outbound scripts tailored for them.`,
      cta: `Want me to send them over?`,
    },
  ];

  const teracEvidence: TeracEvidence = {
    question: "Which of these two growth angles is more compelling and actionable for a B2B buyer?",
    variantA: "Focus on cost-cutting and replacing routine internal employee hours.",
    variantB: "Focus on speed-to-market, out-innovating competitors, and zero engineering debt.",
    winner: "Variant B",
    preferenceDelta: "+38% Higher Conversion Intent",
    sampleSize: 10,
    keyFinding:
      "Human raters overwhelmingly preferred the speed and competitive advantage angle over cost reduction. All outreach plays have been adjusted to emphasize velocity.",
  };

  return {
    orderId,
    companyName: brand,
    url: cleanUrl,
    niche: targetNiche,
    stage: "High-Growth / Scale",
    generatedAt: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    latencySeconds: 164,
    executiveSummary: {
      coreOffering: `${brand} delivers high-velocity infrastructure and intelligence in ${targetNiche}.`,
      targetMarket: targetAudience,
      positioningMoat: `Autonomous execution with sub-3 minute delivery, outmaneuvering legacy incumbent friction.`,
      recommendedMotion: `Deploy velocity-first cold email and LinkedIn sequences targeted at dissatisfied users of ${rawCompetitors[0]}.`,
    },
    competitors,
    personas,
    outreachPlays,
    teracEvidence,
    nextMoveRecommendation: {
      title: "The 7-Day Founder Wedge Playbook",
      timeframe: "Next 7 Days",
      actionSteps: [
        `Deploy Outreach Play #1 and #3 to 50 target accounts currently using ${rawCompetitors[0]}.`,
        `Update hero headline copy to match the winning Terac crowd variant (Velocity & Moat).`,
        `Offer a 3-minute live interactive scan to turn cold outbound replies into immediate booked calls.`,
      ],
      expectedImpact: "Estimated 2.4x lift in cold response rates and 40% shorter sales cycle.",
    },
  };
}
