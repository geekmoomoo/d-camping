import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

const STORAGE_KEY = "dcamp.pendingReservation";

function formatAmount(value) {
  if (value == null || Number.isNaN(Number(value))) return "-";
  return `${Number(value).toLocaleString()}원`;
}

function PaymentSuccessPage({ onReservationBack, onHome }) {
  const { search } = useLocation();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const orderId = params.get("orderId") || params.get("reservationId");
  const paymentKey = params.get("paymentKey");

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId || !paymentKey) {
      setError("유효한 결제 정보가 없습니다.");
      setLoading(false);
      return;
    }

    const pending = sessionStorage.getItem(STORAGE_KEY);
    const payload = pending ? JSON.parse(pending) : null;
    if (!payload) {
      setError("예약 정보가 손실되었습니다.");
      setLoading(false);
      return;
    }

    fetch("/api/payments/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount: Number(params.get("amount")) || payload?.quickData?.amount,
        ...payload,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((body) => {
            throw new Error(body.error || "예약 저장에 실패했습니다.");
          });
        }
        return response.json();
      })
      .then((body) => {
        setRecord(body.record || null);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || "예약 저장 중 오류가 발생했습니다.");
      })
      .finally(() => {
        sessionStorage.removeItem(STORAGE_KEY);
        setLoading(false);
      });
  }, [orderId, paymentKey, params]);

  const nights = record?.nights ?? 0;
  const people = record?.people ?? "-";
  const totalAmount = record?.totalAmount ?? record?.payment?.totalAmount ?? 0;
  const request = record?.request;
  const checkIn = record?.checkIn;
  const checkOut = record?.checkOut;

  return (
    <section className="dc-step-card" style={{ padding: "24px" }}>
      <h2 style={{ fontSize: 24, marginBottom: 12 }}>결제가 완료되었습니다</h2>
      {orderId && (
        <p
          style={{
            fontSize: 32,
            fontWeight: 700,
            marginTop: 0,
            marginBottom: 16,
            letterSpacing: "0.05em",
          }}
        >
          예약번호 {orderId}
        </p>
      )}
      {checkIn && checkOut && (
        <p style={{ marginBottom: 8 }}>
          체크인 {checkIn} · 체크아웃 {checkOut}
        </p>
      )}
      {nights > 0 && (
        <p style={{ marginBottom: 8 }}>{nights}박</p>
      )}
      <p style={{ marginBottom: 8 }}>인원 {people}명</p>
      <p style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
        총 결제금액 {formatAmount(totalAmount)}
      </p>
      {request && request.trim() && (
        <p style={{ marginBottom: 16 }}>추가 요청사항: {request}</p>
      )}
      {record?.siteType && (
        <p style={{ marginBottom: 4 }}>사이트 타입: {record.siteType}</p>
      )}
      <div
        className="dc-payment-outcome-actions"
        style={{ marginTop: 20, display: "flex", gap: 12, flexWrap: "wrap" }}
      >
        <button type="button" className="dc-payment-outcome-btn" onClick={onHome}>
          홈으로 돌아가기
        </button>
        <button type="button" className="dc-payment-outcome-btn-outline" onClick={onReservationBack}>
          예약 확인하기
        </button>
      </div>
      {error && !loading && (
        <p className="payment-error-text" style={{ marginTop: 12 }}>
          {error}
        </p>
      )}
      {loading && <p className="dc-payment-notice">예약 정보를 처리하고 있습니다...</p>}
    </section>
  );
}

export default PaymentSuccessPage;
