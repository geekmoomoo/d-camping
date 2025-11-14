import React from "react";

const GUIDE_SECTIONS = [
  {
    title: "체크인/체크아웃",
    details: [
      "체크인 15:00 이후 · 체크아웃 11:00 이전",
      "조기 체크인/연장 체크아웃은 사전 문의",
    ],
  },
  {
    title: "차량 진입 및 주차",
    details: [
      "캠핑장 진입 시 차량 등록 확인",
      "주차 공간은 지정된 주차장 이용",
      "1개 사이트당 차량 1대 권장",
    ],
  },
  {
    title: "캠핑장 이용 수칙",
    details: [
      "22:30~07:00은 소등/야간 매너 시간",
      "쓰레기는 분리 배출 · 지정 장소에 버리기",
      "화로대 사용 시 안전거리 유지",
    ],
  },
  {
    title: "취소/환불 규정 요약",
    details: [
      "7일 전 취소: 90% 환불 · 3일 전: 50%",
      "당일/무단취소: 환불 불가",
      "환불은 지정 계좌로 7영업일 내 입금",
    ],
  },
];

function UsageGuidePage() {
  return (
    <section className="dc-step-card">
      <h2>이용안내</h2>
      {GUIDE_SECTIONS.map((section) => (
        <div key={section.title} className="dc-guide-section">
          <h3>{section.title}</h3>
          <ul>
            {section.details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

export default UsageGuidePage;
