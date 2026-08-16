import type { AuthenticatedRunRunner } from "./types";

type AuthenticatedRunRunnerOptions = Readonly<{
  endpoint: URL;
  fetchImplementation?: typeof fetch;
  runSecret: string;
}>;

export function createAuthenticatedRunRunner({
  endpoint,
  fetchImplementation = fetch,
  runSecret,
}: AuthenticatedRunRunnerOptions): AuthenticatedRunRunner {
  return {
    async run({ dispatchId }) {
      const response = await fetchImplementation(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-run-secret": runSecret,
        },
        body: JSON.stringify({ dispatchId }),
      });

      if (!response.ok) {
        throw new Error(`Run request failed with status ${response.status}`);
      }
    },
  };
}
