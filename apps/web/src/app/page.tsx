'use client';

import {
  HeroSection,
  HowItWorks,
  TeachersPreview,
  WhySidra,
  GradesSection,
  SubjectsSection,
  FAQSection,
  BottomCTA,
  ScrollToTop,
} from '@/components/public';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white font-tajawal rtl">
      <main>
        {/* Hero Section - Blue */}
        <HeroSection />

        {/* How It Works - Beige */}
        <HowItWorks />

        {/* Teachers Preview - White */}
        <TeachersPreview />

        {/* Why Sidra - Beige */}
        <WhySidra />

        {/* Grades Section - White */}
        <GradesSection />

        {/* Subjects Section - Beige */}
        <section id="subjects">
          <SubjectsSection />
        </section>

        {/* FAQ Section - White */}
        <FAQSection />

        {/* Bottom CTA - Green */}
        <BottomCTA />
      </main>

      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
  );
}
