import React, { useMemo, useState } from "react";
import {
  lookupReservation,
  requestRefund,
} from "../services/reservationService";

function ReservationLookupPage() {
  const [inputReservationId, setInputReservationId] = useState("");
  const [inputPhone, setInputPhone] = useState("");
  const [verifyStatus, setVerifyStatus] = useState("idle");
  const [cancelReason, setCancelReason] = useState("");
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState("");
  const [cancelMessage, setCancelMessage] = useState("");
  const [reservation, setReservation] = useState(null);

  const statusText = useMemo(() => {
    const status = reservation?.cancelRequest?.status;
    if (!status) return "예약자 확인 문었";
    if (status === "REQUESTED") return "취소/환불 진행중";
    if (status === "COMPLETED") return "취소/환불 완료";
    return "예약자 확인 문었";
  }, [reservation]);

  const displayMessage = verifyStatus === "verified" ? statusText : verifyMessage;
  const statusClass =
    verifyStatus === "verified" ? "dc-status-success" : "dc-status-error";
  const canSubmitCancel =
    verifyStatus === "verified" && statusText === "예약자 확인 완료";

  const handleVerifyReservation = async () => {
    if (!inputReservationId || !inputPhone) {
      setVerifyMessage("예약번호와 연락처를 입력해주세요.");
      setVerifyStatus("failed");
      return;
    }
    setVerifyStatus("verifying");
    setVerifyMessage("");
    setCancelMessage("");
    try {
      const res = await lookupReservation({
        reservationId: inputReservationId,
        phone: inputPhone,
      });

      if (!res.reservation) {
        setVerifyStatus("failed");
        setReservation(null);
        setVerifyMessage("����Ȯ�κҰ� / ���ǿ��");
        return;
      }
      setReservation(res.reservation);
      setVerifyStatus("verified");
      setVerifyMessage("");
    } catch (err) {
      console.error(err);
      setVerifyStatus("failed");
      setVerifyMessage("����Ȯ�κҰ� / ���ǿ��");
      setReservation(null);
    }
    if (verifyStatus !== "verified" || !inputReservationId || !inputPhone) {
      return;
    }
    if (!cancelReason.trim()) return;

    if (!window.confirm("정말로 취소/환불 요청을 보내시겠습니까?")) {
      return;
    }

    setIsSubmittingCancel(true);
    setCancelMessage("");

    try {
      const res = await requestRefund({
        reservationId: inputReservationId,
        phone: inputPhone,
        reason: cancelReason,
        causeType: "GUEST",
      });

      if (res.error) {
        let msg = "환불 요청 처리 중 오류가 발생했습니다.";
        if (res.error === "PHONE_MISMATCH") {
          msg = "예약 시 입력한 연락처와 일치하지 않습니다.";
        } else if (res.error === "NOT_REFUNDABLE_STATUS") {
          msg = `현재 상태에서는 환불 요청이 불가능합니다. (status: ${res.status})`;
        } else if (res.error === "RESERVATION_NOT_FOUND") {
          msg = "예약 정보를 찾을 수 없습니다.";
        }
        setCancelMessage(msg);
        return;
      }

      setCancelMessage("취소/환불 요청이 정상적으로 접수되었습니다.");
      setCancelReason("");
    } catch (err) {
      console.error(err);
      setCancelMessage("서버와 통신 중 오류가 발생했습니다.");
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  return (
    <section className="dc-step-card">
      <h2>취소/환불 요청</h2>

      <div className="dc-field">
        <label>예약번호</label>
        <input
          type="text"
          value={inputReservationId}
          onChange={(event) => { setInputReservationId(event.target.value); setVerifyStatus("idle"); }}
        />
      </div>

      <div className="dc-field">
        <label>연락처</label>
        <input
          type="tel"
          value={inputPhone}
          onChange={(event) => { setInputPhone(event.target.value); setVerifyStatus("idle"); }}
        />
      </div>

      <button
        type="button"
        className="dc-btn-primary"
        onClick={handleVerifyReservation}
        disabled={verifyStatus === "verifying"}
      >
        예약자 확인
      </button>

      {displayMessage && (
        <p className={`dc-status-text ${statusClass}`}>{displayMessage}</p>
      )}

      {canSubmitCancel && (
        <section className="cancel-request-section">
          <textarea
            className="dc-textarea"
            placeholder="취소/환불 사유를 입력해 주세요."
            value={cancelReason}
            onChange={(event) => setCancelReason(event.target.value)}
            rows={3}
          />
          <button
            type="button"
            className="dc-btn dc-btn-outline w-full mt-2"
            onClick={handleSubmitCancelRequest}
            disabled={
              isSubmittingCancel ||
              !cancelReason.trim() ||
              !canSubmitCancel
            }
          >
            {isSubmittingCancel ? "요청 접수 중..." : "취소/환불 요청하기"}
          </button>
          {cancelMessage && (
            <p className="dc-date-error mt-1">{cancelMessage}</p>
          )}
        </section>
      )}
    </section>
  );
}

export default ReservationLookupPage;

