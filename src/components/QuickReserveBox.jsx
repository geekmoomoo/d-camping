import React, { useState } from "react";
import { compareISO, diffDays, parseISO } from "../utils/date";
import SiteTypeButton from "./SiteTypeButton";

const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

function formatDateWithWeekday(iso) {
  const date = parseISO(iso);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}.${day}(${weekdays[date.getDay()]})`;
}

function toLocalISO(date) {
  const d = new Date(date);
  const year = String(d.getFullYear()).padStart(4, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDaysLocalISO(iso, days) {
  const base = parseISO(iso);
  if (!base) return iso;
  base.setDate(base.getDate() + days);
  return toLocalISO(base);
}

function formatSummary(checkInValue, checkOutValue, todayDate) {
  const startISO = checkInValue || toLocalISO(todayDate);
  const endISO = checkOutValue || addDaysLocalISO(startISO, 1);
  const nights = diffDays(startISO, endISO) || 1;
  const stayDays = nights + 1;
  return {
    startLabel: formatDateWithWeekday(startISO),
    endLabel: formatDateWithWeekday(endISO),
    nights,
    stayDays,
  };
}

function QuickReserveBox({ onNext }) {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [people, setPeople] = useState(2);
  const [siteType, setSiteType] = useState("all");
  const [error, setError] = useState("");
  const [isDateSheetOpen, setIsDateSheetOpen] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = toLocalISO(today);

  const maxCheckInDate = new Date(today);
  maxCheckInDate.setMonth(maxCheckInDate.getMonth() + 1);
  const maxCheckInISO = toLocalISO(maxCheckInDate);

  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  const selectingCheckOut = !!checkIn && !checkOut;
  const hasFullDateRange = Boolean(checkIn && checkOut);
  const hasSelectedDate = Boolean(checkIn || checkOut);
  const hasTypeSelection = siteType !== "all";
  const hasAnySelection = hasSelectedDate || hasTypeSelection;

  const submitLabel = hasAnySelection ? "선택 예약 진행" : "전체 목록 보기";
  const showResetButton = hasAnySelection;
  const actionClasses = ["dc-qb-actions", "dc-qb-actions-full"];
  if (!showResetButton) actionClasses.push("dc-qb-actions-single");

  const openDateSheet = () => {
    setError("");
    const base = parseISO(checkIn) || today;
    setCalYear(base.getFullYear());
    setCalMonth(base.getMonth());
    setIsDateSheetOpen(true);
  };

  const closeDateSheet = () => {
    setIsDateSheetOpen(false);
  };

  const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();

  const handleMonthChange = (delta) => {
    let y = calYear;
    let m = calMonth + delta;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setCalYear(y);
    setCalMonth(m);
  };

  const handleDateClick = (iso) => {
    if (!iso) return;

    if (!selectingCheckOut) {
      if (compareISO(iso, todayISO) < 0 || compareISO(iso, maxCheckInISO) > 0) {
        return;
      }
      setCheckIn(iso);
      setCheckOut("");
      setError("");
      return;
    }

    if (compareISO(iso, checkIn) <= 0) return;
    const nights = diffDays(checkIn, iso);
    if (nights < 1 || nights > 10) {
      setError("최대 10박까지 선택 가능합니다.");
      return;
    }
    setCheckOut(iso);
    setError("");
  };

  const handleDateConfirm = () => {
    if (!checkIn || !checkOut) {
      setError("입실/퇴실 날짜를 선택해 주세요.");
      return;
    }
    const nights = diffDays(checkIn, checkOut);
    if (nights < 1 || nights > 10) {
      setError("최대 10박까지 선택 가능합니다.");
      return;
    }
    setError("");
    closeDateSheet();
  };

  const focusCheckIn = () => {
    setError("");
    if (checkOut) {
      setCheckOut("");
    }
  };

  const focusCheckOut = () => {
    setError("");
  };

  const handlePeopleDecrement = () => {
    setPeople((prev) => Math.max(1, prev - 1));
  };

  const handlePeopleIncrement = () => {
    setPeople((prev) => prev + 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (people < 1) {
      setError("예약 인원은 1명 이상이어야 합니다.");
      return;
    }

    const hasPartialDate = hasSelectedDate && !hasFullDateRange;
    if (hasPartialDate) {
      setError("입실일과 퇴실일을 모두 선택해 주세요.");
      return;
    }

    if (hasFullDateRange) {
      const nights = diffDays(checkIn, checkOut);
      if (nights < 1 || nights > 10) {
        setError("최대 10박까지 선택 가능합니다.");
        return;
      }
    }

    const payload = {
      people,
      siteType,
    };

    if (hasFullDateRange) {
      payload.checkIn = checkIn;
      payload.checkOut = checkOut;
    }

    if (typeof onNext === "function") {
      onNext(payload);
    } else {
      console.log("빠른 예약:", payload);
    }
  };

  const handleReset = () => {
    setCheckIn("");
    setCheckOut("");
    setPeople(2);
    setSiteType("all");
    setError("");
    closeDateSheet();
  };

  const monthLabel = `${calYear}년 ${calMonth + 1}월`;
  const firstDay = new Date(calYear, calMonth, 1);
  const firstWeekday = firstDay.getDay();
  const totalDays = daysInMonth(calYear, calMonth);

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    cells.push(toLocalISO(new Date(calYear, calMonth, d)));
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  while (cells.length < 42) {
    cells.push(null);
  }

  const stayNights =
    hasFullDateRange && compareISO(checkOut, checkIn) > 0
      ? diffDays(checkIn, checkOut)
      : null;
  const canApplyDates = stayNights !== null && stayNights >= 1;
  const stayDays = stayNights ? stayNights + 1 : null;
  const dateActionLabel = stayNights
    ? `${stayNights}박 ${stayDays}일 | 인원 ${people}명`
    : "0박0일 | 인원 0명";

  const summaryInfo = formatSummary(checkIn, checkOut, today);

  return (
    <>
      <form className="dc-qb dc-qb-quick" onSubmit={handleSubmit}>
        <div className="dc-qb-header dc-qb-header-green">
          <div className="dc-qb-title">
            <span className="dc-qb-title-icon">⚡</span>
            간편 예약
          </div>
        </div>

        <div className="dc-qb-bar-row">
          <button
            type="button"
            className="dc-qb-btn date-summary-button"
            onClick={openDateSheet}
          >
            <div className="date-summary-body">
              <span className="date-summary-dates">
                <strong>
                  {summaryInfo.startLabel} ~ {summaryInfo.endLabel}
                </strong>
              </span>
              <span className="date-summary-meta">
                {summaryInfo.nights}박 {summaryInfo.stayDays}일 | 인원 {people}명
              </span>
            </div>
          </button>
        </div>

        <div className="dc-qb-type-label">
          이용 유형
          <span className="dc-qb-type-tip">(선택 안 하면 전체 보기)</span>
        </div>
        <div className="dc-qb-type-grid">
          <SiteTypeButton
            label="자가 카라반"
            icon="🚐"
            value="self-caravan"
            siteType={siteType}
            onChange={setSiteType}
          />
          <SiteTypeButton
            label="카바나데크"
            icon="🏡"
            value="cabana-deck"
            siteType={siteType}
            onChange={setSiteType}
          />
          <SiteTypeButton
            label="텐트 사이트"
            icon="⛺"
            value="tent"
            siteType={siteType}
            onChange={setSiteType}
          />
          <SiteTypeButton
            label="펜션"
            icon="🏨"
            value="lodging"
            siteType={siteType}
            onChange={setSiteType}
          />
        </div>

        <div className={actionClasses.join(" ")}>
          <button type="submit" className="dc-btn-primary">
            {submitLabel}
          </button>
          {showResetButton && (
            <button
              type="button"
              className="dc-btn-outline"
              onClick={handleReset}
            >
              초기화
            </button>
          )}
        </div>
        {error && <div className="dc-qb-error">{error}</div>}
        <p className="dc-qb-helper">
          예약은 오늘 기준으로 확인되며, 최대 10박까지 선택할 수 있습니다.
        </p>
      </form>

      {isDateSheetOpen && (
        <>
          <div className="dc-qb-sheet-backdrop" onClick={closeDateSheet} />
          <div className="dc-qb-sheet dc-qb-sheet-open">
            <div className="dc-qb-sheet-header">
              <div className="dc-qb-sheet-title">날짜 선택</div>
              <button type="button" onClick={closeDateSheet} aria-label="닫기">
                ×
              </button>
            </div>

            <div className="dc-qb-sheet-mode">
              <button
                type="button"
                className={`mode-btn${!selectingCheckOut ? " active" : ""}`}
                onClick={focusCheckIn}
              >
                입실일 선택
              </button>
              <button
                type="button"
                className={`mode-btn${selectingCheckOut ? " active" : ""}`}
                onClick={focusCheckOut}
              >
                퇴실일 선택
              </button>
            </div>

            <QuickCalendarGrid
              cells={cells}
              selectingCheckOut={selectingCheckOut}
              today={today}
              maxCheckInISO={maxCheckInISO}
              checkIn={checkIn}
              checkOut={checkOut}
              onDateClick={handleDateClick}
              monthLabel={monthLabel}
              onMonthChange={handleMonthChange}
            />

            <div className="dc-qb-people-row">
              <span className="people-label">인원</span>
              <div className="dc-qb-people-ctrl">
                <button type="button" onClick={handlePeopleDecrement} aria-label="성인 감소">
                  -
                </button>
                <span className="people-count">{people}</span>
                <button type="button" onClick={handlePeopleIncrement} aria-label="성인 증가">
                  +
                </button>
              </div>
            </div>

            <div className="dc-qb-sheet-people-summary">
              <span className="people-note">36개월 이하 영유아 무료</span>
            </div>

            <button
              type="button"
              className="dc-qb-sheet-btn"
              onClick={handleDateConfirm}
              disabled={!canApplyDates}
            >
              {dateActionLabel}
            </button>
          </div>
        </>
      )}
    </>
  );
}

function QuickCalendarGrid({
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
  const todayISO = toLocalISO(today);

  return (
    <>
      <div className="dc-qb-cal-header">
        <button type="button" onClick={() => onMonthChange(-1)}>
          ◀
        </button>
        <span>{monthLabel}</span>
        <button type="button" onClick={() => onMonthChange(1)}>
          ▶
        </button>
      </div>

      <div className="dc-qb-cal-weekdays">
        {["일", "월", "화", "수", "목", "금", "토"].map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>

      <div className="dc-qb-cal-grid">
        {cells.map((iso, idx) => {
          if (!iso) {
            return <div key={idx} className="dc-qb-cal-cell empty" />;
          }

          let disabled = false;

          if (!selectingCheckOut) {
            if (
              compareISO(iso, todayISO) < 0 ||
              compareISO(iso, maxCheckInISO) > 0
            ) {
              disabled = true;
            }
          } else {
            if (!checkIn) {
              disabled = true;
            } else {
              const minOut = addDaysLocalISO(checkIn, 1);
              const maxOut = addDaysLocalISO(checkIn, 10);
              if (
                compareISO(iso, minOut) < 0 ||
                compareISO(iso, maxOut) > 0
              ) {
                disabled = true;
              }
            }
          }

          const start = iso === checkIn;
          const end = iso === checkOut;
          const inRange =
            checkIn &&
            checkOut &&
            compareISO(iso, checkIn) > 0 &&
            compareISO(iso, checkOut) < 0;

          const classNames = [
            "dc-qb-cal-cell",
            disabled ? "disabled" : "",
            start ? "start" : "",
            end ? "end" : "",
            inRange ? "in-range" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <button
              key={idx}
              type="button"
              className={classNames}
              onClick={() => {
                if (!disabled) onDateClick(iso);
              }}
            >
              <span>{parseISO(iso).getDate()}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

export default QuickReserveBox;
