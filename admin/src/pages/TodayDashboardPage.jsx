import React, { useEffect, useState } from "react";
import { fetchTodayReservations } from "../services/reservationAdminService.js";

const padDate = (value) => String(value).padStart(2, "0");
const toDateInputValue = (date = new Date()) => {
  const target = new Date(date.getTime());
  return `${target.getFullYear()}-${padDate(target.getMonth() + 1)}-${padDate(
    target.getDate()
  )}`;
};
const formatCurrency = (value) => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    return "-";
  }
  return `${Number(value).toLocaleString()}원`;
};

const ReservationRow = ({ reservation, onSelect }) => {
  const name = reservation.userInfo?.name || reservation.userName || "-";
  const siteLabel = `${reservation.siteId || "-"} (${
    reservation.siteName || reservation.zone || "-"
  })`;
  const people = `${reservation.people ?? "-"}명 / ${reservation.nights ?? "-"}박`;
  const amount =
    reservation.totalAmount ??
    reservation.amountBreakdown?.total ??
    reservation.amountBreakdown?.baseAmount ??
    null;
  const amountLabel = formatCurrency(amount);
  return (
    <div
      className="today-row"
      style={{
        borderTop: "1px solid #e2e8f0",
        padding: "12px 0",
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <strong>{name}</strong>
        <div style={{ fontSize: "0.9rem", color: "#475569" }}>{siteLabel}</div>
        <div style={{ fontSize: "0.85rem", color: "#475569", marginTop: 4 }}>
          {people} | {amountLabel}
        </div>
      </div>
      <button
        type="button"
        className="dc-btn dc-btn-link"
        onClick={() => onSelect?.(reservation)}
      >
        상세 보기
      </button>
    </div>
  );
};

const renderSection = (title, items, onSelect) => (
  <section className="dc-card" key={title}>
    <div className="dc-card-title">
      <span>{title}</span>
      <span className="dc-status-text">총 {items.length}건</span>
    </div>
    {items.length === 0 ? (
      <p className="dc-status-text">해당 내역이 없습니다.</p>
    ) : (
      items.map((reservation) => (
        <ReservationRow
          key={reservation.reservationId}
          reservation={reservation}
          onSelect={onSelect}
        />
      ))
    )}
  </section>
);

export default function TodayDashboardPage({ onSelectReservation }) {
  const [date, setDate] = useState(toDateInputValue());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState({
    date: toDateInputValue(),
    checkInToday: [],
    checkOutToday: [],
    inHouseToday: [],
  });

  const load = async (targetDate) => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchTodayReservations(targetDate);
      setData(result);
    } catch (e) {
      console.error(e);
      setError("오늘 일정 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(date);
  }, [date]);

  const goToToday = () => {
    const today = toDateInputValue();
    setDate(today);
  };

  return (
    <>
      <section className="dc-card">
        <div className="dc-card-title">
          <span>오늘 일정 대시보드</span>
          <span className="dc-status-text">기준 날짜: {data.date}</span>
        </div>
        <div className="dc-field" style={{ marginTop: 8 }}>
          <label className="dc-field-label">날짜 선택</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="date"
              className="dc-field-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <button
              type="button"
              className="dc-btn dc-btn-primary"
              onClick={goToToday}
            >
              오늘로 이동
            </button>
          </div>
        </div>
        {error && <p className="dc-status-text">{error}</p>}
        {loading && <p className="dc-status-text">불러오는 중...</p>}
      </section>
      {renderSection("오늘 체크인", data.checkInToday, onSelectReservation)}
      {renderSection("오늘 체크아웃", data.checkOutToday, onSelectReservation)}
      {renderSection("현재 체류 중", data.inHouseToday, onSelectReservation)}
    </>
  );
}
