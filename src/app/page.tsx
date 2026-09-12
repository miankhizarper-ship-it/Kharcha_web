import { AppPreview } from "@/components/landing/AppPreview";
import { DownloadCTA } from "@/components/landing/DownloadCTA";
import { Features } from "@/components/landing/Features";
import { Footer } from "@/components/landing/Footer";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Navbar } from "@/components/landing/Navbar";
import { WhyUse } from "@/components/landing/WhyUse";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <AppPreview />
        <Features />
        <WhyUse />
        <HowItWorks />
        <DownloadCTA />
      </main>
      <Footer />
    </div>
  );
}
