import React, { useEffect, useState } from "react";
import FeatureSection from "../components/FeatureSection";
import HeroCarousel from "../components/HeroCarousel";
import MapSelector from "../components/MapSelector";
import QuickReserveBox from "../components/QuickReserveBox";
import BannerModal from "../components/BannerModal";
import { fetchActiveBanners } from "../services/bannerService";

import "../styles/HomePage.css";

const fallbackBanner = {
  id: "winter-event-2025",
  title: "⛄ 겨울 시즌 오픈 기념 이벤트",
  subtitle: "12~2월 예약 시, 장작 1망 무료 제공",
  content:
    "📅 이벤트 기간\n- 2025-12-01 ~ 2026-02-28\n\n🎁 혜택\n- 기간 내 주중/주말 모든 예약에 장작 1망 무료 제공\n- 현장 관리실에서 예약자 이름 확인 후 수령 가능\n\n※ 타 쿠폰/프로모션과 중복 적용은 불가합니다.",
};

function HomePage({ onQuickNext, onMapNext }) {
  const [activeBanner, setActiveBanner] = useState(null);
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    let mounted = true;

    fetchActiveBanners()
      .then((items) => {
        if (mounted) {
          setBanners(items || []);
        }
      })
      .catch((err) => {
        console.error("[banners] load error", err);
        if (mounted) {
          setBanners([]);
        }
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

  const displayBanners = banners.length > 0 ? banners : [fallbackBanner];

  return (
    <>
      <div className="dc-home-page">
        <section className="dc-hero-section">
          <div className="dc-hero-left">
            <HeroCarousel
              items={displayBanners}
              onItemClick={(banner) => setActiveBanner(banner)}
            />
          </div>
          <div className="dc-hero-search">
            <QuickReserveBox onNext={onQuickNext} />
            <MapSelector onNext={handleMapNext} />
          </div>
        </section>
        <div className="dc-feature-section">
          <FeatureSection />
        </div>
      </div>
      <BannerModal
        banner={activeBanner}
        onClose={() => setActiveBanner(null)}
      />
    </>
  );
}

export default HomePage;
