import React, { useState } from "react";
import { searchReservationsByPhone } from "../api/client";

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function ReservationLookupPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setResult(null);

    const trimmedPhone = String(phone || "").replace(/[-\s]/g, "");

    if (!trimmedPhone) {
      setErrorMsg("휴대폰 번호를 입력해주세요.");
      return;
    }

    try {
      setIsLoading(true);
      const data = await searchReservationsByPhone(trimmedPhone);

      const filteredItems = (data.items || []).filter((item) => {
        if (!name) return true;
        const itemName = String(item.customerName || "").trim();
        return itemName.includes(name.trim());
      });

      setResult({
        total: filteredItems.length,
        items: filteredItems,
      });
    } catch (err) {
      console.error("[ReservationLookupPage] ERROR:", err);
      setErrorMsg("예약 조회 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: "16px" }}>
      <h2 style={{ marginBottom: "12px", fontSize: "1.1rem" }}>예약확인</h2>

      <form onSubmit={handleSearch} style={{ marginBottom: "16px" }}>
        <div style={{ marginBottom: "8px" }}>
          <label style={{ display: "block", marginBottom: "4px" }}>이름 (선택)</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예약자 이름"
            style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ marginBottom: "8px" }}>
          <label style={{ display: "block", marginBottom: "4px" }}>
            휴대폰 번호 (필수)
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="010-1234-5678"
            style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "8px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#2d6cdf",
            color: "#ffffff",
            fontSize: "1rem",
            cursor: "pointer",
          }}
        >
          {isLoading ? "조회 중..." : "예약 조회하기"}
        </button>
      </form>

      {errorMsg && (
        <div style={{ color: "red", marginBottom: "8px" }}>{errorMsg}</div>
      )}

      {result && (
        <div>
          {result.total === 0 ? (
            <p>조회된 예약이 없습니다.</p>
          ) : (
            <>
              <p>총 {result.total}건의 예약이 있습니다.</p>
              <ul style={{ listStyle: "none", padding: 0 }}>
                {result.items.map((r) => (
                  <li
                    key={r.id}
                    style={{
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      padding: "10px",
                      marginBottom: "8px",
                      fontSize: "0.9rem",
                    }}
                  >
                    <div>
                      <strong>예약번호</strong> : {r.id}
                    </div>
                    <div>
                      <strong>이름</strong> : {r.customerName}
                    </div>
                    <div>
                      <strong>연락처</strong> : {r.customerPhone}
                    </div>
                    <div>
                      <strong>이용일</strong> : {formatDate(r.checkIn)} ~{" "}
                      {formatDate(r.checkOut)}
                    </div>
                    <div>
                      <strong>사이트</strong> : {r.siteId}
                    </div>
                    <div>
                      <strong>인원</strong> : {r.people}명
                    </div>
                    <div>
                      <strong>금액</strong> :{" "}
                      {(r.totalAmount?.toLocaleString?.() ?? r.totalAmount) || 0}원
                    </div>
                    <div>
                      <strong>상태</strong> : {r.status}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default ReservationLookupPage;
