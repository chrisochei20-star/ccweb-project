import { CoursesTeaserSection } from '../components/CoursesTeaserSection'
import { CtaSection } from '../components/CtaSection'
import { FeaturesSection } from '../components/FeaturesSection'
import { HeroSection } from '../components/HeroSection'
import { PricingSection } from '../components/PricingSection'
import { TestimonialsSection } from '../components/TestimonialsSection'

export function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <CoursesTeaserSection />
      <PricingSection />
      <TestimonialsSection />
      <CtaSection />
    </>
  )
}
