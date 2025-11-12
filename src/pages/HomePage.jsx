import React from "react";
import FeatureSection from "../components/FeatureSection";
import HeroCarousel from "../components/HeroCarousel";
import MapSelector from "../components/MapSelector";
import QuickReserveBox from "../components/QuickReserveBox";

function HomePage({ onQuickNext, onMapNext }) {
  const handleMapNext = (site) => {
    if (typeof onMapNext === "function") {
      onMapNext(site);
    }
  };

  return (
    <>
      <section className="dc-hero">
        <div className="dc-hero-left">
          <HeroCarousel />
        </div>
        <div className="dc-hero-search">
          <QuickReserveBox onNext={onQuickNext} />
          <MapSelector onNext={handleMapNext} />
        </div>
      </section>
      <FeatureSection />
    </>
  );
}

export default HomePage;
