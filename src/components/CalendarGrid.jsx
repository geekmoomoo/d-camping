import React from "react";
import { compareISO, formatDateLabel, parseISO, toISO } from "../utils/date";

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
}) {
  const todayISO = toISO(today);

  const isInRange = (iso) => {
    if (!checkIn || !checkOut) return false;
    return compareISO(iso, checkIn) > 0 && compareISO(iso, checkOut) < 0;
  };

  return (
    <div className="dc-cal-wrap">
      <div className="dc-cal-header">
        <button type="button" className="dc-cal-nav" onClick={() => onMonthChange(-1)}>{"\u2039"}</button>
        <div className="dc-cal-month">{monthLabel}</div>
        <button type="button" className="dc-cal-nav" onClick={() => onMonthChange(1)}>{"\u203A"}</button>
      </div>
      <div className="dc-cal-weekdays">
        {["\uC77C","\uC6D4","\uD654","\uC218","\uBAA9","\uAE08","\uD1A0"].map((d) => (<div key={d}>{d}</div>))}
      </div>
      <div className="dc-cal-grid">
        {cells.map((iso, i) => {
          if (!iso) return <div key={i} className="dc-cal-cell empty" />;
          const isPast = compareISO(iso, todayISO) < 0;
          const isOverMax = maxCheckInISO && compareISO(iso, maxCheckInISO) > 0;
          const isCheckIn = iso === checkIn;
          const isCheckOut = iso === checkOut;
          const inRange = isInRange(iso);
          const disabled = (!selectingCheckOut && (isPast || isOverMax)) || (selectingCheckOut && compareISO(iso, checkIn) <= 0);
          let cls = "dc-cal-cell";
          if (disabled) cls += " disabled";
          if (isCheckIn) cls += " selected checkin";
          if (isCheckOut) cls += " selected checkout";
          if (inRange) cls += " in-range";
          return (
            <button key={iso + i} type="button" className={cls} onClick={() => !disabled && onDateClick(iso)}>
              {parseISO(iso).getDate()}
            </button>
          );
        })}
      </div>
      <div className="dc-cal-help">{"\uC785\uC2E4\uC77C "}{checkIn ? formatDateLabel(checkIn) : "-"}{" / "}{"\uD1F4\uC2E4\uC77C "}{checkOut ? formatDateLabel(checkOut) : "-"}</div>
    </div>
  );
}

export default CalendarGrid;
