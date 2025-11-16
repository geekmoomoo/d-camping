import React, { useState } from "react";
import { updateInquiry } from "../services/adminInquiryService.js";

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

export default function InquiryDetailPage({
  inquiry,
  onSaved,
  onClose,
}) {
  const [status, setStatus] = useState(inquiry.status || "OPEN");
  const [adminNote, setAdminNote] = useState(inquiry.adminNote || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const result = await updateInquiry({
        id: inquiry.id,
        status,
        adminNote,
      });
      setMessage("저장되었습니다.");
      onSaved?.(result.inquiry);
    } catch (err) {
      console.error(err);
      setMessage(err.message || "저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dc-card">
      <div className="dc-card-title">
        <span>문의 상세</span>
        <button type="button" className="dc-btn dc-btn-outline" onClick={onClose}>
          닫기
        </button>
      </div>
      <div className="dc-detail-grid">
        <div>
          <p className="dc-detail-label">이름</p>
          <p>{inquiry.name || "-"}</p>
        </div>
        <div>
          <p className="dc-detail-label">연락처</p>
          <p>{inquiry.phone || "-"}</p>
        </div>
        <div>
          <p className="dc-detail-label">접수일시</p>
          <p>{formatDateTime(inquiry.createdAt)}</p>
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <p className="dc-detail-label">문의 내용</p>
          <p style={{ whiteSpace: "pre-wrap" }}>{inquiry.message || "-"}</p>
        </div>
      </div>
      <div className="dc-field" style={{ marginTop: 12 }}>
        <label className="dc-field-label">상태</label>
        <select
          className="dc-field-input"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="OPEN">미처리</option>
          <option value="DONE">처리완료</option>
        </select>
      </div>
      <div className="dc-field" style={{ marginTop: 12 }}>
        <label className="dc-field-label">관리자 메모</label>
        <textarea
          className="dc-field-input"
          rows={3}
          value={adminNote}
          onChange={(e) => setAdminNote(e.target.value)}
        />
      </div>
      <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
        <button
          type="button"
          className="dc-btn dc-btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "저장 중..." : "저장"}
        </button>
        {message && <span className="dc-status-text">{message}</span>}
      </div>
    </div>
  );
}
