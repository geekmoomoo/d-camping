import React, { useEffect, useMemo, useState } from "react";
import { diffDays, formatDateLabel, toISO } from "../utils/date";

const PENDING_KEY = "dcamp.pendingReservation";

function PaymentConfirmPage({
  quickData,
  site,
  userInfo = {},
  extraCharge = 0,
  qa = {},
  agree = {},
  people: selectedPeople,
  onEditReservation,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [availability, setAvailability] = useState({
    loading: false,
    available: true,
    message: "",
  });
  const checkIn = quickData?.checkIn;
  const checkOut = quickData?.checkOut;
  const nights =
    checkIn && checkOut ? Math.max(diffDays(checkIn, checkOut), 1) : 1;
  const roomRate = site?.price || 0;
  const roomAmount = roomRate * nights;
  const onlineTotal = roomAmount;
  const onsiteAmount = extraCharge || 0;
  const todayISO = toISO(new Date());
  const dDayCount = checkIn ? diffDays(todayISO, checkIn) : null;
  const dDayLabel =
    dDayCount !== null ? `캠핑 가는 날 D - ${Math.max(0, dDayCount)}` : "";
  const reservationId = quickData?.reservationId || site?.id || "RESERVE";
  const people = (selectedPeople ?? quickData?.people) || 1;
  const options = useMemo(
    () =>
      extraCharge > 0
        ? [{ name: "추가 옵션", amount: Math.round(extraCharge) }]
        : [],
    [extraCharge]
  );

  const persistPending = () => {
    try {
      sessionStorage.setItem(
        PENDING_KEY,
        JSON.stringify({
          quickData,
          selectedSite: site,
          userInfo,
          extraCharge,
          qa,
          agree,
        })
      );
    } catch (err) {
      console.error("sessionStorage error", err);
    }
  };

  const handlePayment = async () => {
    if (!availability.available) {
      setErrorMessage(
        availability.message || "해당 날짜에는 예약이 완료된 사이트입니다."
      );
      return;
    }
    try {
      persistPending();
      setIsLoading(true);
      setErrorMessage("");
      const response = await fetch("/api/payments/ready", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          successUrl: `${window.location.origin}/payment/success`,
          failUrl: `${window.location.origin}/payment/fail`,
          siteId: site?.id,
          checkIn,
          checkOut,
          people,
          extraCharge,
          quickData,
          site,
          userInfo,
          qa,
          agree,
          customerName: userInfo?.name || "예약자",
          customerEmail: userInfo?.email || "noreply@example.com",
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const serverMessage =
          data.error ||
          data.detail?.error ||
          data.message ||
          "결제 준비 요청 실패";
        throw new Error(serverMessage);
      }

      if (!data.checkoutUrl) {
        throw new Error("checkoutUrl이 응답에 없습니다.");
      }

      window.location.href = data.checkoutUrl;
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!site?.id || !checkIn || !checkOut) {
      setAvailability({ loading: false, available: true, message: "" });
      return;
    }
    const controller = new AbortController();
    setAvailability((prev) => ({ ...prev, loading: true }));
    const fetchAvailability = async () => {
      try {
        const params = new URLSearchParams({
          siteId: site.id,
          checkIn,
          checkOut,
        });
        const response = await fetch(
          `/api/reservations/availability?${params.toString()}`,
          { signal: controller.signal }
        );
        if (!response.ok) {
          throw new Error("예약 가능 여부를 확인할 수 없습니다.");
        }
        const data = await response.json();
        setAvailability({
          loading: false,
          available: !data.conflict,
          message: data.conflict
            ? "해당 날짜에는 이미 예약이 완료되어 있습니다."
            : "",
        });
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("[PaymentConfirmPage] availability error", err);
        setAvailability((prev) => ({ ...prev, loading: false }));
      }
    };
    fetchAvailability();
    return () => controller.abort();
  }, [site?.id, checkIn, checkOut]);

  const checkInLabel = checkIn ? formatDateLabel(checkIn) : "-";
  const checkOutLabel = checkOut ? formatDateLabel(checkOut) : "-";

  return (
    <div className="dc-payment-page">
      <section className="dc-payment-section">
        <div className="dc-section-heading">
          <h3>상품정보</h3>
          <span className="dc-section-sub">{site?.zone || "선택하신 장소"}</span>
        </div>
        <p className="dc-payment-site-name">
          {site?.name?.replace(/(?:\r\n|\n)/g, " ") || "예약하신 숙소"}
        </p>
        <p className="dc-payment-site-note">{site?.carOption || "추가 안내 없음"}</p>
        <div className="dc-payment-date-row">
          <div className="dc-payment-date-card">
            <span>입실일</span>
            <strong>{checkInLabel}</strong>
          </div>
          <div className="dc-payment-date-card">
            <span>퇴실일</span>
            <strong>{checkOutLabel}</strong>
          </div>
        </div>
        {dDayLabel && <div className="dc-payment-dday">{dDayLabel}</div>}
      </section>

      <section className="dc-payment-section">
        <div className="dc-section-heading">
          <h3>예약자 정보</h3>
          <button type="button" className="dc-edit-btn" onClick={onEditReservation}>
            수정
          </button>
        </div>
        <div className="dc-payment-info-grid">
          <p>
            <span>예약자명</span>
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
          <span>객실 요금</span>
          <strong>{roomAmount.toLocaleString()}원</strong>
        </div>
        <div className="dc-payment-detail">
          {checkInLabel} ~ {checkOutLabel} · {nights}박
        </div>
        <hr />
        <div className="dc-payment-line">
          <span>현장 결제 금액</span>
          <strong>{onsiteAmount.toLocaleString()}원</strong>
        </div>
        <div className="dc-payment-line total">
          <span>온라인 결제 금액</span>
          <strong className="dc-payment-online">
            {onlineTotal.toLocaleString()}원
          </strong>
        </div>

      </section>

      <section className="dc-payment-section">
        <h3>결제 방법</h3>
        <div className="dc-payment-note">
          <p>결제 api 연결필요</p>
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
        {errorMessage && <p className="payment-error-text">{errorMessage}</p>}
        {!availability.available && !errorMessage && (
          <p className="payment-error-text">
            {availability.message || "해당 날짜에는 예약이 완료된 사이트입니다."}
          </p>
        )}
      </section>

      <div className="dc-payment-fixed-bar">
        <button
          type="button"
          className="dc-payment-btn"
          onClick={handlePayment}
          disabled={isLoading}
        >
          {isLoading ? "결제 준비 중..." : "결제하기"}
        </button>
      </div>
    </div>
  );
}

export default PaymentConfirmPage;
