import React, { useEffect, useMemo, useState } from "react";
import { fetchSiteStatusReservations } from "../services/reservationAdminService.js";

const pad2 = (value) => String(value).padStart(2, "0");
const formatMonth = (date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
const formatDate = (date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const getMonthBounds = (month) => {
  const [year, monthPart] = month.split("-").map(Number);
  const daysInMonth = new Date(year, monthPart, 0).getDate();
  return {
    year,
    month: monthPart,
    startDate: `${year}-${pad2(monthPart)}-01`,
    endDate: `${year}-${pad2(monthPart)}-${pad2(daysInMonth)}`,
    daysInMonth,
  };
};

const isDateInRange = (dateStr, startStr, endStr) => {
  if (!dateStr || !startStr || !endStr) return false;
  const target = new Date(`${dateStr}T00:00:00`);
  const start = new Date(`${startStr}T00:00:00`);
  const end = new Date(`${endStr}T00:00:00`);
  return target >= start && target < end;
};

const buildCalendarDays = (year, month, reservations) => {
  const firstDay = new Date(year, month - 1, 1);
  const startWeek = firstDay.getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells = [];
  const totalCells = Math.ceil((startWeek + daysInMonth) / 7) * 7;
  for (let index = 0; index < totalCells; index += 1) {
    const dayNumber = index - startWeek + 1;
    if (dayNumber < 1 || dayNumber > daysInMonth) {
      cells.push({ date: null, label: "" });
      continue;
    }
    const dateStr = `${year}-${pad2(month)}-${pad2(dayNumber)}`;
    const count = reservations.filter((reservation) =>
      isDateInRange(dateStr, reservation.checkIn, reservation.checkOut)
    ).length;
    cells.push({ date: dateStr, label: dayNumber, count });
  }
  return cells;
};

const weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"];

export default function SiteStatusPage({ onViewDetail }) {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(formatMonth(today));
  const [selectedDate, setSelectedDate] = useState(formatDate(today));
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const bounds = getMonthBounds(selectedMonth);

  const loadReservations = async (month) => {
    setLoading(true);
    setError("");
    try {
      const { startDate, endDate } = getMonthBounds(month);
      const payload = await fetchSiteStatusReservations({ startDate, endDate });
      setReservations(payload?.reservations || []);
    } catch (err) {
      console.error(err);
      setError("데이터를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSelectedDate((prev) =>
      prev && prev.startsWith(selectedMonth)
        ? prev
        : `${selectedMonth}-01`
    );
    loadReservations(selectedMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  const calendarDays = useMemo(
    () => buildCalendarDays(bounds.year, bounds.month, reservations),
    [bounds.year, bounds.month, reservations]
  );

  const reservationsOnDate = useMemo(
    () =>
      reservations.filter((reservation) =>
        isDateInRange(
          selectedDate,
          reservation.checkIn,
          reservation.checkOut
        )
      ),
    [reservations, selectedDate]
  );

  const groupedBySite = useMemo(() => {
    const map = new Map();
    reservationsOnDate.forEach((reservation) => {
      const key = reservation.siteId || reservation.siteName || "미정";
      const existing = map.get(key) || [];
      existing.push(reservation);
      map.set(key, existing);
    });
    return Array.from(map.entries());
  }, [reservationsOnDate]);

  const handleToday = () => {
    const month = formatMonth(today);
    setSelectedMonth(month);
  };

  return (
    <div>
      <section className="dc-card">
        <div className="dc-card-title">
          <span>사이트별 예약 현황</span>
        </div>
        <div
          className="dc-field"
          style={{ display: "flex", gap: 12, flexWrap: "wrap" }}
        >
          <div style={{ flex: "1 1 200px" }}>
            <label className="dc-field-label">선택 월</label>
            <input
              type="month"
              className="dc-field-input"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
            />
          </div>
          <div style={{ alignSelf: "flex-end" }}>
            <button type="button" className="dc-btn dc-btn-primary" onClick={handleToday}>
              이번 달
            </button>
          </div>
        </div>
        {error && <p className="dc-status-text">{error}</p>}
      </section>
      <section className="dc-card" style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        <div
          style={{
            flex: "1 1 320px",
            minWidth: 280,
          }}
        >
          <p className="dc-status-text" style={{ marginBottom: 8 }}>
            {selectedMonth} 달력
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 6,
              textAlign: "center",
            }}
          >
            {weekdayLabels.map((day) => (
              <div
                key={day}
                style={{
                  fontSize: 12,
                  color: "#5c4a2a",
                }}
              >
                {day}
              </div>
            ))}
            {calendarDays.map((cell, idx) => {
              const isSelected = cell.date === selectedDate;
              return (
                <button
                  key={`${cell.label}-${idx}`}
                  type="button"
                  onClick={() => cell.date && setSelectedDate(cell.date)}
                  className="dc-btn dc-btn-link"
                  style={{
                    minHeight: 48,
                    border: isSelected
                      ? `1px solid var(--dc-accent-secondary)`
                      : "1px solid #e0d3bf",
                    borderRadius: 4,
                    background: isSelected ? "#f1e7d5" : "#fff",
                    color: "#2f2412",
                    padding: 4,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: 4,
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 600 }}>
                    {cell.label || ""}
                  </span>
                  {cell.count > 0 && (
                    <span style={{ fontSize: 10, color: "#1b7c7c" }}>
                      예약 {cell.count}건
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        <div
          style={{
            flex: "2 1 420px",
            minWidth: 320,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div className="dc-card">
            <div className="dc-card-title">
              <span>{selectedDate} 사이트별 예약 현황</span>
            </div>
            {loading && <p className="dc-status-text">불러오는 중...</p>}
            {!loading && reservationsOnDate.length === 0 && (
              <p className="dc-status-text">예약 없음</p>
            )}
            {!loading && reservationsOnDate.length > 0 && (
              <p className="dc-status-text">
                총 {reservationsOnDate.length}건 예약
              </p>
            )}
          </div>
          {selectedDate &&
            (groupedBySite.length > 0 ? (
              groupedBySite.map(([siteKey, group]) => (
                <div key={siteKey} className="dc-card">
                  <div className="dc-card-title">
                    <span>
                      [{siteKey}] {group[0].siteName || "사이트 정보 없음"}
                    </span>
                    <span className="dc-status-text">
                      {group.length}건 예약
                    </span>
                  </div>
                  {group.map((reservation) => (
                    <div
                      key={reservation.reservationId}
                      style={{
                        borderTop: "1px solid #e0d3bf",
                        paddingTop: 8,
                        marginTop: 8,
                      }}
                    >
                      <p style={{ margin: "2px 0", fontWeight: 600 }}>
                        예약번호: {reservation.reservationId}
                      </p>
                      <p style={{ margin: "2px 0" }}>
                        예약자: {reservation.userName || "-"} / {reservation.phone || "-"}
                      </p>
                      <p style={{ margin: "2px 0" }}>
                        인원: {reservation.people ?? "-"}명
                      </p>
                      <p style={{ margin: "2px 0" }}>
                        기간: {reservation.checkIn} ~ {reservation.checkOut}
                      </p>
                      <p style={{ margin: "2px 0" }}>
                        상태: <span className="dc-tag dc-tag--PAID">PAID</span>
                      </p>
                      <button
                        type="button"
                        className="dc-btn dc-btn-outline"
                        onClick={() => onViewDetail?.(reservation)}
                      >
                        상세 보기
                      </button>
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <div className="dc-card">
                <p className="dc-status-text">비어 있음</p>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}
