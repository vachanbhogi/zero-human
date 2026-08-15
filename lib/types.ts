export const DELIVERABLE_FOCUS = [
  "Competitor teardown",
  "Positioning rewrite",
  "Prospect list",
  "Outreach copy",
] as const;

export const MARKET_STAGE = [
  "Pre-launch",
  "Early traction",
  "Scaling",
] as const;

export interface AgentBrief {
  url: string;
  company: string;
  niche: string;
  audience: string;
  competitors: string;
  focus: string;
  stage: string;
  email: string;
}

export const emptyAgentBrief = (): AgentBrief => ({
  url: "",
  company: "",
  niche: "",
  audience: "",
  competitors: "",
  focus: "",
  stage: "",
  email: "",
});

export interface OrderRequest {
  url: string;
  niche: string;
  email: string;
  company?: string;
  audience?: string;
  competitors?: string[];
  focus?: string;
  stage?: string;
}

export interface OrderResponse {
  orderId: string;
  status: "pending_payment" | "paid" | "processing" | "completed" | "failed";
  createdAt: string;
  url: string;
  niche: string;
  email: string;
  company?: string;
  audience?: string;
  competitors?: string[];
  focus?: string;
  stage?: string;
}

export interface ScannedProfile {
  name?: string;
  niche?: string;
  summary?: string;
}
