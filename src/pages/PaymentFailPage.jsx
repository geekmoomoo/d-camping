import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";

function PaymentFailPage({ onRetry, onHome }) {
  const { search } = useLocation();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const code = params.get("code") || params.get("errorCode");
  const message = params.get("message") || params.get("errorMessage");
  const orderId = params.get("orderId") || params.get("reservationId");

  const summary = message
    ? `${message}${code ? ` (${code})` : ""}`
    : "결제 처리 중 문제가 발생했습니다. 다시 시도해주세요.";

  return (
    <section className="dc-payment-outcome">
      <div className="dc-payment-outcome-card">
        <h2>결제에 실패했습니다.</h2>
        <p className="dc-payment-outcome-error">{summary}</p>
        {orderId && (
          <div className="dc-payment-outcome-meta">예약 ID: {orderId}</div>
        )}
        <div className="dc-payment-outcome-actions">
          <button type="button" className="dc-payment-outcome-btn" onClick={onRetry}>
            다시 결제 시도하기
          </button>
          <button type="button" className="dc-payment-outcome-btn-outline" onClick={onHome}>
            처음으로
          </button>
        </div>
      </div>
    </section>
  );
}

export default PaymentFailPage;
