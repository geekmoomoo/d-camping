import React, { useEffect, useState } from "react";
import FeatureSection from "../components/FeatureSection";
import HeroCarousel from "../components/HeroCarousel";
import MapSelector from "../components/MapSelector";
import QuickReserveBox from "../components/QuickReserveBox";
import { fetchSites } from "../api/client";

function HomePage({ onQuickNext, onMapNext }) {
  const [sites, setSites] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    fetchSites()
      .then((result) => {
        if (!mounted) return;
        setSites(result.filter((site) => site.isActive !== false));
      })
      .catch((err) => {
        if (!mounted) return;
        console.error("[HomePage] fetchSites", err);
        setError(err?.message || "사이트 목록을 불러오는 데 실패했습니다.");
      });
    return () => {
      mounted = false;
    };
  }, []);

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
          <MapSelector sites={sites} onNext={handleMapNext} />
          {error && <div className="dc-home-error">{error}</div>}
        </div>
      </section>
      <FeatureSection />
    </>
  );
}

export default HomePage;
