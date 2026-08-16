"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BRAND, DISCOUNT, LIST_LABEL, PRICE_LABEL, TAGLINE } from "@/lib/brand";
import { ArrowRight, Spinner } from "../icons";
import { HeroRunDemo } from "./HeroRunDemo";

export function Hero() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    let target = url.trim();
    if (!target.startsWith("http")) {
      target = `https://${target}`;
    }
    // Save draft in session
    try {
      sessionStorage.setItem("tack_brief_draft", JSON.stringify({ url: target }));
    } catch {}
    router.push("/onboarding");
  }

  return (
    <section className="relative overflow-hidden pt-20">
      {/* Background radial glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[80vh] bg-[radial-gradient(ellipse_at_50%_15%,rgba(94,106,210,0.22),transparent_60%)]" />

      <div className="relative mx-auto max-w-300 px-5 md:px-8">
        <div className="max-w-220 pb-12 pt-14 md:pb-16 md:pt-20">
          {/* Pill Badge */}
          <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-brand/35 bg-brand/10 px-3 py-1 text-[12px] font-medium text-accent">
            <span className="flex h-2 w-2 rounded-full bg-live animate-pulse" />
            <span>Autonomous Growth Desk · Founding {PRICE_LABEL}</span>
          </div>

          <h1 className="animate-fade-up mt-5 text-[42px] font-semibold leading-[1.04] tracking-[-0.035em] text-white sm:text-[56px] md:text-[68px]">
            {TAGLINE.split(". ").map((line, i, arr) => (
              <span key={line}>
                {line}
                {i < arr.length - 1 ? "." : ""}
                {i < arr.length - 1 ? <br /> : null}
              </span>
            ))}
          </h1>

          <p className="animate-fade-up-delay mt-6 max-w-120 text-[16px] leading-7 text-[#8a8f98] md:text-[18px]">
            {BRAND} is an agent-run growth desk. Paste your URL, confirm the
            brief, pay the founding rate. You get competitor gaps, who to talk
            to, and 10 lines to send.
          </p>

          {/* Interactive URL Starter Bar */}
          <div className="animate-fade-up-delay-2 mt-8 max-w-130">
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-2.5 sm:flex-row sm:items-center rounded-xl border border-white/12 bg-[#0d0e11]/90 p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md transition-[border-color] duration-150 focus-within:border-brand/60"
            >
              <div className="flex flex-1 items-center px-3">
                <span className="text-[14px] text-tertiary mr-1 font-mono">https://</span>
                <input
                  type="text"
                  placeholder="yourstartup.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-transparent text-[15px] text-white placeholder:text-tertiary focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-white px-5 text-[14px] font-medium text-[#08090a] transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 sm:h-10"
              >
                {loading ? (
                  <Spinner className="h-4 w-4 text-[#08090a]" />
                ) : (
                  <>
                    <span>Start desk</span>
                    <ArrowRight className="h-3.5 w-3.5 opacity-70" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-3 px-1 text-[12px] text-tertiary">
              Founding rate: <strong className="text-white">{PRICE_LABEL}</strong>{" "}
              <span className="text-accent font-mono">({DISCOUNT})</span> · List {LIST_LABEL}
            </p>
          </div>
        </div>

        {/* Live Interactive Hero Preview Demo */}
        <div className="animate-fade-up-delay-2 relative">
          <HeroRunDemo />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-[#08090a] to-transparent md:h-44" />
        </div>
      </div>
    </section>
  );
}
