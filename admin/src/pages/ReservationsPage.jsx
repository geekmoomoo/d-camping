import React from "react";

export default function ReservationsPage() {
  return (
    <div className="dc-card">
      <h2 className="dc-card-title">예약 목록</h2>
      <p className="dc-status-text">
        /api/reservations/search 엔드포인트를 활용해서
        기간/상태/이름/전화번호 기준으로 예약을 조회하는 화면을
        이곳에 구성할 수 있습니다.
      </p>
    </div>
  );
}
