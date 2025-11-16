import React, { useMemo, useState } from "react";
import { lookupReservation, requestRefund } from "../services/reservationService";

function ReservationLookupPage() {
  const [inputReservationId, setInputReservationId] = useState("");
  const [inputPhone, setInputPhone] = useState("");
  const [verifyStatus, setVerifyStatus] = useState("idle");
  const [verifyMessage, setVerifyMessage] = useState("");
  const [reservation, setReservation] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelMessage, setCancelMessage] = useState("");
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  const statusText = useMemo(() => {
    const status = reservation?.cancelRequest?.status;
    if (!status) return "예약 확인 완료";
    if (status === "REQUESTED") return "취소/환불 요청 중";
    if (status === "COMPLETED") return "취소/환불 완료";
    return "처리 상태 확인 중";
  }, [reservation]);

  const statusClass =
    verifyStatus === "verified" ? "dc-status-success" : "dc-status-error";
  const displayMessage = verifyStatus === "verified" ? statusText : verifyMessage;
  const canSubmitCancel = verifyStatus === "verified";

  const handleVerifyReservation = async () => {
    if (!inputReservationId || !inputPhone) {
      setVerifyStatus("failed");
      setVerifyMessage("예약번호와 전화번호를 입력해 주세요.");
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
        setVerifyMessage("예약 정보를 찾을 수 없습니다.");
        return;
      }
      setReservation(res.reservation);
      setVerifyStatus("verified");
    } catch (err) {
      console.error(err);
      setVerifyStatus("failed");
      setVerifyMessage("예약 조회에 실패했습니다.");
      setReservation(null);
    }
  };

  const handleSubmitCancelRequest = async () => {
    if (!canSubmitCancel || !cancelReason.trim()) return;
    if (!window.confirm("정말 환불 요청을 접수하시겠습니까?")) return;
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
          msg = "전화번호가 일치하지 않습니다.";
        } else if (res.error === "NOT_REFUNDABLE_STATUS") {
          msg = `환불 처리 불가능한 상태입니다. (status: ${res.status})`;
        } else if (res.error === "RESERVATION_NOT_FOUND") {
          msg = "해당 예약을 찾을 수 없습니다.";
        }
        setCancelMessage(msg);
        return;
      }
      setCancelMessage("환불 요청이 정상 접수되었습니다.");
      setCancelReason("");
    } catch (err) {
      console.error(err);
      setCancelMessage("환불 요청 중 오류가 발생했습니다.");
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  return (
    <section className="dc-step-card">
      <h2>예약조회</h2>
      <div className="dc-field">
        <label>예약번호</label>
        <input
          type="text"
          value={inputReservationId}
          onChange={(event) => {
            setInputReservationId(event.target.value);
            setVerifyStatus("idle");
          }}
        />
      </div>
      <div className="dc-field">
        <label>전화번호</label>
        <input
          type="tel"
          value={inputPhone}
          onChange={(event) => {
            setInputPhone(event.target.value);
            setVerifyStatus("idle");
          }}
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
            {isSubmittingCancel ? "요청 처리 중..." : "취소/환불 요청"}
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
