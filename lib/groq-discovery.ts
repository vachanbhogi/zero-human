import { ScannedProfile } from "./types";

export async function discoverWithGroq(
  formattedUrl: string,
  htmlText: string
): Promise<ScannedProfile | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const systemPrompt = `You are an AI Market & Brand Intelligence Extractor.
Extract facts from the provided website content and return a JSON object with this exact schema:
{
  "name": "Clean brand/company name without trailing site title separators",
  "niche": "Primary industry/niche (e.g. B2B SaaS, Developer Tool, AI Marketing, Fintech)",
  "summary": "1-2 sentence core value proposition and offering",
  "audience": "Target demographic or customer persona (who buys or uses this)",
  "competitors": ["Top Competitor 1", "Top Competitor 2", "Top Competitor 3"]
}
Return ONLY valid JSON.`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7_000);

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Extract business intelligence for this URL: ${formattedUrl}

<website_content>
${htmlText}
</website_content>`,
          },
        ],
        temperature: 0.3,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`[Groq Discovery] HTTP error: ${res.status}`);
      return null;
    }

    const data = await res.json();
    const rawContent = data.choices?.[0]?.message?.content;
    if (!rawContent) return null;

    const parsed = JSON.parse(rawContent);
    return {
      name: typeof parsed.name === "string" ? parsed.name.trim() : undefined,
      niche: typeof parsed.niche === "string" ? parsed.niche.trim() : undefined,
      summary: typeof parsed.summary === "string" ? parsed.summary.trim() : undefined,
      audience: typeof parsed.audience === "string" ? parsed.audience.trim() : undefined,
      competitors: Array.isArray(parsed.competitors)
        ? parsed.competitors
            .filter((c: unknown): c is string => typeof c === "string")
            .map((c: string) => c.trim())
            .slice(0, 5)
        : undefined,
    };
  } catch (err) {
    console.warn("[Groq Discovery Error]:", err);
    return null;
  }
}
