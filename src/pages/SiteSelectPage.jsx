// src/pages/SiteSelectPage.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import CalendarGrid from "../components/CalendarGrid";

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

const diffDays = (startISO, endISO) => {
  if (!startISO || !endISO) return 0;
  const s = parseISO(startISO);
  const e = parseISO(endISO);
  return Math.round((e - s) / (1000 * 60 * 60 * 24));
};

const formatDateLabel = (iso) => {
  if (!iso) return "";
  const d = parseISO(iso);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${m}/${day}`;
};

function SiteSelectPage() {
  const navigate = useNavigate();

  const [filterData, setFilterData] = useState({
    checkIn: "",
    checkOut: "",
    people: 2,
    siteType: "all",
  });

  const [isDateSheetOpen, setIsDateSheetOpen] = useState(false);
  const [isPeopleSheetOpen, setIsPeopleSheetOpen] = useState(false);

  const [calYear, setCalYear] = useState(() => {
    const t = new Date();
    return t.getFullYear();
  });
  const [calMonth, setCalMonth] = useState(() => {
    const t = new Date();
    return t.getMonth();
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maxCheckInDate = new Date(today);
  maxCheckInDate.setMonth(maxCheckInDate.getMonth() + 1);
  const maxCheckInISO = toISO(maxCheckInDate);

  const selectingCheckOut =
    !!filterData.checkIn && !filterData.checkOut;

  const rangeText =
    filterData.checkIn && filterData.checkOut
      ? `${formatDateLabel(filterData.checkIn)} ~ ${formatDateLabel(
          filterData.checkOut
        )}`
      : "날짜를 선택해주세요";

  // 더미 사이트 데이터
  const sites = [
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

  const filteredSites =
    filterData.siteType && filterData.siteType !== "all"
      ? sites.filter((s) => s.type === filterData.siteType)
      : sites;

  // 달력 셀 생성
  const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
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
    const todayISO = toISO(new Date());

    if (!selectingCheckOut) {
      if (compareISO(iso, todayISO) < 0 || compareISO(iso, maxCheckInISO) > 0)
        return;
      setFilterData((prev) => ({
        ...prev,
        checkIn: iso,
        checkOut: "",
      }));
      return;
    }

    if (compareISO(iso, filterData.checkIn) <= 0) return;
    const nights = diffDays(filterData.checkIn, iso);
    if (nights < 1 || nights > 10) return;

    setFilterData((prev) => ({
      ...prev,
      checkOut: iso,
    }));
  };

  const handlePeopleChange = (delta) => {
    setFilterData((prev) => {
      const next = prev.people + delta;
      if (next < 1) return { ...prev, people: 1 };
      if (next > 16) return { ...prev, people: 16 };
      return { ...prev, people: next };
    });
  };

  const openDateSheet = () => {
    const base = parseISO(filterData.checkIn) || new Date();
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

  const handleSelectSite = (site) => {
    navigate(`/site/${site.id}`, {
      state: {
        site,
        checkInDate: filterData.checkIn,
        checkOutDate: filterData.checkOut,
        peopleCount: filterData.people,
        selectedType: filterData.siteType,
      },
    });
  };

  return (
    <main className="dc-page">
      <header className="dc-header">
        <h1>담양 금성산성 오토캠핑장 빠른 예약</h1>
        <p>입실일 · 퇴실일 · 인원을 선택하고 사이트를 고르세요.</p>
      </header>

      <section className="dc-step-card dc-site-list-wrap">
        {/* 상단: 날짜/인원 바 */}
        <div className="dc-qb-bar-row dc-site-filter-bar">
          <button
            type="button"
            className="dc-qb-btn dc-qb-date-btn"
            onClick={openDateSheet}
          >
            <div className="dc-qb-btn-label">
              <span className="dc-qb-bar-icon">📅</span>
              <span className="dc-qb-btn-main">{rangeText}</span>
            </div>
          </button>

          <button
            type="button"
            className="dc-qb-btn dc-qb-people-btn"
            onClick={openPeopleSheet}
          >
            <div className="dc-qb-btn-label">
              <span className="dc-qb-bar-icon">👤</span>
              <span className="dc-qb-btn-main">
                인원 {filterData.people}명
              </span>
            </div>
          </button>
        </div>

        {/* 사이트 카드 목록 */}
        <div className="dc-site-list">
          {filteredSites.map((site) => {
            let typeClass = "";
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
              <div key={site.id} className="dc-site-card">
                <div className="dc-site-thumb-wrap">
                  <img
                    src={site.squareImg}
                    alt={site.name}
                    className="dc-site-thumb"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                </div>
                <div className="dc-site-info">
                  <div className={`dc-site-type-tag ${typeClass}`}>
                    {typeText}
                  </div>
                  <div className="dc-site-label">
                    {site.zone} 구역 / {site.carOption}
                  </div>
                  <div className="dc-site-capacity">
                    기준 4인 / 최대 5인
                  </div>

                  <div className="dc-site-meta-row">
                    <div className="dc-site-left" />
                    <div className="dc-site-right">
                      <div className="dc-site-remain">
                        남은 자리 {site.remain}개
                      </div>
                      <div className="dc-site-price">
                        {site.price.toLocaleString()}원~
                      </div>
                      <button
                        type="button"
                        className="dc-site-book-btn"
                        onClick={() => handleSelectSite(site)}
                      >
                        예약하기
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 날짜 시트 */}
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
                {filterData.checkIn
                  ? `입실일 ${formatDateLabel(filterData.checkIn)}`
                  : "입실일 선택"}
              </div>
              <div className="active">
                {filterData.checkOut
                  ? `퇴실일 ${formatDateLabel(filterData.checkOut)}`
                  : "퇴실일 선택"}
              </div>
            </div>

            <CalendarGrid
              cells={cells}
              selectingCheckOut={selectingCheckOut}
              today={today}
              maxCheckInISO={maxCheckInISO}
              checkIn={filterData.checkIn}
              checkOut={filterData.checkOut}
              onDateClick={handleDateClick}
              monthLabel={monthLabel}
              onMonthChange={handleMonthChange}
            />

            <button
              type="button"
              className="dc-qb-sheet-btn"
              onClick={closeSheets}
            >
              적용하기
            </button>
          </div>
        </>
      )}

      {/* 인원 시트 */}
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
                <button
                  type="button"
                  onClick={() => handlePeopleChange(-1)}
                >
                  -
                </button>
                <span>{filterData.people}</span>
                <button
                  type="button"
                  onClick={() => handlePeopleChange(1)}
                >
                  +
                </button>
              </div>
            </div>
            <button
              type="button"
              className="dc-qb-sheet-btn"
              onClick={closeSheets}
            >
              적용하기
            </button>
          </div>
        </>
      )}
    </main>
  );
}

export default SiteSelectPage;
