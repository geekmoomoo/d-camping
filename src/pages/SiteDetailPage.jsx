import React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import SiteImageCarousel from "../components/SiteImageCarousel";
import "./SiteDetailPage.css";

const SiteDetailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const {
    site,
    checkInDate,
    checkOutDate,
    peopleCount,
    selectedType,
  } = location.state || {};

  const siteName =
    site?.name || `*${id || "A1"}* 자가 카라반 사이트 / 차박 가능`;
  const siteType = site?.type || "self-caravan";

  const basePeople = site?.basePeople || 4;
  const maxPeople = site?.maxPeople || 5;
  const mannerStart = site?.mannerStart || "22:30";
  const mannerEnd = site?.mannerEnd || "07:00";

  const displayCheckIn = checkInDate || "-";
  const displayCheckOut = checkOutDate || "-";
  const displayPeople = peopleCount || 2;

  const typeLabel =
    selectedType === "self-caravan"
      ? "자가 카라반"
      : selectedType === "cabana-deck"
      ? "카바나 데크"
      : selectedType === "tent"
      ? "텐트 사이트"
      : selectedType === "lodging"
      ? "숙박 시설"
      : siteType === "self-caravan"
      ? "자가 카라반"
      : siteType === "cabana-deck"
      ? "카바나 데크"
      : siteType === "tent"
      ? "텐트 사이트"
      : siteType === "lodging"
      ? "숙박 시설"
      : "전체";

  const images =
    site?.images && site.images.length
      ? site.images
      : [
          "/site_img/site_001.jpg",
          "/site_img/site_002.jpg",
          "/site_img/site_003.jpg",
          "/site_img/site_004.jpg",
        ];

  const typeColorMap = {
    "self-caravan": "#3B82F6",
    "cabana-deck": "#A855F7",
    tent: "#22C55E",
    lodging: "#F97316",
    default: "#38BDF8",
  };

  const typeColor = typeColorMap[siteType] || typeColorMap.default;

  return (
    <div className="site-detail-page">
      {/* 상단 헤더 */}
      <header className="site-detail-header">
        <button
          className="icon-button"
          onClick={() => navigate(-1)}
          aria-label="뒤로가기"
        >
          ←
        </button>
        <h1 className="site-detail-title">{siteName}</h1>
        <button
          className="icon-button"
          onClick={() => navigate("/")}
          aria-label="홈으로"
        >
          🏕
        </button>
      </header>

      {/* 이미지 + 뱃지 */}
      <section className="site-detail-visual">
        <div className="site-detail-image">
          <SiteImageCarousel images={images} />
          <span
            className="site-type-badge"
            style={{ backgroundColor: typeColor }}
          >
            {typeLabel}
          </span>
        </div>
      </section>

      {/* 정보 */}
      <section className="site-detail-info">
        <div className="site-main-text">
          <h2 className="site-name">{siteName}</h2>
          <p className="site-sub">
            <span className="tag">입실 13:00 - 퇴실 11:00</span>
            <span className="divider">·</span>
            기준 {basePeople}인 / 최대 {maxPeople}인
          </p>
        </div>

        <div className="info-cards-grid">
          <div className="info-card">
            <div className="info-label">매너타임 시작</div>
            <div className="info-value">{mannerStart}</div>
          </div>
          <div className="info-card">
            <div className="info-label">매너타임 종료</div>
            <div className="info-value">{mannerEnd}</div>
          </div>
          <div className="info-card">
            <div className="info-label">입실일</div>
            <div className="info-value">{displayCheckIn}</div>
          </div>
          <div className="info-card">
            <div className="info-label">퇴실일</div>
            <div className="info-value">{displayCheckOut}</div>
          </div>
          <div className="info-card">
            <div className="info-label">인원</div>
            <div className="info-value">{displayPeople}명</div>
          </div>
          <div className="info-card">
            <div className="info-label">선택 유형</div>
            <div className="info-value">{typeLabel}</div>
          </div>
        </div>

        <div className="reserve-section">
          <p className="reserve-text">
            선택하신 사이트와 날짜, 인원을 확인한 후
            다음 단계에서 예약자 정보를 입력해주세요.
          </p>
          <button
            className="reserve-button"
            onClick={() =>
              alert("여기에 예약자 정보 입력/결제 페이지를 연결하면 됩니다.")
            }
          >
            이 사이트로 예약 진행하기
          </button>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="site-detail-footer">
        <div className="footer-name">담양 금성산성 오토캠핑장</div>
        <div className="footer-text">예약 및 문의 : 010-0000-0000</div>
        <div className="footer-text">주소 : 전라남도 담양군 (실제 주소)</div>
        <div className="footer-copy">
          © 2025 Damyang Auto Camping. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
};

export default SiteDetailPage;
