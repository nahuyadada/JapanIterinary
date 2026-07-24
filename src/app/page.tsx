import SiteHeader from "@/components/site/SiteHeader";
import Hero from "@/components/site/Hero";
import {
  WhyJapan,
  PopularDestinations,
  CultureSection,
  TravelTips,
  SiteFooter,
} from "@/components/site/SiteSections";
import Wizard from "@/components/Wizard";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <Hero />
      <WhyJapan />
      <PopularDestinations />
      <section id="plan" className="py-20 bg-gradient-to-br from-pink-50 to-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="max-w-2xl mb-10">
            <h2 className="text-4xl md:text-5xl mb-6 text-gray-900">Plan Your Trip</h2>
            <p className="text-lg text-gray-600">
              Choose the places you want to see, pick your travel dates, and we&apos;ll build a
              smart, route-aware day-by-day itinerary across Japan.
            </p>
          </div>
          <Wizard />
        </div>
      </section>
      <CultureSection />
      <TravelTips />
      <SiteFooter />
    </>
  );
}
