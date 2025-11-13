// src/pages/SiteSelectStep.jsx
import React, { useEffect, useMemo, useState } from "react";
import CalendarGrid from "../components/CalendarGrid";
import {
  compareISO,
  diffDays,
  formatDateLabel,
  parseISO,
  toISO,
} from "../utils/date";
import { fetchSites, calcPrice } from "../api/client";

function SiteSelectStep({ data, onChangeFilter, onSelectSite }) {
  const initialCheckIn = data?.checkIn || "";
  const initialCheckOut = data?.checkOut || "";
  const initialPeople = data?.people || 2;

  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [people, setPeople] = useState(initialPeople);

  const [isDateSheetOpen, setIsDateSheetOpen] = useState(false);
  const [isPeopleSheetOpen, setIsPeopleSheetOpen] = useState(false);
  const [sites, setSites] = useState([]);
  const [isLoadingSites, setIsLoadingSites] = useState(false);
  const [siteFetchError, setSiteFetchError] = useState("");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maxCheckInDate = new Date(today);
  maxCheckInDate.setMonth(maxCheckInDate.getMonth() + 1);
  const maxCheckInISO = toISO(maxCheckInDate);

  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth()); // 0~11

  const selectingCheckOut = !!checkIn && !checkOut;

  const rangeText =
    checkIn && checkOut
      ? `${formatDateLabel(checkIn)} ~ ${formatDateLabel(checkOut)}`
      : "날짜 선택";

  // 상단 필터 값 변경 시 부모로 전달
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

  // 사이트 목록 불러오기
  useEffect(() => {
    let mounted = true;
    setIsLoadingSites(true);
    setSiteFetchError("");

    fetchSites()
      .then((result) => {
        if (!mounted) return;
        // isActive가 false인 것만 제외
        setSites(result.filter((site) => site.isActive !== false));
      })
      .catch((error) => {
        if (!mounted) return;
        console.error("[SiteSelectStep] fetchSites", error);
        setSiteFetchError(
          error?.message || "사이트 목록을 불러오는 데 실패했습니다."
        );
      })
      .finally(() => {
        if (!mounted) return;
        setIsLoadingSites(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

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

  const hasFullDateRange =
    checkIn && checkOut && compareISO(checkOut, checkIn) > 0;
  const stayNights = hasFullDateRange ? diffDays(checkIn, checkOut) : null;
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

  // 타입 필터 적용
  const filteredSites = useMemo(() => {
    if (data?.siteType && data.siteType !== "all") {
      return sites.filter((s) => s.type === data.siteType);
    }
    return sites;
  }, [data?.siteType, sites]);

  // 🔥 숫자 기반 정렬 (A1 → A2 → ... / CA, CB 등)
  const sortedSites = useMemo(() => {
    return [...filteredSites].sort((a, b) => {
      const prefixA = a.id[0];
      const prefixB = b.id[0];
      const numA = parseInt(a.id.slice(1), 10);
      const numB = parseInt(b.id.slice(1), 10);

      if (prefixA !== prefixB) return prefixA.localeCompare(prefixB);
      return (Number.isNaN(numA) ? 0 : numA) - (Number.isNaN(numB) ? 0 : numB);
    });
  }, [filteredSites]);

  const [sitePrices, setSitePrices] = useState({});

  useEffect(() => {
    if (!checkIn || !checkOut) {
      setSitePrices({});
      return;
    }

    let cancelled = false;

    const loadPrices = async () => {
      const updated = {};
      for (const site of sortedSites) {
        try {
          const result = await calcPrice({
            site,
            checkIn,
            checkOut,
            people,
          });
          if (cancelled) return;
          if (result && typeof result.total === "number") {
            updated[site.id] = result.total;
          }
        } catch (error) {
          console.error("[SiteSelectStep] calcPrice error", error);
        }
      }
      if (!cancelled) {
        setSitePrices(updated);
      }
    };

    loadPrices();
    return () => {
      cancelled = true;
    };
  }, [checkIn, checkOut, people, sortedSites]);

  return (
    <section className="dc-step-card dc-site-select-card">
      <div className="dc-site-grid-wrapper">
        <div className="dc-site-grid">
          {isLoadingSites && (
            <div className="dc-site-grid-placeholder">
              사이트 정보를 불러오는 중입니다...
            </div>
          )}

          {siteFetchError && (
            <div className="dc-site-grid-placeholder dc-site-grid-error">
              {siteFetchError}
            </div>
          )}

          {!isLoadingSites && !siteFetchError && filteredSites.length === 0 && (
            <div className="dc-site-grid-placeholder">
              선택된 조건에 맞는 사이트가 없습니다.
            </div>
          )}

          {sortedSites.map((site) => {
            const remainCount = site.stockTotal ?? site.remain ?? 0;
            const priceAmount = typeof site.price === "number" ? site.price : 0;
            const basePeople = site.basePeople ?? 4;
            const maxPeople = site.maxPeople ?? 5;

            let typeClass = "type-default";
            let typeText = "";

            if (site.type === "self-caravan") {
              typeClass = "type-self-caravan";
              typeText = "자가 카라반존";
            } else if (site.type === "cabana-deck") {
              typeClass = "type-cabana-deck";
              typeText = "카바나 데크존";
            } else if (site.type === "tent") {
              typeClass = "type-tent";
              typeText = "캠핑 사이트";
            } else if (site.type === "pension") {
              typeClass = "type-pension";
              typeText = "숙박 시설";
            }

            return (
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
                  <div className={`dc-site-type-tag ${typeClass}`}>
                    {typeText}
                  </div>
                  <div className="dc-site-label">
                    {site.zone} 구역 / {site.carOption}
                  </div>
                  <div className="dc-site-capacity">
                    기준 {basePeople}인 / 최대 {maxPeople}인
                  </div>

                  <div className="dc-site-meta-row">
                    <div className="dc-site-left" />
                    <div className="dc-site-right">
                      <div className="dc-site-meta-info">
                        <span className="dc-site-remain">
                          남은 사이트 {remainCount}개
                        </span>
                        <span className="dc-site-divider" aria-hidden="true">
                          |
                        </span>
                        <span className="dc-site-price">
                          {typeof sitePrices[site.id] === "number"
                            ? `${sitePrices[site.id].toLocaleString()}원`
                            : priceAmount
                            ? `${priceAmount.toLocaleString()}원`
                            : "요금 확인"}
                        </span>
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
            );
            
          })}
        </div>
      </div>

      {/* 하단 고정 필터 바 */}
      <div className="dc-fixed-filter-bar">
        <button
          type="button"
          className="dc-fixed-filter-btn"
          onClick={openDateSheet}
        >
          {checkIn || checkOut ? rangeText : "날짜 선택"}
        </button>
        <button
          type="button"
          className="dc-fixed-filter-btn"
          onClick={openPeopleSheet}
        >
          인원 {people}
        </button>
      </div>

      {/* 날짜 시트 */}
      {isDateSheetOpen && (
        <>
          <div className="dc-qb-sheet-backdrop" onClick={closeSheets} />
          <div className="dc-qb-sheet dc-qb-sheet-open">
            <div className="dc-qb-sheet-header">
              <div>날짜 선택</div>
              <button type="button" onClick={closeSheets}>
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

      {/* 인원 시트 */}
      {isPeopleSheetOpen && (
        <>
          <div className="dc-qb-sheet-backdrop" onClick={closeSheets} />
          <div className="dc-qb-sheet dc-qb-sheet-open">
            <div className="dc-qb-sheet-header">
              <div>인원 선택</div>
              <button type="button" onClick={closeSheets}>
                닫기
              </button>
            </div>
            <div className="dc-qb-sheet-sub">
              <span className="dc-text-orange">아이 포함</span> 전체 인원을
              입력해 주세요.
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
