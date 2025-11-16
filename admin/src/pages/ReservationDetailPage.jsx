import React, { useState } from "react";
import {
  updateReservationStatus,
  addReservationNote,
} from "../services/reservationAdminService.js";

const formatDateTime = (value) => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
};

const formatDate = (value) => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return "-";
  }
};

const formatCurrency = (value) => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return "-";
  return `${Number(value).toLocaleString()}원`;
};

const renderQA = (qa) => {
  if (!qa || typeof qa !== "object") return null;
  const entries = Array.isArray(qa)
    ? qa.map((item, index) => [`Q${index + 1}`, item])
    : Object.entries(qa);
  if (!entries.length) return null;
  return entries.map(([key, value]) => (
    <div key={key}>
      <strong>{key}:</strong> {value ?? "-"}
    </div>
  ));
};

const renderAgree = (agree) => {
  if (!agree || typeof agree !== "object") return null;
  const entries = Object.entries(agree);
  if (!entries.length) return null;
  return entries.map(([key, value]) => (
    <div key={key}>
      <strong>{key}:</strong> {value ? "동의함" : "동의하지 않음"}
    </div>
  ));
};

const statusBadge = (status) => {
  const colorMap = {
    PAID: "#22c55e",
    PENDING: "#fb923c",
    REFUND: "#f87171",
    COMPLETED: "#0ea5e9",
    CANCELED: "#f97316",
    NO_SHOW: "#f43f5e",
    REFUNDED: "#8b5cf6",
  };
  const color = colorMap[status] || "#94a3b8";
  return (
    <span
      className="dc-tag"
      style={{
        background: color,
        color: "#020617",
        marginLeft: 8,
        padding: "4px 8px",
        borderRadius: 999,
        fontSize: "0.8rem",
      }}
    >
      {status || "UNKNOWN"}
    </span>
  );
};

const trimValue = (value) => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }
  return value || null;
};

const PRE_CHECK_LABELS = {
  people: "인원",
  onsite: "현장 결제",
  qa: "질문",
  agree: "동의",
  refund: "환불",
};

const PRE_CHECK_ORDER = ["people", "onsite", "qa", "agree", "refund"];

export default function ReservationDetailPage({ reservation, onBack }) {
  if (!reservation) {
    return (
      <div className="dc-card">
        <p className="dc-status-text">예약 정보를 불러오지 못했습니다.</p>
        <button type="button" className="dc-btn-outline" onClick={onBack}>
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  const userInfo = reservation.userInfo ?? {};
  const qaSection = renderQA(reservation.qa);
  const agreeSection = renderAgree(reservation.agree);
  const status = reservation.status || reservation.quickData?.status || "-";
  const [currentStatus, setCurrentStatus] = useState(status);
  const [pendingStatus, setPendingStatus] = useState(status);
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const [noteText, setNoteText] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteMessage, setNoteMessage] = useState("");
  const [notes, setNotes] = useState(reservation.adminNotes ?? []);

  const preCheckFlags = reservation.preCheckFlags || {};
  const activePreChecks = PRE_CHECK_ORDER.map((key) => ({
    key,
    label: PRE_CHECK_LABELS[key],
    flag: preCheckFlags[key],
  })).filter((item) => item.flag?.active);

  const phone =
    trimValue(reservation.userPhone) ||
    trimValue(userInfo.phone) ||
    trimValue(userInfo.userPhone) ||
    "-";

  const amountBreakdown = reservation.amountBreakdown || {};
  const baseAmount = amountBreakdown.baseAmount ?? 0;
  const extraPersonAmount = amountBreakdown.extraPersonAmount ?? 0;
  const manualExtra =
    amountBreakdown.manualExtra ?? reservation.manualExtra ?? 0;
  const extraCharge =
    reservation.extraCharge ?? amountBreakdown.onsiteAmount ?? 0;
  const onlineTotal =
    amountBreakdown.total ??
    reservation.totalAmount ??
    reservation.quickData?.totalAmount ??
    baseAmount + extraPersonAmount + manualExtra;
  const finalTotal = onlineTotal + extraCharge;

  const cancel = reservation.cancelRequest || {};
  const refundStatus = cancel.status || "-";
  const refundReason = cancel.reason || "-";
  const refundDays =
    typeof cancel.daysBeforeCheckIn === "number"
      ? `${cancel.daysBeforeCheckIn}일`
      : "-";
  const refundRequestedAt = cancel.requestedAt
    ? formatDateTime(cancel.requestedAt)
    : "-";
  const refundAdminNote = cancel.adminNote || "-";

  const handleStatusSave = async () => {
    if (!reservation?.reservationId || !pendingStatus) return;
    setStatusSaving(true);
    setStatusMessage("");
    try {
      const result = await updateReservationStatus(
        reservation.reservationId,
        pendingStatus
      );
      const updated = result?.reservation;
      const nextStatus = updated?.status || pendingStatus;
      setCurrentStatus(nextStatus);
      setPendingStatus(nextStatus);
      setStatusMessage("상태가 저장되었습니다.");
    } catch (error) {
      console.error(error);
      setStatusMessage("상태 저장 중 오류가 발생했습니다.");
    } finally {
      setStatusSaving(false);
    }
  };

  const handleNoteSave = async () => {
    if (!reservation?.reservationId || !noteText.trim()) return;
    setNoteSaving(true);
    setNoteMessage("");
    try {
      const operator = "admin";
      const result = await addReservationNote(
        reservation.reservationId,
        noteText.trim(),
        operator
      );
      const updated = result?.reservation;
      if (updated?.adminNotes) {
        setNotes(updated.adminNotes);
      }
      setNoteText("");
      setNoteMessage("관리자 메모가 저장되었습니다.");
    } catch (error) {
      console.error(error);
      setNoteMessage("메모 저장 중 오류가 발생했습니다.");
    } finally {
      setNoteSaving(false);
    }
  };

  return (
    <div className="dc-card">
      <div
        className="dc-card-title"
        style={{ display: "flex", alignItems: "center", gap: 12 }}
      >
        <button
          type="button"
          className="dc-btn dc-btn-link"
          onClick={onBack}
          style={{ padding: "4px 8px" }}
        >
          &larr; 목록으로
        </button>
        <strong>예약 상세</strong>
      </div>
      <div className="dc-card-grid">
        <section className="dc-card">
          <h3 className="dc-card-title">예약 요약</h3>
          <p>예약번호: {reservation.reservationId || "-"}</p>
          <div className="dc-status-row">
            <span className="dc-status-label">상태:</span>
            {currentStatus !== "-" ? statusBadge(currentStatus) : <span>-</span>}
          </div>
          <div className="dc-field" style={{ marginTop: 8 }}>
            <label className="dc-field-label">상태 변경</label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select
                className="dc-field-input"
                value={pendingStatus}
                onChange={(e) => setPendingStatus(e.target.value)}
              >
                <option value="PENDING">PENDING</option>
                <option value="PAID">PAID</option>
                <option value="CANCELED">CANCELED</option>
                <option value="NO_SHOW">NO_SHOW</option>
                <option value="REFUNDED">REFUNDED</option>
              </select>
              <button
                type="button"
                className="dc-btn dc-btn-primary"
                onClick={handleStatusSave}
                disabled={statusSaving || !pendingStatus}
              >
                {statusSaving ? "저장 중..." : "상태 저장"}
              </button>
            </div>
            {statusMessage && (
              <p className="dc-status-text" style={{ marginTop: 4 }}>
                {statusMessage}
              </p>
            )}
          </div>
          <p>생성일: {formatDateTime(reservation.createdAt)}</p>
          <p>수정일: {formatDateTime(reservation.updatedAt)}</p>
        </section>
        <section className="dc-card">
          <h3 className="dc-card-title">사전 체크 요약</h3>
          {activePreChecks.length === 0 ? (
            <p className="dc-status-text">체크 필요 항목이 없습니다.</p>
          ) : (
            activePreChecks.map(({ key, label, flag }) => (
              <p key={key} style={{ marginBottom: 4 }}>
                • {label}: {flag?.message || "확인 필요"}
              </p>
            ))
          )}
        </section>

        <section className="dc-card">
          <h3 className="dc-card-title">고객 정보</h3>
          <p>이름: {reservation.userName || userInfo.name || "-"}</p>
          <p>연락처: {phone}</p>
          <p>이메일: {userInfo.email || "-"}</p>
          <p>차량번호: {userInfo.carNumber || "-"}</p>
          <p>메모: {userInfo.note || "-"}</p>
        </section>

        <section className="dc-card">
          <h3 className="dc-card-title">이용 정보</h3>
          <p>
            사이트: {reservation.siteId || "-"} (
            {reservation.siteName || reservation.zone || "-"})
          </p>
          <p>
            기간: {formatDate(reservation.checkIn)} ~ {formatDate(reservation.checkOut)}
          </p>
          <p>박수: {reservation.nights ?? "-"}</p>
          <p>인원: {reservation.people ?? "-"}</p>
        </section>

        <section className="dc-card">
          <h3 className="dc-card-title">금액 정보</h3>
          <p>기본금액: {formatCurrency(baseAmount)}</p>
          <p>추가 인원: {formatCurrency(extraPersonAmount)}</p>
          <p>현장 결제(기타 수수료): {formatCurrency(extraCharge)}</p>
          <p>수동 조정: {formatCurrency(manualExtra)}</p>
          <p className="dc-card-subtitle">합계: {formatCurrency(finalTotal)}</p>
        </section>

        <section className="dc-card">
          <h3 className="dc-card-title">환불/취소 정보</h3>
          <p>환불 상태: {refundStatus}</p>
          <p>사유: {refundReason}</p>
          <p>남은 일수: {refundDays}</p>
          <p>요청일시: {refundRequestedAt}</p>
          <p>관리자 메모: {refundAdminNote}</p>
        </section>

        <section className="dc-card">
          <h3 className="dc-card-title">관리자 메모</h3>
          <textarea
            className="dc-field-input"
            rows={3}
            placeholder="운영 메모를 입력하세요."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
          />
          <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
            <button
              type="button"
              className="dc-btn dc-btn-primary"
              onClick={handleNoteSave}
              disabled={noteSaving || !noteText.trim()}
            >
              {noteSaving ? "저장 중..." : "메모 저장"}
            </button>
            {noteMessage && <p className="dc-status-text">{noteMessage}</p>}
          </div>
          {notes.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <h4 className="dc-card-subtitle">메모 히스토리</h4>
              <ul className="dc-note-list">
                {notes
                  .slice()
                  .sort((a, b) => (a.at || "").localeCompare(b.at || ""))
                  .map((note, index) => (
                    <li key={index}>
                      <div>
                        <strong>{note.operator || "admin"}</strong> · {note.at ? formatDateTime(note.at) : "-"}
                      </div>
                      <div>{note.note || "-"}</div>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </section>

        {(qaSection || agreeSection) && (
          <section className="dc-card">
            <h3 className="dc-card-title">질문/답변 · 약관</h3>
            {qaSection ? (
              <div>
                <h4 className="dc-card-subtitle">질문/답변</h4>
                {qaSection}
              </div>
            ) : (
              <p className="dc-status-text">질문/답변 기록이 없습니다.</p>
            )}
            {agreeSection ? (
              <div style={{ marginTop: 12 }}>
                <h4 className="dc-card-subtitle">약관 동의</h4>
                {agreeSection}
              </div>
            ) : (
              <p className="dc-status-text">약관 동의 기록이 없습니다.</p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
