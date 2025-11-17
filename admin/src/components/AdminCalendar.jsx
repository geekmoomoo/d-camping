import React from "react";

const WEEK_DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const formatMonthLabel = (year, month) => {
  const date = new Date(year, month, 1);
  return new Intl.DateTimeFormat("ko-KR", { month: "long", year: "numeric" }).format(
    date
  );
};

const toDateKey = (year, month, day) => {
  const paddedDay = String(day).padStart(2, "0");
  const paddedMonth = String(month + 1).padStart(2, "0");
  return `${year}-${paddedMonth}-${paddedDay}`;
};

export default function AdminCalendar({
  year,
  month,
  blockedRanges = [],
  selection = {},
  onDateClick,
  onChangeMonth,
  disabled,
  loading,
}) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const cells = [];
  for (let i = 0; i < firstDayIndex; i += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ day, iso: toDateKey(year, month, day) });
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const isDateInRange = (iso) => {
    if (!selection?.start) return false;
    const start = new Date(`${selection.start}T00:00:00`);
    const end = selection.end ? new Date(`${selection.end}T00:00:00`) : null;
    const current = new Date(`${iso}T00:00:00`);
    if (selection.end) {
      return current >= start && current < end;
    }
    return current.getTime() === start.getTime();
  };

  const isBlocked = (iso) => {
    const point = new Date(`${iso}T00:00:00`);
    return blockedRanges.some((range) => {
      const start = new Date(`${range.checkIn}T00:00:00`);
      const end = new Date(`${range.checkOut}T00:00:00`);
      return point >= start && point < end;
    });
  };

  const renderCell = (cell, index) => {
    if (!cell) {
      return (
        <div key={`empty-${index}`} className="internal-calendar-cell internal-calendar-cell--empty" />
      );
    }
    const { iso, day } = cell;
    const blocked = isBlocked(iso);
    const selected = selection.start === iso;
    const inRange = isDateInRange(iso);

    return (
      <button
        key={iso}
        type="button"
        className={`internal-calendar-cell${blocked ? " internal-calendar-cell--blocked" : ""}${
          selected && !inRange ? " internal-calendar-cell--start" : ""
        }${inRange ? " internal-calendar-cell--selected" : ""}`}
        onClick={() => !disabled && onDateClick?.(iso)}
        disabled={disabled}
      >
        <span>{day}</span>
      </button>
    );
  };

  return (
    <div className="internal-calendar">
      <div className="internal-calendar-header">
        <button
          type="button"
          className="internal-calendar-nav"
          onClick={() => onChangeMonth?.(-1)}
          disabled={disabled || loading}
        >
          &lt;
        </button>
        <div className="internal-calendar-label">
          {formatMonthLabel(year, month)}
          {loading && <span className="internal-calendar-loading"> 예약 현황 불러오는 중...</span>}
        </div>
        <button
          type="button"
          className="internal-calendar-nav"
          onClick={() => onChangeMonth?.(1)}
          disabled={disabled || loading}
        >
          &gt;
        </button>
      </div>
      <div className="internal-calendar-weekdays">
        {WEEK_DAYS.map((weekday) => (
          <div key={weekday} className="internal-calendar-weekday">
            {weekday}
          </div>
        ))}
      </div>
      <div className="internal-calendar-grid">{cells.map((cell, index) => renderCell(cell, index))}</div>
      {disabled && (
        <div className="internal-calendar-disabled">
          먼저 사이트를 선택해주세요.
        </div>
      )}
    </div>
  );
}
