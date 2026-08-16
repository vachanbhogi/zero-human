import { Header } from "./Header";
import { Hero } from "./Hero";
import { Pipeline, Deliverables, TeracLoop } from "./Sections";
import { Pricing, FAQ, FinalCta, Footer } from "./Closing";

export interface LandingProps {
  userEmail?: string | null;
  isPaid?: boolean;
  activeBusinessName?: string | null;
}

export function Landing({ userEmail, isPaid, activeBusinessName }: LandingProps = {}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-100 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:text-black"
      >
        Skip to content →
      </a>
      <Header
        userEmail={userEmail}
        isPaid={isPaid}
        activeBusinessName={activeBusinessName}
      />
      <main id="main">
        <Hero />
        <Pipeline />
        <Deliverables />
        <TeracLoop />
        <Pricing />
        <FAQ />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
