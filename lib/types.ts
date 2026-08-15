export interface OrderRequest {
  url: string;
  niche: string;
  email: string;
}

export interface OrderResponse {
  orderId: string;
  status: "pending_payment" | "paid" | "processing" | "completed" | "failed";
  createdAt: string;
  url: string;
  niche: string;
  email: string;
}
