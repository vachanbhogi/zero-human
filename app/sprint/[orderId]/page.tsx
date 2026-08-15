import SprintClient from "./sprint-client";

export default async function SprintPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  return <SprintClient orderId={orderId} />;
}
