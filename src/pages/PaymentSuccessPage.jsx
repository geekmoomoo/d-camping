import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";

function formatAmount(value) {
  if (value == null || Number.isNaN(Number(value))) return "-";
  return `${Number(value).toLocaleString()}원`;
}

function PaymentSuccessPage({ onReservationBack, onHome }) {
  const { search } = useLocation();
  const params = useMemo(() => new URLSearchParams(search), [search]);

  const orderId = params.get("orderId") || params.get("reservationId") || "-";
  const amount = params.get("amount");
  const customerName = params.get("customerName") || params.get("customer") || "-";

  return (
    <section className="dc-payment-outcome">
      <div className="dc-payment-outcome-card">
        <h2>결제가 정상적으로 완료되었습니다.</h2>
        <dl>
          <div>
            <dt>예약 ID</dt>
            <dd>{orderId}</dd>
          </div>
          <div>
            <dt>결제 금액</dt>
            <dd>{formatAmount(amount)}</dd>
          </div>
          <div>
            <dt>예약자</dt>
            <dd>{customerName}</dd>
          </div>
        </dl>
        <div className="dc-payment-outcome-actions">
          <button type="button" className="dc-payment-outcome-btn" onClick={onReservationBack}>
            예약 내역 돌아가기
          </button>
          <button type="button" className="dc-payment-outcome-btn-outline" onClick={onHome}>
            처음으로
          </button>
        </div>
      </div>
    </section>
  );
}

export default PaymentSuccessPage;
