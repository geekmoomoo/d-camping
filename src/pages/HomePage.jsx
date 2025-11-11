import React from "react";
import FeatureSection from "../components/FeatureSection";
import Footer from "../components/Footer";
import Header from "../components/Header";
import HeroCarousel from "../components/HeroCarousel";
import MapReserveBox from "../components/MapReserveBox";
import QuickReserveBox from "../components/QuickReserveBox";

function HomePage({ onQuickNext }) {
  return (
    <>
      <Header />
      <main>
        <section className="dc-hero">
          <div className="dc-hero-left">
            <HeroCarousel />
          </div>
          <div className="dc-hero-search">
            <QuickReserveBox onNext={onQuickNext} />
            <MapReserveBox />
          </div>
        </section>
        <FeatureSection />
      </main>
      <Footer />
    </>
  );
}

export default HomePage;
