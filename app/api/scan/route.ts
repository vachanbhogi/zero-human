import { NextRequest, NextResponse } from "next/server";
import { ScannedProfile } from "@/lib/types";
import { discoverWithGroq } from "@/lib/groq-discovery";
import { fetchSiteContent } from "@/lib/scout/bright-data";

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "metadata.google.internal",
]);

const PRIVATE_RANGES =
  /^(10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/;

function normalizeUrl(raw: string): URL | null {
  const trimmed = raw.trim();
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    const host = url.hostname.toLowerCase();
    if (BLOCKED_HOSTNAMES.has(host) || PRIVATE_RANGES.test(host)) return null;
    if (!host.includes(".")) return null;
    return url;
  } catch {
    return null;
  }
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function metaContent(html: string, attr: string, value: string): string | undefined {
  const pattern = new RegExp(
    `<meta[^>]+${attr}=["']${value}["'][^>]*content=["']([^"']+)["']`,
    "i",
  );
  const reversed = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]*${attr}=["']${value}["']`,
    "i",
  );
  const match = html.match(pattern) ?? html.match(reversed);
  return match ? decodeEntities(match[1]) : undefined;
}

// Site titles commonly carry a trailing brand separator we don't want in the name.
function cleanTitle(title: string): string {
  return title.split(/\s*[|·—–]\s*/)[0].trim();
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const rawUrl =
    typeof body === "object" && body !== null && "url" in body
      ? String((body as { url: unknown }).url ?? "")
      : "";

  const url = normalizeUrl(rawUrl);
  if (!url) {
    return NextResponse.json(
      { error: "Enter a valid public website URL." },
      { status: 400 },
    );
  }

  try {
    let html: string;
    let source: "bright_data" | "direct" = "direct";
    if (process.env.BRIGHT_DATA_API_KEY) {
      const result = await fetchSiteContent(url.toString(), {
        timeoutMs: 8_000,
        maxResponseBytes: 400_000,
      });
      if (!result.ok) {
        return NextResponse.json(
          { error: "Could not scan that site through Bright Data. Enter details manually." },
          { status: 502 },
        );
      }
      html = result.value.content;
      source = "bright_data";
    } else {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8_000);
      try {
        const res = await fetch(url, {
          signal: controller.signal,
          redirect: "follow",
          headers: {
            "User-Agent": "TackBot/0.1 (+hackathon agent intake)",
            Accept: "text/html,application/xhtml+xml",
          },
        });

        if (!res.ok) {
          return NextResponse.json(
            { error: `Site responded ${res.status}. Enter details manually.` },
            { status: 502 },
          );
        }
        html = (await res.text()).slice(0, 400_000);
      } finally {
        clearTimeout(timeout);
      }
    }

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? decodeEntities(titleMatch[1]) : undefined;
    const metaDesc =
      metaContent(html, "name", "description") ??
      metaContent(html, "property", "og:description");

    const cleanText = html
      .replace(/<script\b[^<]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style\b[^<]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 3000);

    const excerpt = `Page Title: ${title || "N/A"}
Meta Description: ${metaDesc || "N/A"}
Content Excerpt: ${cleanText}`;

    // Attempt high-speed Groq AI extraction if key is present
    const groqProfile = await discoverWithGroq(url.toString(), excerpt);

    const fallbackProfile: ScannedProfile = {
      name:
        metaContent(html, "property", "og:site_name") ??
        (title ? cleanTitle(title) : undefined),
      summary: metaDesc,
      niche: metaContent(html, "name", "keywords")?.split(",")[0]?.trim(),
    };

    const profile: ScannedProfile = groqProfile || fallbackProfile;

    return NextResponse.json({
      success: true,
      websiteUrl: url.toString(),
      source,
      profile,
    });
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return NextResponse.json(
      {
        error: aborted
          ? "Scan timed out. Enter details manually."
          : "Could not reach that site. Enter details manually.",
      },
      { status: 502 },
    );
  }
}
