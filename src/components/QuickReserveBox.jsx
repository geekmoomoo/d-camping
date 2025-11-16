import React, { useEffect, useState } from "react";
import {
  addDaysISO,
  compareISO,
  diffDays,
  formatDateLabel,
  parseISO,
  toISO,
} from "../utils/date";
import SiteTypeButton from "./SiteTypeButton";

function QuickReserveBox({ onNext }) {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [people, setPeople] = useState(2);
  const [siteType, setSiteType] = useState("all");
  const [dDay, setDDay] = useState(null);
  const [error, setError] = useState("");

  const [isDateSheetOpen, setIsDateSheetOpen] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maxCheckInDate = new Date(today);
  maxCheckInDate.setMonth(maxCheckInDate.getMonth() + 1);
  const maxCheckInISO = toISO(maxCheckInDate);

  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  const selectingCheckOut = !!checkIn && !checkOut;
  const hasFullDateRange = Boolean(checkIn && checkOut);
  const hasSelectedDate = Boolean(checkIn || checkOut);
  const hasTypeSelection = siteType !== "all";
  const hasAnySelection = hasSelectedDate || hasTypeSelection;

  const rangeText =
    checkIn && checkOut
      ? `${formatDateLabel(checkIn)} ~ ${formatDateLabel(checkOut)}`
      : "날짜선택";

  const submitLabel = hasAnySelection ? "다음 단계로 진행" : "전체 목록 보기";
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
    const todayISO = toISO(today);

    if (!selectingCheckOut) {
      if (
        compareISO(iso, todayISO) < 0 ||
        compareISO(iso, maxCheckInISO) > 0
      )
        return;
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
      setError("입실/퇴실 날짜를 선택해주세요.");
      return;
    }
    const nights = diffDays(checkIn, checkOut);
    if (nights < 1 || nights > 10) {
      setError("예약은 최대 10박까지 가능합니다.");
      return;
    }
    setError("");
    closeDateSheet();
  };

  const handlePeopleChange = (delta) => {
    setPeople((prev) => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (next > 16) return 16;
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (people < 1) {
      setError("인원을 1명 이상으로 입력해주세요.");
      return;
    }

    const hasPartialDate = hasSelectedDate && !hasFullDateRange;
    if (hasPartialDate) {
      setError("입실/퇴실 날짜를 모두 선택해주세요.");
      return;
    }

    if (hasFullDateRange) {
      const nights = diffDays(checkIn, checkOut);
      if (nights < 1 || nights > 10) {
        setError("예약은 최대 10박까지 가능합니다.");
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
    setDDay(null);
    setError("");
    closeDateSheet();
  };

  useEffect(() => {
    const d = parseISO(checkIn);
    if (!d) {
      setDDay(null);
      return;
    }
    const diff = diffDays(toISO(today), checkIn);
    setDDay(diff >= 0 ? diff : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkIn]);

  const monthLabel = `${calYear}년 ${calMonth + 1}월`;
  const firstDay = new Date(calYear, calMonth, 1);
  const firstWeekday = firstDay.getDay();
  const totalDays = daysInMonth(calYear, calMonth);

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) {
    cells.push(toISO(new Date(calYear, calMonth, d)));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  while (cells.length < 42) cells.push(null);

  const stayNights =
    hasFullDateRange && compareISO(checkOut, checkIn) > 0
      ? diffDays(checkIn, checkOut)
      : null;
  const canApplyDates = stayNights !== null && stayNights >= 1;
  const dateActionLabel = canApplyDates ? (
    <>
      <span className="dc-stay-highlight">
        {stayNights}박 {stayNights + 1}일
      </span>{" "}
      적용하기
    </>
  ) : (
    "날짜를 선택해주세요"
  );

  return (
    <>
      <form className="dc-qb dc-qb-quick" onSubmit={handleSubmit}>
        <div className="dc-qb-header dc-qb-header-green">
        <div className="dc-qb-title">
            <span className="dc-qb-title-icon">⚡</span>
            빠른 예약
          </div>
        </div>

        <div className="dc-qb-bar-row">
          <button
            type="button"
            className="dc-qb-btn dc-qb-date-btn"
            onClick={openDateSheet}
          >
            <div className="dc-qb-btn-label">
              <span className="dc-qb-bar-icon">📅</span>
              <div className="dc-qb-btn-info">
                <span
                  className={
                    checkIn && checkOut
                      ? "dc-qb-btn-main"
                      : "dc-qb-btn-main dc-qb-bar-placeholder"
                  }
                >
                  {checkIn && checkOut ? rangeText : "날짜 선택"}
                </span>
                <span className="dc-qb-btn-sub">
                  {checkIn && dDay !== null ? `D-${dDay}` : "D-day"}
                </span>
              </div>
            </div>
          </button>

          <div className="dc-inline-people-control">
            <div className="dc-qb-btn-label">
              <span className="dc-qb-bar-icon">👥</span>
              <div className="dc-inline-people-row">
                <button
                  type="button"
                  className="dc-inline-people-btn"
                  onClick={() => handlePeopleChange(-1)}
                  disabled={people <= 1}
                  aria-label="인원 줄이기"
                >
                  -
                </button>
                <span className="dc-inline-people-value vertical-align">
                  인원 {people}명
                </span>
                <button
                  type="button"
                  className="dc-inline-people-btn"
                  onClick={() => handlePeopleChange(1)}
                  disabled={people >= 16}
                  aria-label="인원 늘리기"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="dc-qb-type-label">
          이용 유형
          <span className="dc-qb-type-tip">(선택 안 하면 전체 보기)</span>
        </div>
        <div className="dc-qb-type-grid">
          <SiteTypeButton
            label="자가 카라반"
            value="self-caravan"
            siteType={siteType}
            onChange={setSiteType}
          />
          <SiteTypeButton
            label="카바나 데크"
            value="cabana-deck"
            siteType={siteType}
            onChange={setSiteType}
          />
          <SiteTypeButton
            label="텐트 사이트"
            value="tent"
            siteType={siteType}
            onChange={setSiteType}
          />
          <SiteTypeButton
            label="팬션"
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
          예약은 오늘부터 한 달 이내, 최대 10박까지 선택 가능
        </p>
      </form>

      {isDateSheetOpen && (
        <>
          <div className="dc-qb-sheet-backdrop" onClick={closeDateSheet} />
          <div className="dc-qb-sheet dc-qb-sheet-open">
            <div className="dc-qb-sheet-header">
              <div>날짜 선택</div>
              <button type="button" onClick={closeDateSheet}>
                ✕
              </button>
            </div>

            <div className="dc-qb-date-tabs">
              <div className="active">
                {checkIn ? (
                  <>
                    입실일{" "}
                    <span className="dc-qb-date-highlight">
                      {formatDateLabel(checkIn)}
                    </span>
                  </>
                ) : (
                  "입실일 선택"
                )}
              </div>
              <div className="active">
                {checkOut ? (
                  <>
                    퇴실일{" "}
                    <span className="dc-qb-date-highlight">
                      {formatDateLabel(checkOut)}
                    </span>
                  </>
                ) : (
                  "퇴실일 선택"
                )}
              </div>
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
  const todayISO = toISO(today);

  return (
    <>
      <div className="dc-qb-cal-header">
        <button type="button" onClick={() => onMonthChange(-1)}>
          ‹
        </button>
        <span>{monthLabel}</span>
        <button type="button" onClick={() => onMonthChange(1)}>
          ›
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
              const minOut = addDaysISO(checkIn, 1);
              const maxOut = addDaysISO(checkIn, 10);
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
