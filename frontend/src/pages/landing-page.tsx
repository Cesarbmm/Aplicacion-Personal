import { CtaSection } from '@/components/landing/cta-section'
import { FeaturesSection } from '@/components/landing/features-section'
import { HeroSection } from '@/components/landing/hero-section'
import { HowItWorksSection } from '@/components/landing/how-it-works-section'
import { Navbar } from '@/components/landing/navbar'

export function LandingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--sigma-dark)] text-white">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CtaSection />
    </main>
  )
}

