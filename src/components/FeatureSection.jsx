import React from "react";

function FeatureSection() {
  return (
    <section className="dc-section">
      <h2>유형별 특징</h2>
      <div className="dc-cat-grid">
        <div className="dc-cat-item">
          <div className="dc-cat-icon">🚙</div>
          <div className="dc-cat-label">자가 카라반 사이트</div>
          <div className="dc-cat-desc">여유 있는 크기, 차량 옆 캠핑.</div>
        </div>
        <div className="dc-cat-item">
          <div className="dc-cat-icon">🏕️</div>
          <div className="dc-cat-label">카바나 데크 사이트</div>
          <div className="dc-cat-desc">덮개와 데크로 아늑한 감성 캠핑.</div>
        </div>
        <div className="dc-cat-item">
          <div className="dc-cat-icon">⛺</div>
          <div className="dc-cat-label">텐트 사이트</div>
          <div className="dc-cat-desc">자유롭게 텐트 설치 가능한 잔디.</div>
        </div>
        <div className="dc-cat-item">
          <div className="dc-cat-icon">🏡</div>
          <div className="dc-cat-label">숙박 시설</div>
          <div className="dc-cat-desc">가족용 독립형 숙박동.</div>
        </div>
      </div>
    </section>
  );
}

export default FeatureSection;
