import React, { useEffect, useState } from "react";
import InquiryDetailPage from "./InquiryDetailPage.jsx";
import { fetchInquiries } from "../services/adminInquiryService.js";

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

const STATUS_LABELS = {
  OPEN: "미처리",
  DONE: "처리완료",
};

const truncate = (value, length = 60) => {
  if (!value) return "-";
  return value.length > length ? `${value.slice(0, length)}...` : value;
};

export default function InquiryListPage() {
  const [filters, setFilters] = useState({ status: "", from: "", to: "" });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const payload = await fetchInquiries(filters);
      setItems(payload.items || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "문의 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSearch = () => {
    load();
  };

  const handleSelect = (item) => {
    setSelected(item);
  };

  return (
    <div>
      <div className="dc-card">
        <div className="dc-card-title">문의 관리</div>
        <div className="dc-field" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 160px" }}>
            <label className="dc-field-label">상태</label>
            <select
              className="dc-field-input"
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
            >
              <option value="">전체</option>
              <option value="OPEN">미처리</option>
              <option value="DONE">처리완료</option>
            </select>
          </div>
          <div style={{ flex: "1 1 160px" }}>
            <label className="dc-field-label">접수 시작</label>
            <input
              type="date"
              className="dc-field-input"
              value={filters.from}
              onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value }))}
            />
          </div>
          <div style={{ flex: "1 1 160px" }}>
            <label className="dc-field-label">접수 종료</label>
            <input
              type="date"
              className="dc-field-input"
              value={filters.to}
              onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value }))}
            />
          </div>
          <div style={{ alignSelf: "flex-end" }}>
            <button type="button" className="dc-btn dc-btn-primary" onClick={handleSearch}>
              검색
            </button>
          </div>
        </div>
      </div>
      <div className="dc-card">
        <div className="dc-card-title">
          <span>문의 목록</span>
          <span className="dc-status-text">
            총 {items.length}건
          </span>
        </div>
        {loading && <p className="dc-status-text">불러오는 중...</p>}
        {error && <p className="dc-status-text">{error}</p>}
        {!loading && !error && items.length === 0 && (
          <p className="dc-status-text">문의가 없습니다.</p>
        )}
        {items.length > 0 && (
          <div className="dc-table-wrap">
            <table className="dc-table">
              <thead>
                <tr>
                  <th>접수일시</th>
                  <th>이름</th>
                  <th>연락처</th>
                  <th>문의 내용</th>
                  <th>상태</th>
                  <th>상세</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{formatDateTime(item.createdAt)}</td>
                    <td>{item.name || "-"}</td>
                    <td>{item.phone || "-"}</td>
                    <td title={item.message || ""}>{truncate(item.message)}</td>
                    <td>{STATUS_LABELS[item.status] || "-"}</td>
                    <td>
                      <button
                        type="button"
                        className="dc-btn dc-btn-outline"
                        onClick={() => handleSelect(item)}
                      >
                        상세 보기
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {selected && (
        <InquiryDetailPage
          inquiry={selected}
          onClose={() => setSelected(null)}
          onSaved={(updated) => {
            setSelected(updated);
            load();
          }}
        />
      )}
    </div>
  );
}
