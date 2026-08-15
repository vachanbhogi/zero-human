import { Header } from "./Header";
import { Hero } from "./Hero";
import { Competitors, Pipeline, Report, Scan, Terac } from "./Sections";
import { FinalCta, Footer, UseCases } from "./Closing";

export function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-100 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:text-black"
      >
        Skip to content →
      </a>
      <Header />
      <main id="main">
        <Hero />
        <Pipeline />
        <Scan />
        <Competitors />
        <Terac />
        <Report />
        <UseCases />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
