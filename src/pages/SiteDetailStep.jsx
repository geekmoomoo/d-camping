// src/pages/SiteDetailStep.jsx
import React, { useEffect, useState } from "react";
import CalendarGrid from "../components/CalendarGrid";
import CancelPolicyAccordion from "../components/CancelPolicyAccordion";
import SiteImageCarousel from "../components/SiteImageCarousel";
import {
  compareISO,
  diffDays,
  formatDateLabel,
  parseISO,
  toISO,
} from "../utils/date";

const fallbackImages = [
  "/site_img/site_001.jpg",
  "/site_img/site_002.jpg",
  "/site_img/site_003.jpg",
  "/site_img/site_004.jpg",
];

const TYPE_LABELS = {
  "self-caravan": "자가 카라반존",
  "cabana-deck": "카바나 데크존",
  tent: "캠핑 사이트",
  pension: "숙박 시설",
};

function SiteDetailStep({ data, site, onReserve, onUpdateDates }) {
  const metaTitle = site?.name || "캠핑 사이트";
  const images = site?.images?.length ? site.images : fallbackImages;
  const typeLabel = TYPE_LABELS[site?.type] || "캠핑";

  const basePeople = site?.basePeople ?? 4;
  const maxPeople = site?.maxPeople ?? 5;
  const extraPerPerson = site?.extraPerPerson ?? 10000;

  const [checkIn, setCheckIn] = useState(data?.checkIn || "");
  const [checkOut, setCheckOut] = useState(data?.checkOut || "");
  const [people] = useState(data?.people || 2);

  const [isDateSheetOpen, setIsDateSheetOpen] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxCheckInDate = new Date(today);
  maxCheckInDate.setMonth(maxCheckInDate.getMonth() + 1);
  const maxCheckInISO = toISO(maxCheckInDate);

  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const selectingCheckOut = !!checkIn && !checkOut;

  useEffect(() => {
    if (onUpdateDates) onUpdateDates({ checkIn, checkOut });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkIn, checkOut]);

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

  const openDateSheet = () => {
    const base = parseISO(checkIn) || today;
    setCalYear(base.getFullYear());
    setCalMonth(base.getMonth());
    setIsDateSheetOpen(true);
  };

  const closeDateSheet = () => setIsDateSheetOpen(false);

  const handleDateClick = (iso) => {
    if (!iso) return;
    const todayISO = toISO(today);

    // 체크인 선택 단계
    if (!selectingCheckOut) {
      if (
        compareISO(iso, todayISO) < 0 ||
        compareISO(iso, maxCheckInISO) > 0
      ) {
        return;
      }
      setCheckIn(iso);
      setCheckOut("");
      return;
    }

    // 체크아웃 선택 단계
    if (compareISO(iso, checkIn) <= 0) return;
    const nights = diffDays(checkIn, iso);
    if (nights < 1 || nights > 10) return;
    setCheckOut(iso);
  };

  const handleDateConfirm = () => {
    if (checkIn && checkOut) {
      closeDateSheet();
    }
  };

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

  const rangeText =
    checkIn && checkOut
      ? `${formatDateLabel(checkIn)} ~ ${formatDateLabel(checkOut)}`
      : "입실/퇴실을 선택해 주세요";

  const hasFullDateRange =
    checkIn && checkOut && compareISO(checkOut, checkIn) > 0;
  const stayNights = hasFullDateRange ? diffDays(checkIn, checkOut) : null;
  const stayLengthText =
    stayNights !== null ? `${stayNights}박 ${stayNights + 1}일` : "0박 0일";

  const canApplyDates = stayNights !== null && stayNights >= 1;
  const dateActionLabel = canApplyDates ? (
    <>
      <span className="dc-stay-highlight">
        {stayNights}박 {stayNights + 1}일
      </span>{" "}
      적용하기
    </>
  ) : (
    "날짜를 선택해 주세요"
  );

  const handleReserveClick = () => {
    if (!checkIn || !checkOut) {
      alert("입실일과 퇴실일을 먼저 선택해 주세요.");
      return;
    }
    if (typeof onReserve === "function") onReserve();
  };

  return (
    <>
      <section className="dc-step-card dc-step-card-site">
        <SiteImageCarousel images={images} />

        <div className="dc-site-info-block">
          <div className="dc-site-title">{metaTitle}</div>
          <div className="dc-site-subrow">
            <span className="dc-site-pill">{typeLabel}</span>
            <span className="dc-site-time">입실 13:00 · 퇴실 11:00</span>
          </div>
          <div className="dc-site-people">
            <span className="dc-site-people-icon">👥</span>
            기준 {basePeople}인 / 최대 {maxPeople}인
          </div>
          <div className="dc-site-manners">
            <div className="dc-site-manner-box">
              <span className="dc-site-manner-label">매너타임 시작</span>
              <strong>22:30</strong>
            </div>
            <div className="dc-site-manner-box">
              <span className="dc-site-manner-label">매너타임 종료</span>
              <strong>07:00</strong>
            </div>
          </div>
        </div>

        {checkIn && checkOut && (
          <div className="dc-step-summary dc-step-summary-single">
            <div className="summary-item">
              <strong>입실</strong> {formatDateLabel(checkIn)}
            </div>
            <span className="summary-dot">·</span>
            <div className="summary-item">
              <strong>퇴실</strong> {formatDateLabel(checkOut)}
            </div>
            <span className="summary-dot">·</span>
            <div className="summary-item">
              <strong>인원</strong> {people}명
            </div>
          </div>
        )}

        <div className="dc-site-desc">
          <div className="dc-site-desc-title">시설 소개</div>
          <ul className="dc-site-desc-list">
            <li>
              22년도 리모델링 완료된 사이트입니다. 운영 일정 및 현장 상황에 따라
              세부 사항은 변경될 수 있습니다.
            </li>
            <li>
              기준 인원 {basePeople}인, 최대 인원 {maxPeople}
              인입니다.
            </li>
          </ul>
          <div className="dc-site-desc-subtitle">예약 방법 안내</div>
          <ul className="dc-site-desc-list">
            <li>입실일과 퇴실일을 달력에서 클릭해 선택해 주세요.</li>
            <li>예시) 8/1 ~ 8/4 (3박 4일) → 8/1(입실), 8/4(퇴실) 선택</li>
          </ul>
          <div className="dc-site-desc-subtitle">편의 시설</div>
          <ul className="dc-site-desc-list">
            <li>전기, 수도, 배수 이용 가능 (구역별 상이)</li>
            <li>
              공용 시설: 펜션 1동, 관리동(화장실·샤워실·개수대), 분리수거장,
              어린이 놀이 공간 등
            </li>
          </ul>
        </div>

        <div className="dc-site-desc">
          <div className="dc-site-desc-title">유의 사항</div>
          <div className="dc-site-alert">
            캠핑장 내에서 발생하는 개인 부주의로 인한 사고에 대해서는
            책임지지 않습니다.
          </div>
          <ul className="dc-site-desc-list">
            <li>
              기준 인원 초과 시 1인당 추가 요금{" "}
              {extraPerPerson.toLocaleString()}원이 발생합니다.
            </li>
            <li>
              소음·음주 등으로 다른 팀에 피해를 줄 경우 퇴실 조치될 수 있습니다.
            </li>
            <li>예약 변경은 제한될 수 있으니, 취소 규정을 꼭 확인해 주세요.</li>
            <li>매너타임(22:30~07:00)을 꼭 지켜 주세요.</li>
          </ul>
        </div>

        <CancelPolicyAccordion />
      </section>

      <div className="dc-fixed-reserve-bar">
        <button type="button" className="dc-fixed-date" onClick={openDateSheet}>
          <span className="dc-fixed-date-icon">📅</span>
          <span className="dc-fixed-date-text">
            <span>{rangeText}</span>
            <span className="dc-fixed-date-length">{stayLengthText}</span>
          </span>
        </button>
        <button
          type="button"
          className="dc-fixed-reserve-btn"
          onClick={handleReserveClick}
        >
          예약하기
        </button>
      </div>

      {isDateSheetOpen && (
        <>
          <div className="dc-qb-sheet-backdrop" onClick={closeDateSheet} />
          <div className="dc-qb-sheet dc-qb-sheet-open">
            <div className="dc-qb-sheet-header">
              <div>날짜 선택</div>
              <button type="button" onClick={closeDateSheet}>
                닫기
              </button>
            </div>
            <div className="dc-qb-date-tabs">
              <div className="active">
                {checkIn ? (
                  <>
                    입실{" "}
                    <span className="dc-qb-date-highlight">
                      {formatDateLabel(checkIn)}
                    </span>
                  </>
                ) : (
                  "입실 날짜 선택"
                )}
              </div>
              <div className="active">
                {checkOut ? (
                  <>
                    퇴실{" "}
                    <span className="dc-qb-date-highlight">
                      {formatDateLabel(checkOut)}
                    </span>
                  </>
                ) : (
                  "퇴실 날짜 선택"
                )}
              </div>
            </div>
            <CalendarGrid
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

export default SiteDetailStep;
