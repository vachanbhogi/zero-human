// Claude-owned. Selects the OrdersServer implementation: Supabase-backed
// when service-role credentials are configured, otherwise the in-memory
// stub (dev/test only — see lib/orders-server.ts). A process-wide singleton
// so all callers (app/api/run/route.ts, tests, etc.) share one instance and
// one Supabase client within a server instance.

import type { OrdersServer } from "@/lib/pipeline-types";
import { InMemoryOrdersServer } from "@/lib/orders-server";
import { SupabaseOrdersServer } from "@/lib/orders-supabase";

let cached: OrdersServer | undefined;

/**
 * Returns the process-wide OrdersServer: SupabaseOrdersServer when both
 * NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are set, otherwise a
 * fresh InMemoryOrdersServer. The choice is made once per process and
 * cached — set env vars before the first call in a given process/test.
 */
export function getOrdersServer(): OrdersServer {
  if (cached) return cached;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  cached =
    supabaseUrl && supabaseSecretKey
      ? new SupabaseOrdersServer(supabaseUrl, supabaseSecretKey)
      : new InMemoryOrdersServer();

  return cached;
}

/** Test-only: clears the cached instance so the next getOrdersServer() call re-evaluates env vars. */
export function resetOrdersServerForTests(): void {
  cached = undefined;
}
