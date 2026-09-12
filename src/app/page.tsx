import { AppPreview } from "@/components/landing/AppPreview";
import { DownloadCTA } from "@/components/landing/DownloadCTA";
import { Features } from "@/components/landing/Features";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { WhyUse } from "@/components/landing/WhyUse";

export default function Home() {
  return (
    <>
      <Hero />
      <AppPreview />
      <Features />
      <WhyUse />
      <HowItWorks />
      <DownloadCTA />
    </>
  );
}
