import React from "react";

export default function InquiriesPage() {
  return (
    <div className="dc-card">
      <h2 className="dc-card-title">고객 문의</h2>
      <p className="dc-status-text">
        Firestore "inquiries" 컬렉션을 읽어와서, 고객 문의 목록과
        처리 여부를 관리하는 기능을 이 화면에 구현하면 됩니다.
      </p>
    </div>
  );
}
