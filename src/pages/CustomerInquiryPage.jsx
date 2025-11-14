import React, { useState } from "react";
import { submitInquiry } from "../services/reservationService";

function CustomerInquiryPage() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    category: "예약 관련",
    message: "",
  });
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setStatus("문의 접수 중...");
    await submitInquiry(form);
    setStatus("문의가 접수되었습니다.");
    setLoading(false);
  };

  return (
    <section className="dc-step-card">
      <h2>고객문의</h2>
      <div className="dc-field">
        <label>이름</label>
        <input value={form.name} onChange={(event) => handleChange("name", event.target.value)} />
      </div>
      <div className="dc-field">
        <label>연락처</label>
        <input value={form.phone} onChange={(event) => handleChange("phone", event.target.value)} />
      </div>
      <div className="dc-field">
        <label>문의 유형</label>
        <select value={form.category} onChange={(event) => handleChange("category", event.target.value)}>
          <option>예약 관련</option>
          <option>시설 관련</option>
          <option>기타</option>
        </select>
      </div>
      <div className="dc-field">
        <label>문의 내용</label>
        <textarea value={form.message} onChange={(event) => handleChange("message", event.target.value)} />
      </div>
      <button type="button" className="dc-btn-primary" onClick={handleSubmit} disabled={loading}>
        {loading ? "전송중..." : "문의 보내기"}
      </button>
      {status && <p className="dc-status-text">{status}</p>}
    </section>
  );
}

export default CustomerInquiryPage;
