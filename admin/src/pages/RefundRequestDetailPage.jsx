import React, { useMemo, useState } from "react";

import { API_BASE } from "../config/api";

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const computePolicy = (daysBefore) => {
  if (daysBefore === null || daysBefore === undefined) return "-";
  if (daysBefore >= 15) return "S";
  if (daysBefore >= 7) return "W";
  if (daysBefore >= 3) return "C";
  return "U";
};

const getNights = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return "-";
  const start = new Date(`${checkIn}T00:00:00`);
  const end = new Date(`${checkOut}T00:00:00`);
  const diff = Math.max(end.getTime() - start.getTime(), 0);
  const nights = Math.round(diff / (1000 * 60 * 60 * 24));
  return nights > 0 ? `${nights}박` : "-";
};

export default function RefundRequestDetailPage({
  request,
  adminNote,
  onAdminNoteChange,
  onClose,
  onActionComplete,
}) {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const policyResult = useMemo(
    () => computePolicy(request.daysBeforeCheckIn),
    [request.daysBeforeCheckIn]
  );

  const handleAction = async (status) => {
    if (!request?.reservationId) return;
    setIsSubmitting(true);
    setMessage("");
    try {
      const res = await fetch(`${API_BASE}/admin/refund-requests/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId: request.reservationId,
          status,
          adminNote: adminNote || "",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "처리 중 오류가 발생했습니다.");
      }
      setMessage("처리가 완료되었습니다.");
      onActionComplete?.();
    } catch (err) {
      console.error(err);
      setMessage(err.message || "처리 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dc-card" style={{ marginTop: 18 }}>
      <div className="dc-card-title">
        환불 요청 상세
        <button
          type="button"
          className="dc-btn dc-btn-outline"
          onClick={onClose}
          style={{ marginLeft: "auto" }}
        >
          닫기
        </button>
      </div>
      <div className="dc-detail-grid">
        <div>
          <p className="dc-detail-label">예약번호</p>
          <p>{request.reservationId}</p>
        </div>
        <div>
          <p className="dc-detail-label">사이트</p>
          <p>
            {request.siteName || request.siteId || "-"}
            {request.zone ? ` (${request.zone})` : ""}
          </p>
        </div>
        <div>
          <p className="dc-detail-label">체크인 / 체크아웃</p>
          <p>
            {formatDate(request.checkIn)} / {formatDate(request.checkOut)}
          </p>
        </div>
        <div>
          <p className="dc-detail-label">박수</p>
          <p>{getNights(request.checkIn, request.checkOut)}</p>
        </div>
        <div>
          <p className="dc-detail-label">인원</p>
          <p>{request.people ?? "-"}</p>
        </div>
        <div>
          <p className="dc-detail-label">금액 구성</p>
          <p>
            {request.amountBreakdown?.baseAmount
              ? `기본 ${request.amountBreakdown.baseAmount.toLocaleString()}원`
              : "기본 -"}
            <br />
            {request.amountBreakdown?.totalAmount
              ? `총 ${request.amountBreakdown.totalAmount.toLocaleString()}원`
              : request.amount
              ? `총 ${request.amount.toLocaleString()}원`
              : "총 -"}
          </p>
        </div>
        <div>
          <p className="dc-detail-label">요청일시</p>
          <p>{formatDateTime(request.requestedAt)}</p>
        </div>
        <div>
          <p className="dc-detail-label">체크인까지 남은 일수</p>
          <p>
            {typeof request.daysBeforeCheckIn === "number"
              ? `${request.daysBeforeCheckIn}일`
              : "-"}
          </p>
        </div>
        <div>
          <p className="dc-detail-label">사유</p>
          <p>{request.reason || "-"}</p>
        </div>
        <div>
          <p className="dc-detail-label">정책 결과</p>
          <p>{policyResult}</p>
        </div>
      </div>
      <div className="dc-detail-note">
        <p className="dc-detail-label">관리자 메모</p>
        <textarea
          className="dc-textarea"
          placeholder="추가 메모를 입력하세요."
          value={adminNote}
          onChange={(event) => onAdminNoteChange?.(event.target.value)}
          rows={3}
        />
      </div>
      <div className="dc-qb-actions dc-qb-actions-full" style={{ marginTop: 12 }}>
        <button
          type="button"
          className="dc-btn-primary"
          onClick={() => handleAction("COMPLETED")}
          disabled={isSubmitting}
        >
          환불 완료 처리
        </button>
        <button
          type="button"
          className="dc-btn-outline"
          onClick={() => handleAction("ON_HOLD")}
          disabled={isSubmitting}
        >
          보류
        </button>
        <button
          type="button"
          className="dc-btn dc-btn-outline"
          onClick={() => handleAction("REQUESTED")}
          disabled={isSubmitting}
        >
          메모 저장
        </button>
      </div>
      {message && (
        <p className="dc-status-text" style={{ marginTop: 12 }}>
          {message}
        </p>
      )}
    </div>
  );
}
