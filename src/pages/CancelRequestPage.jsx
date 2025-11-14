import React, { useState } from "react";
import { requestCancel } from "../services/reservationService";

function CancelRequestPage() {
  const [form, setForm] = useState({
    reservationId: "",
    name: "",
    phone: "",
    bank: "",
    holder: "",
    account: "",
    reason: "",
  });
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setStatusMessage("요청을 접수 중입니다...");
    await requestCancel({
      reservationId: form.reservationId,
      name: form.name,
      phone: form.phone,
      bankInfo: {
        bank: form.bank,
        account: form.account,
        holder: form.holder,
      },
      reason: form.reason,
    });
    setStatusMessage("취소/환불 요청이 접수되었습니다.");
    setLoading(false);
  };

  return (
    <section className="dc-step-card">
      <h2>취소/환불 요청</h2>
      <div className="dc-field">
        <label>예약번호</label>
        <input value={form.reservationId} onChange={(event) => handleChange("reservationId", event.target.value)} />
      </div>
      <div className="dc-field">
        <label>이름</label>
        <input value={form.name} onChange={(event) => handleChange("name", event.target.value)} />
      </div>
      <div className="dc-field">
        <label>연락처</label>
        <input value={form.phone} onChange={(event) => handleChange("phone", event.target.value)} />
      </div>
      <div className="dc-field">
        <label>환불받을 계좌 정보</label>
        <input
          placeholder="은행명"
          value={form.bank}
          onChange={(event) => handleChange("bank", event.target.value)}
        />
        <input
          placeholder="예금주"
          value={form.holder}
          onChange={(event) => handleChange("holder", event.target.value)}
        />
        <input
          placeholder="계좌번호"
          value={form.account}
          onChange={(event) => handleChange("account", event.target.value)}
        />
      </div>
      <div className="dc-field">
        <label>취소/환불 사유</label>
        <textarea
          value={form.reason}
          onChange={(event) => handleChange("reason", event.target.value)}
        />
      </div>
      <button type="button" className="dc-btn-primary" onClick={handleSubmit} disabled={loading}>
        {loading ? "요청 전송중..." : "취소/환불 요청 보내기"}
      </button>
      {statusMessage && <p className="dc-status-text">{statusMessage}</p>}
    </section>
  );
}

export default CancelRequestPage;
