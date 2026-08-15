import { Metadata } from "next";
import { notFound } from "next/navigation";
import { SprintReportView } from "@/app/components/SprintReportView";
import { generateSprintReport } from "@/lib/report-generator";

interface PageProps {
  params: Promise<{
    orderId: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { orderId } = await params;
  return {
    title: `Sprint Report #${orderId} | Tack`,
    description: "Autonomous competitive teardown and growth playbook.",
  };
}

export default async function SprintPage({ params }: PageProps) {
  const { orderId } = await params;

  if (!orderId) {
    notFound();
  }

  // Generate rich deliverable data based on orderId
  const report = generateSprintReport(
    orderId,
    "https://tack.zero-human.ai",
    "Tack",
    "Autonomous Growth Desks & AI Marketing",
    "Founders, Head of Growth, Demand Gen Operators",
    ["Clay", "Apollo.io", "Lavender"]
  );

  return <SprintReportView report={report} />;
}
