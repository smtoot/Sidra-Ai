'use client';

import {
  PublicNavbar,
  Footer,
  HeroSection,
  FeaturedTeachers,
  SubjectCategories,
  HowItWorks,
  TeacherCTA,
} from '@/components/public';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white font-tajawal rtl">
      <PublicNavbar />

      <main>
        {/* Hero with Search */}
        <HeroSection />

        {/* Featured Teachers */}
        <FeaturedTeachers />

        {/* Subject Categories */}
        <SubjectCategories />

        {/* How It Works */}
        <HowItWorks />

        {/* Teacher CTA */}
        <TeacherCTA />
      </main>

      <Footer />
    </div>
  );
}
