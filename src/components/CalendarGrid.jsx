import React, { useEffect, useMemo, useState } from "react";
import { compareISO, formatDateLabel, parseISO, toISO } from "../utils/date";
import { API_BASE } from "../config/api";

function CalendarGrid({
  cells,
  selectingCheckOut,
  today,
  maxCheckInISO,
  checkIn,
  checkOut,
  onDateClick,
  monthLabel,
  onMonthChange,
  siteId,
  year,
  month,
  onBlockedDate,
  disabledDates = [],
}) {
  const todayISO = toISO(today);
  const [serverDisabledDates, setServerDisabledDates] = useState([]);

  const combinedDisabledDates = useMemo(() => {
    const all = [...disabledDates, ...serverDisabledDates];
    return all.length ? Array.from(new Set(all)) : [];
  }, [disabledDates, serverDisabledDates]);

  const disabledSet = useMemo(
    () => new Set(combinedDisabledDates),
    [combinedDisabledDates]
  );

  useEffect(() => {
    if (!siteId || year == null || month == null) {
      setServerDisabledDates([]);
      return undefined;
    }
    let cancelled = false;
    const controller = new AbortController();
    const fromDate = new Date(year, month, 1);
    const nextMonth = new Date(year, month + 1, 1);
    const params = new URLSearchParams({
      siteId,
      from: toISO(fromDate),
      to: toISO(nextMonth),
    });
    const fetchDisabledDates = async () => {
      try {
        const response = await fetch(
          `${API_BASE}/reservations/disabled-dates?${params.toString()}`,
          { signal: controller.signal }
        );
        if (!response.ok) throw new Error("disabled dates unavailable");
        const data = await response.json();
        if (!cancelled) {
          const fetchedDates = Array.isArray(data?.dates)
            ? data.dates
            : Array.isArray(data?.disabledCheckInDates)
            ? data.disabledCheckInDates
            : [];
          setServerDisabledDates(fetchedDates);
        }
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("[CalendarGrid] disabled dates", err);
        if (!cancelled) {
          setServerDisabledDates([]);
        }
      }
    };
    fetchDisabledDates();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [siteId, year, month]);

  const isInRange = (iso) => {
    if (!checkIn || !checkOut) return false;
    return compareISO(iso, checkIn) > 0 && compareISO(iso, checkOut) < 0;
  };

  return (
    <div className="dc-cal-wrap">
      <div className="dc-cal-header">
        <button type="button" className="dc-cal-nav" onClick={() => onMonthChange(-1)}>
          {"\u25c0"}
        </button>
        <div className="dc-cal-month">{monthLabel}</div>
        <button type="button" className="dc-cal-nav" onClick={() => onMonthChange(1)}>
          {"\u25b6"}
        </button>
      </div>
      <div className="dc-cal-weekdays">
        {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="dc-cal-grid">
        {cells.map((iso, i) => {
          if (!iso) return <div key={i} className="dc-cal-cell empty" />;
          const isPast = compareISO(iso, todayISO) < 0;
          const isOverMax = maxCheckInISO && compareISO(iso, maxCheckInISO) > 0;
          const isCheckIn = iso === checkIn;
          const isCheckOut = iso === checkOut;
          const inRange = isInRange(iso);
          const hasDisabledRange =
            selectingCheckOut &&
            checkIn &&
            combinedDisabledDates.some(
              (date) =>
                compareISO(date, checkIn) >= 0 && compareISO(date, iso) < 0
            );
          const isDisabledCheckIn = disabledSet.has(iso);
          const isBlocked =
            (!selectingCheckOut && (isPast || isOverMax || isDisabledCheckIn)) ||
            (selectingCheckOut && compareISO(iso, checkIn) <= 0) ||
            hasDisabledRange;
          let cls = "dc-cal-cell";
          if (isBlocked) cls += " disabled";
          if (isDisabledCheckIn) cls += " blocked";
          if (hasDisabledRange) cls += " blocked-range";
          if (isCheckIn) cls += " selected checkin";
          if (isCheckOut) cls += " selected checkout";
          if (inRange) cls += " in-range";
          return (
            <button
              key={iso + i}
              type="button"
              className={cls}
              aria-disabled={isBlocked}
              onClick={() => {
                if (isBlocked) {
                  if (hasDisabledRange) {
                    onBlockedDate?.("range", iso);
                  } else if (isDisabledCheckIn) {
                    onBlockedDate?.("check-in", iso);
                  }
                  return;
                }
                onDateClick(iso);
              }}
            >
              <span>{parseISO(iso).getDate()}</span>
              {isDisabledCheckIn && (
                <span className="dc-cal-cell-note">불가</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default CalendarGrid;
