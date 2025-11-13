import React, { useState } from "react";
import { diffDays, formatDateLabel, toISO } from "../utils/date";
function PaymentConfirmPage({ quickData, site, paymentPayload = {}, onEditReservation }) {
  const [isPreparing, setIsPreparing] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const checkIn = quickData?.checkIn;
  const checkOut = quickData?.checkOut;
  const nights = checkIn && checkOut ? Math.max(diffDays(checkIn, checkOut), 1) : 1;
  const roomRate = site?.price || 0;
  const roomAmount = roomRate * nights;
  const { reservationId, amount, status, userInfo = null, extraCharge = 0 } = paymentPayload || {};
  const totalAmount = typeof amount === "number" ? amount : null;
  const computedTotal = roomAmount + (extraCharge || 0);
  const displayTotal = totalAmount ?? computedTotal;
  const todayISO = toISO(new Date());
  const dDayCount = checkIn ? diffDays(todayISO, checkIn) : null;
  const dDayLabel = dDayCount !== null ? `캠핑 가는 날 D - ${Math.max(0, dDayCount)}` : "";
  const people = quickData?.people || 1;

  const handlePayment = async () => {
    if (isPreparing) return;
    if (!reservationId || totalAmount == null) {
      setPaymentError("예약 정보가 부족합니다. 예약을 다시 확인해주세요.");
      return;
    }
    setPaymentError("");
    setIsPreparing(true);
    try {
      const payload = {
        reservationId,
        amount: totalAmount,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
        customerName: userInfo?.name || "예약자",
        customerEmail: userInfo?.email || "noreply@example.com",
      };
      console.log("[PaymentConfirm] request payload:", payload);

      const res = await fetch("/api/payments/ready", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const rawText = await res.text();
      console.log("[PaymentConfirm] response status:", res.status);
      console.log("[PaymentConfirm] response raw text:", rawText);

      if (!res.ok) {
        alert(`결제 준비 실패 (status: ${res.status})\n${rawText}`);
        return;
      }

      let data;
      try {
        data = JSON.parse(rawText);
      } catch (e) {
        console.error("[PaymentConfirm] JSON parse error:", e);
        alert("결제 준비 응답이 JSON 형식이 아닙니다.");
        return;
      }

      if (!data?.redirectUrl) {
        console.error("[PaymentConfirm] redirectUrl 누락:", data);
        alert("결제 페이지 주소(redirectUrl)를 받지 못했습니다.");
        return;
      }

      console.log("[PaymentConfirm] redirect to:", data.redirectUrl);
      window.location.href = data.redirectUrl;
    } catch (err) {
      console.error("[PaymentConfirm] ERROR:", err);
      setPaymentError("결제 준비 중 알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsPreparing(false);
    }
  };

  const checkInLabel = checkIn ? formatDateLabel(checkIn) : "-";
  const checkOutLabel = checkOut ? formatDateLabel(checkOut) : "-";

  return (
    <div className="dc-payment-page">
      <section className="dc-payment-section">
        <div className="dc-section-heading">
          <h3>상품 소개</h3>
          <span className="dc-section-sub">{site?.zone || "선택된 장소"}</span>
        </div>
        <p className="dc-payment-site-name">
          {site?.name?.replace(/(?:\r\n|\n)/g, " ") || "캠핑 예약"}
        </p>
        <p className="dc-payment-site-note">{site?.carOption || "추가 안내 없음"}</p>
        <div className="dc-payment-date-row">
          <div className="dc-payment-date-card">
            <span>입실</span>
            <strong>{checkInLabel}</strong>
          </div>
          <div className="dc-payment-date-card">
            <span>퇴실</span>
            <strong>{checkOutLabel}</strong>
          </div>
        </div>
        {dDayLabel && <div className="dc-payment-dday">{dDayLabel}</div>}
        {reservationId && (
          <div className="dc-payment-reservation-id">예약번호: {reservationId}</div>
        )}
        {status && (
          <div className="dc-payment-status">예약 상태: {status}</div>
        )}
      </section>

      <section className="dc-payment-section">
        <div className="dc-section-heading">
          <h3>예약 정보</h3>
          <button type="button" className="dc-edit-btn" onClick={onEditReservation}>
            수정
          </button>
        </div>
        <div className="dc-payment-info-grid">
          <p>
            <span>예약자</span>
            <strong>{userInfo?.name || "-"}</strong>
          </p>
          <p>
            <span>연락처</span>
            <strong>{userInfo?.phone || "-"}</strong>
          </p>
          <p>
            <span>이메일</span>
            <strong>{userInfo?.email || "-"}</strong>
          </p>
          <p>
            <span>요청사항</span>
            <strong>{userInfo?.request || "-"}</strong>
          </p>
        </div>
      </section>

      <section className="dc-payment-section">
        <h3>결제 금액</h3>
        <div className="dc-payment-line">
          <span>객실 금액</span>
          <strong>{roomAmount.toLocaleString()}원</strong>
        </div>
        <div className="dc-payment-detail">
          {checkInLabel} ~ {checkOutLabel} · {nights}박
        </div>
        <hr />
        <div className="dc-payment-line">
          <span>현장 결제 금액</span>
          <strong>{extraCharge?.toLocaleString() || "0"}원</strong>
        </div>
        <div className="dc-payment-line total">
          <span>총 결제 금액</span>
          <strong className="dc-payment-online">
            {displayTotal.toLocaleString()}원
          </strong>
        </div>
      </section>

      <section className="dc-payment-section">
        <h3>결제 방법</h3>
        <div className="dc-payment-note">
          <p>결제 API 연동을 위한 준비 중입니다.</p>
        </div>
        <div className="dc-payment-method-grid">
          <button type="button" className="dc-payment-method-btn">
            NPay
          </button>
          <button type="button" className="dc-payment-method-btn">
            PAYCO
          </button>
          <button type="button" className="dc-payment-method-btn">
            신용카드
          </button>
          <button type="button" className="dc-payment-method-btn">
            간편 계좌 결제
          </button>
        </div>
        {paymentError && (
          <div className="payment-error-text" role="alert">
            <p>{paymentError}</p>
            <button
              type="button"
              className="dc-btn-outline"
              onClick={handlePayment}
              disabled={isPreparing}
            >
              다시 시도하기
            </button>
          </div>
        )}
      </section>

      <div className="dc-payment-fixed-bar">
        <button
          type="button"
          className="dc-payment-btn"
          onClick={handlePayment}
          disabled={isPreparing || !reservationId || totalAmount == null}
        >
          {isPreparing ? "결제 페이지로 이동 중..." : "결제하기"}
        </button>
      </div>
    </div>
  );
}

export default PaymentConfirmPage;
