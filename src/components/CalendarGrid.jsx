import React from "react";

const toISO = (d) => {
  if (!d) return "";
  const date = d instanceof Date ? new Date(d) : new Date(d);
  date.setHours(0, 0, 0, 0);
  return date.toISOString().slice(0, 10);
};

const parseISO = (iso) => {
  if (!iso) return null;
  const [y, m, day] = iso.split("-").map(Number);
  const d = new Date(y, m - 1, day);
  d.setHours(0, 0, 0, 0);
  return d;
};

const compareISO = (a, b) => {
  if (!a || !b) return 0;
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
};

const formatDateLabel = (iso) => {
  if (!iso) return "";
  const d = parseISO(iso);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${m}/${day}`;
};

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
        <button
          type="button"
          className="dc-cal-nav"
          onClick={() => onMonthChange(-1)}
        >
          ◀
        </button>
        <div className="dc-cal-month">{monthLabel}</div>
        <button
          type="button"
          className="dc-cal-nav"
          onClick={() => onMonthChange(1)}
        >
          ▶
        </button>
      </div>

      <div className="dc-cal-weekdays">
        <div>일</div>
        <div>월</div>
        <div>화</div>
        <div>수</div>
        <div>목</div>
        <div>금</div>
        <div>토</div>
      </div>

      <div className="dc-cal-grid">
        {cells.map((iso, i) => {
          if (!iso) return <div key={i} className="dc-cal-cell empty" />;

          const isPast = compareISO(iso, todayISO) < 0;
          const isOverMax =
            maxCheckInISO && compareISO(iso, maxCheckInISO) > 0;

          const isCheckIn = iso === checkIn;
          const isCheckOut = iso === checkOut;
          const inRange = isInRange(iso);

          const disabled =
            (!selectingCheckOut && (isPast || isOverMax)) ||
            (selectingCheckOut && compareISO(iso, checkIn) <= 0);

          let cls = "dc-cal-cell";
          if (disabled) cls += " disabled";
          if (isCheckIn) cls += " selected checkin";
          if (isCheckOut) cls += " selected checkout";
          if (inRange) cls += " in-range";

          return (
            <button
              key={iso + i}
              type="button"
              className={cls}
              onClick={() => !disabled && onDateClick(iso)}
            >
              {parseISO(iso).getDate()}
            </button>
          );
        })}
      </div>

      <div className="dc-cal-help">
        입실일 {checkIn ? formatDateLabel(checkIn) : "-"} / 퇴실일{" "}
        {checkOut ? formatDateLabel(checkOut) : "-"}
      </div>
    </div>
  );
}

export default CalendarGrid;
