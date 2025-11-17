import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { API_BASE } from "../config/api";

function formatAmount(value) {
  if (value == null || Number.isNaN(Number(value))) return "-";
  return `${Number(value).toLocaleString()}원`;
}

const SUCCESS_STATUSES = new Set(["PAID", "DONE", "SUCCESS"]);

function PaymentSuccessPage({ onReservationBack, onHome }) {
  const [searchParams] = useSearchParams();
  const orderId =
    searchParams.get("orderId") || searchParams.get("reservationId");
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmError, setConfirmError] = useState("");
  const confirmedRef = useRef(false);
  const [pollAttempts, setPollAttempts] = useState(0);
  const cancelledRef = useRef(false);

  const fetchReservation = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${API_BASE}/reservations/${encodeURIComponent(orderId)}`
      );
      if (!response.ok) {
        throw new Error("예약 정보를 불러오는 데 실패했습니다.");
      }
      const data = await response.json();
      if (!cancelledRef.current) {
        setReservation(data);
      }
    } catch (err) {
      console.error("[PaymentSuccess] reservation fetch failed", err);
      if (!cancelledRef.current) {
        setError("예약 정보를 불러오는 데 실패했습니다.");
        setReservation(null);
      }
    } finally {
      if (!cancelledRef.current) {
        setLoading(false);
      }
    }
  }, [orderId]);

  useEffect(() => {
    cancelledRef.current = false;
    setPollAttempts(0);
    if (!orderId) {
      setError("예약 정보를 불러오는 데 실패했습니다.");
      setLoading(false);
      return;
    }
    fetchReservation();
    return () => {
      cancelledRef.current = true;
    };
  }, [fetchReservation, orderId]);

  useEffect(() => {
    if (!orderId || confirmedRef.current) return;
    const paymentKey = searchParams.get("paymentKey");
    if (!paymentKey) {
      setConfirmError("결제 확인 정보를 찾을 수 없습니다.");
      return;
    }
    const amountParam = Number(searchParams.get("amount"));
    const payload = {
      paymentKey,
      orderId,
    };
    if (!Number.isNaN(amountParam) && amountParam > 0) {
      payload.amount = amountParam;
    }
    const runConfirm = async () => {
      setConfirmLoading(true);
      setConfirmError("");
      try {
      const response = await fetch(`${API_BASE}/payments/confirm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          if (response.status === 409 && body?.error === "ALREADY_RESERVED") {
            throw new Error(
              body.message ||
                "해당 기간에는 이미 예약이 완료된 사이트입니다. 다른 날짜나 사이트를 선택해 주세요."
            );
          }
          throw new Error(
            body.message || "결제 확인에 실패했습니다. 다시 시도해 주세요."
          );
        }
        await response.json().catch(() => ({}));
        confirmedRef.current = true;
        fetchReservation();
      } catch (err) {
        console.error("[PaymentSuccess] confirm error", err);
        setConfirmError(err.message || "결제 확인에 실패했습니다.");
      } finally {
        setConfirmLoading(false);
      }
    };
    runConfirm();
  }, [orderId, searchParams, fetchReservation]);

  useEffect(() => {
    const normalized = (reservation?.status ?? "").toUpperCase();
    const isSuccess = SUCCESS_STATUSES.has(normalized);
    if (!reservation || isSuccess || pollAttempts >= 5 || !orderId) {
      return;
    }
    const timer = setTimeout(() => {
      fetchReservation();
      setPollAttempts((prev) => prev + 1);
    }, 2000);
    return () => clearTimeout(timer);
  }, [fetchReservation, orderId, pollAttempts, reservation]);
  
  const displayReservationId = reservation?.reservationId || orderId || "-";
  const people = reservation?.people ?? "-";
  const totalAmount = reservation?.totalAmount ?? 0;
  const checkIn = reservation?.checkIn;
  const checkOut = reservation?.checkOut;
  const request = reservation?.request;
  const siteName = reservation?.siteName || reservation?.site?.name;
  const siteType = reservation?.siteType;
  const siteZone = reservation?.siteZone;
  const statusText = reservation?.status;
  const normalizedStatus = statusText?.toUpperCase?.() ?? "";
  const isSuccessStatus = SUCCESS_STATUSES.has(normalizedStatus);
  const statusWarningMessage =
    !loading && reservation && !isSuccessStatus
      ? normalizedStatus === "PENDING"
        ? "[S008] 기존 요청을 처리중입니다."
        : `예약 상태: ${statusText || "UNKNOWN"}`
      : "";

  return (
    <section className="dc-step-card" style={{ padding: "24px" }}>
      <h2 style={{ fontSize: 24, marginBottom: 12 }}>결제가 완료되었습니다</h2>
      {displayReservationId && (
        <p
          style={{
            fontSize: 32,
            fontWeight: 700,
            marginTop: 0,
            marginBottom: 16,
            letterSpacing: "0.05em",
          }}
        >
          예약번호 {displayReservationId}
        </p>
      )}
      {checkIn && checkOut && (
        <p style={{ marginBottom: 8 }}>
          체크인 {checkIn} · 체크아웃 {checkOut}
        </p>
      )}
      {reservation?.nights > 0 && (
        <p style={{ marginBottom: 8 }}>{reservation?.nights}박</p>
      )}
      {siteName && (
        <p style={{ marginBottom: 8 }}>예약 위치: {siteName}</p>
      )}
      {siteType && (
        <p style={{ marginBottom: 4 }}>사이트 유형: {siteType}</p>
      )}
      {siteZone && (
        <p style={{ marginBottom: 4 }}>위치 구역: {siteZone}</p>
      )}
      <p style={{ marginBottom: 8 }}>총인원 · {people}명</p>
      <p style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
        최종 결제 금액 {formatAmount(totalAmount)}
      </p>
      <p style={{ marginBottom: 8 }}>
        현장에서 결제할 금액 {formatAmount(reservation?.extraCharge ?? 0)}
      </p>
      {request && request.trim() && (
        <p style={{ marginBottom: 16 }}>추가 요청 사항: {request}</p>
      )}

      <div
        className="dc-payment-outcome-actions"
        style={{ marginTop: 20, display: "flex", gap: 12, flexWrap: "wrap" }}
      >
        <button type="button" className="dc-payment-outcome-btn" onClick={onHome}>
          홈으로
        </button>
        <button
          type="button"
          className="dc-payment-outcome-btn-outline"
          onClick={onReservationBack}
        >
          예약 확인하기
        </button>
      </div>
      {confirmLoading && (
        <p className="dc-payment-notice">
          결제 정보를 확인 중입니다...
        </p>
      )}
      {confirmError && (
        <p className="payment-error-text" style={{ marginTop: 12 }}>
          {confirmError}
        </p>
      )}
      {statusWarningMessage && !loading && (
        <p className="payment-error-text" style={{ marginTop: 12 }}>
          {statusWarningMessage}
        </p>
      )}
      {error && !loading && !statusWarningMessage && !confirmError && (
        <p className="payment-error-text" style={{ marginTop: 12 }}>
          {error}
        </p>
      )}
      {loading && (
        <p className="dc-payment-notice">예약 정보를 불러오는 중입니다...</p>
      )}
    </section>
  );
}

export default PaymentSuccessPage;
