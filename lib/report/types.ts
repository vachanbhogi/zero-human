// Temporary boundary types until Claude's shared pipeline types are available.

export type ClaimKind = "inference" | "recommendation";

export interface SourceRef {
  id: string;
  url: string;
  retrievedAt: string;
}

export interface EvidencedText {
  text: string;
  sourceIds?: readonly string[];
  kind?: ClaimKind;
}

export interface CompetitorResult {
  name: string;
  positioning: EvidencedText;
  weakness: EvidencedText;
}

export interface PersonaResult {
  name: string;
  pain: EvidencedText;
  trigger: EvidencedText;
}

export interface OutreachResult {
  angle: EvidencedText;
  subject?: EvidencedText;
  body: EvidencedText;
}

export type TeracResult =
  | { status: "not_run" | "pending" }
  | {
      status: "completed";
      studyId: string;
      completedAt: string;
      metric: string;
      aScore: number;
      bScore: number;
      winner: "A" | "B";
    };

export interface SprintResult {
  company: string;
  generatedAt: string;
  executiveSummary: EvidencedText;
  competitors: readonly CompetitorResult[];
  personas: readonly PersonaResult[];
  outreach: readonly OutreachResult[];
  nextMove: EvidencedText;
  sources: readonly SourceRef[];
  terac?: TeracResult;
}
