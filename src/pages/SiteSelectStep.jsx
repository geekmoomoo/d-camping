import React, { useEffect, useMemo, useState } from "react";
import CalendarGrid from "../components/CalendarGrid";
import {
  compareISO,
  diffDays,
  formatDateLabel,
  parseISO,
  toISO,
} from "../utils/date";

const mockSites = [
  {
    id: "A1",
    type: "self-caravan",
    name: "*A1* 자가 카라반 사이트 / 차박 가능",
    zone: "*A1*",
    carOption: "차박 가능",
    squareImg: "/site_img/site_001.jpg",
    remain: 2,
    price: 50000,
  },
  {
    id: "A2",
    type: "self-caravan",
    name: "*A2* 자가 카라반 사이트 / 차박 가능",
    zone: "*A2*",
    carOption: "차박 가능",
    squareImg: "/site_img/site_002.jpg",
    remain: 1,
    price: 55000,
  },
  {
    id: "A3",
    type: "self-caravan",
    name: "*A3* 자가 카라반 사이트 / 차박 가능",
    zone: "*A3*",
    carOption: "차박 가능",
    squareImg: "/site_img/site_003.jpg",
    remain: 3,
    price: 55000,
  },
  {
    id: "B1",
    type: "cabana-deck",
    name: "*B1* 카바나 데크 사이트 / 차박 불가",
    zone: "*B1*",
    carOption: "차박 불가",
    squareImg: "/site_img/site_004.jpg",
    remain: 2,
    price: 60000,
  },
  {
    id: "B2",
    type: "cabana-deck",
    name: "*B2* 카바나 데크 사이트 / 차박 불가",
    zone: "*B2*",
    carOption: "차박 불가",
    squareImg: "/site_img/site_001.jpg",
    remain: 4,
    price: 60000,
  },
  {
    id: "B3",
    type: "cabana-deck",
    name: "*B3* 카바나 데크 사이트 / 차박 불가",
    zone: "*B3*",
    carOption: "차박 불가",
    squareImg: "/site_img/site_002.jpg",
    remain: 1,
    price: 62000,
  },
  {
    id: "C1",
    type: "tent",
    name: "*C1* 텐트 사이트 / 차박 가능",
    zone: "*C1*",
    carOption: "차박 가능",
    squareImg: "/site_img/site_003.jpg",
    remain: 5,
    price: 40000,
  },
  {
    id: "C2",
    type: "tent",
    name: "*C2* 텐트 사이트 / 차박 가능",
    zone: "*C2*",
    carOption: "차박 가능",
    squareImg: "/site_img/site_004.jpg",
    remain: 3,
    price: 42000,
  },
  {
    id: "C3",
    type: "tent",
    name: "*C3* 텐트 사이트 / 차박 불가",
    zone: "*C3*",
    carOption: "차박 불가",
    squareImg: "/site_img/site_001.jpg",
    remain: 2,
    price: 38000,
  },
  {
    id: "D1",
    type: "lodging",
    name: "*D1* 숙박동 / 복층, 테라스",
    zone: "*D1*",
    carOption: "복층",
    squareImg: "/site_img/site_002.jpg",
    remain: 1,
    price: 120000,
  },
  {
    id: "D2",
    type: "lodging",
    name: "*D2* 숙박동 / 가족 전용",
    zone: "*D2*",
    carOption: "가족 전용",
    squareImg: "/site_img/site_003.jpg",
    remain: 2,
    price: 130000,
  },
  {
    id: "D3",
    type: "lodging",
    name: "*D3* 숙박동 / 숲 전망",
    zone: "*D3*",
    carOption: "숲 전망",
    squareImg: "/site_img/site_004.jpg",
    remain: 1,
    price: 140000,
  },
];

function SiteSelectStep({ data, onChangeFilter, onSelectSite }) {
  const initialCheckIn = data?.checkIn || "";
  const initialCheckOut = data?.checkOut || "";
  const initialPeople = data?.people || 2;

  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [people, setPeople] = useState(initialPeople);

  const [isDateSheetOpen, setIsDateSheetOpen] = useState(false);
  const [isPeopleSheetOpen, setIsPeopleSheetOpen] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maxCheckInDate = new Date(today);
  maxCheckInDate.setMonth(maxCheckInDate.getMonth() + 1);
  const maxCheckInISO = toISO(maxCheckInDate);

  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  const selectingCheckOut = !!checkIn && !checkOut;

  const rangeText =
    checkIn && checkOut
      ? `${formatDateLabel(checkIn)} ~ ${formatDateLabel(checkOut)}`
      : "날짜선택";

  useEffect(() => {
    if (!onChangeFilter) return;
    onChangeFilter({
      ...data,
      checkIn,
      checkOut,
      people,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkIn, checkOut, people]);

  const openDateSheet = () => {
    const base = parseISO(checkIn) || today;
    setCalYear(base.getFullYear());
    setCalMonth(base.getMonth());
    setIsDateSheetOpen(true);
    setIsPeopleSheetOpen(false);
  };

  const openPeopleSheet = () => {
    setIsPeopleSheetOpen(true);
    setIsDateSheetOpen(false);
  };

  const closeSheets = () => {
    setIsDateSheetOpen(false);
    setIsPeopleSheetOpen(false);
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
      return;
    }

    if (compareISO(iso, checkIn) <= 0) return;
    const nights = diffDays(checkIn, iso);
    if (nights < 1 || nights > 10) return;
    setCheckOut(iso);
  };

  const handlePeopleChange = (delta) => {
    setPeople((prev) => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (next > 16) return 16;
      return next;
    });
  };

  const handleDateConfirm = () => {
    closeSheets();
  };

  const handlePeopleConfirm = () => {
    closeSheets();
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

  const filteredSites = useMemo(() => {
    if (data?.siteType && data.siteType !== "all") {
      return mockSites.filter((s) => s.type === data.siteType);
    }
    return mockSites;
  }, [data?.siteType]);

  return (
    <section className="dc-step-card">
      <header className="dc-filter-card">
        <div className="dc-filter-combo">
          <button type="button" className="dc-filter-seg dc-filter-date" onClick={openDateSheet}>{checkIn || checkOut ? rangeText : "날짜선택"}</button>
          <span className="dc-filter-divider" aria-hidden="true" />
          <button type="button" className="dc-filter-seg dc-filter-people" onClick={openPeopleSheet}>{`인원 ${people}`}</button>
        </div>
      </header>

      <div className="dc-site-grid">
        {filteredSites.map((site) => (
          <div className="dc-site-card" key={site.id}>
            <div className="dc-site-thumb-wrap">
              <img
                className="dc-site-thumb"
                src={site.squareImg}
                alt={site.name}
                loading="lazy"
              />
            </div>
            <div className="dc-site-body">
              {(() => {
                let typeClass = "type-default";
                let typeText = "";
                if (site.type === "self-caravan") {
                  typeClass = "type-self-caravan";
                  typeText = "자가 카라반";
                } else if (site.type === "cabana-deck") {
                  typeClass = "type-cabana-deck";
                  typeText = "카바나 데크";
                } else if (site.type === "tent") {
                  typeClass = "type-tent";
                  typeText = "텐트 사이트";
                } else if (site.type === "lodging") {
                  typeClass = "type-lodging";
                  typeText = "숙박 시설";
                }

                return (
                  <>
                    <div className={`dc-site-type-tag ${typeClass}`}>
                      {typeText}
                    </div>
                    <div className="dc-site-label">
                      {site.zone} 구역 / {site.carOption}
                    </div>
                    <div className="dc-site-capacity">기준 4인 / 최대 5인</div>
                  </>
                );
              })()}

              <div className="dc-site-meta-row">
                <div className="dc-site-left" />
                <div className="dc-site-right">
                  <div className="dc-site-remain">남은 자리 {site.remain}개</div>
                  <div className="dc-site-price">
                    {site.price.toLocaleString()}원~
                  </div>
                  <button
                    type="button"
                    className="dc-site-book-btn"
                    onClick={() => onSelectSite(site)}
                  >
                    예약하기
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isDateSheetOpen && (
        <>
          <div className="dc-qb-sheet-backdrop" onClick={closeSheets} />
          <div className="dc-qb-sheet dc-qb-sheet-open">
            <div className="dc-qb-sheet-header">
              <div>날짜 선택</div>
              <button type="button" onClick={closeSheets}>
                ✕
              </button>
            </div>

            <div className="dc-qb-date-tabs">
              <div className="active">
                {checkIn ? `입실일 ${formatDateLabel(checkIn)}` : "입실일 선택"}
              </div>
              <div className="active">
                {checkOut
                  ? `퇴실일 ${formatDateLabel(checkOut)}`
                  : "퇴실일 선택"}
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
            >
              적용하기
            </button>
          </div>
        </>
      )}

      {isPeopleSheetOpen && (
        <>
          <div className="dc-qb-sheet-backdrop" onClick={closeSheets} />
          <div className="dc-qb-sheet dc-qb-sheet-open">
            <div className="dc-qb-sheet-header">
              <div>인원 선택</div>
              <button type="button" onClick={closeSheets}>
                ✕
              </button>
            </div>
            <div className="dc-qb-sheet-sub">
              유아 및 아동도 인원수에 포함해주세요.
            </div>
            <div className="dc-qb-people-row">
              <span>인원</span>
              <div className="dc-qb-people-ctrl">
                <button type="button" onClick={() => handlePeopleChange(-1)}>
                  -
                </button>
                <span>{people}</span>
                <button type="button" onClick={() => handlePeopleChange(1)}>
                  +
                </button>
              </div>
            </div>
            <button
              type="button"
              className="dc-qb-sheet-btn"
              onClick={handlePeopleConfirm}
            >
              적용하기
            </button>
          </div>
        </>
      )}
    </section>
  );
}

export default SiteSelectStep;







