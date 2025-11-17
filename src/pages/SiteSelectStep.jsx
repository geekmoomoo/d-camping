import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CalendarGrid from "../components/CalendarGrid";
import {
  compareISO,
  diffDays,
  formatDateLabel,
  parseISO,
  toISO,
} from "../utils/date";
import { getSites } from "../services/siteService";
import { API_BASE } from "../config/api";

const parseSiteIdParts = (siteIdValue) => {
  const text = String(siteIdValue || "").trim().toUpperCase();
  const match = text.match(/^([A-Z]+)(\d+)$/i);
  if (!match) {
    return { prefix: text, number: null, raw: text };
  }
  return { prefix: match[1], number: Number(match[2]), raw: text };
};

const compareSiteId = (a, b) => {
  const idA = parseSiteIdParts(a?.siteId || a?.id);
  const idB = parseSiteIdParts(b?.siteId || b?.id);
  const prefixDiff = idA.prefix.localeCompare(idB.prefix);
  if (prefixDiff !== 0) {
    return prefixDiff;
  }
  if (idA.number !== null && idB.number !== null) {
    return idA.number - idB.number;
  }
  if (idA.number !== null) return -1;
  if (idB.number !== null) return 1;
  return idA.raw.localeCompare(idB.raw);
};

const sortSitesById = (sites) => [...sites].sort(compareSiteId);

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

  const [siteList, setSiteList] = useState([]);
  const [siteAvailability, setSiteAvailability] = useState({});
  const [siteCursor, setSiteCursor] = useState(null);
  const [siteHasMore, setSiteHasMore] = useState(false);
  const [siteLoading, setSiteLoading] = useState(false);
  const [hasLoadedFirstPage, setHasLoadedFirstPage] = useState(false);
  const gridWrapperRef = useRef(null);
  const SITE_PAGE_LIMIT = 10;

  const loadSites = useCallback(async ({ append = false } = {}) => {
    if (siteLoading) return;
    if (append && !siteCursor) return;
    setSiteLoading(true);
    try {
      const options = { limit: SITE_PAGE_LIMIT };
      if (append && siteCursor) {
        options.startAfterId = siteCursor;
      }
      const payload = await getSites(options);
      const nextSites = Array.isArray(payload)
        ? payload
        : payload?.sites || payload?.items || [];
      setSiteList((prev) => {
        const combined = append ? [...prev, ...nextSites] : nextSites;
        return sortSitesById(combined);
      });
      setSiteCursor(payload?.nextStartAfter || null);
      setSiteHasMore(Boolean(payload?.hasMore));
      if (!hasLoadedFirstPage) {
        setHasLoadedFirstPage(true);
      }
    } catch (err) {
      console.error("[SiteSelectStep] loadSites error", err);
      if (!append) {
        setSiteList([]);
      }
    } finally {
      setSiteLoading(false);
    }
  }, [siteCursor, siteLoading]);

  const initialLoadRef = useRef(false);
  useEffect(() => {
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;
    loadSites();
  }, [loadSites]);
  const sentinelRef = useRef(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!hasLoadedFirstPage || !sentinel || !siteHasMore) {
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !siteLoading) {
            loadSites({ append: true });
          }
        });
      },
      {
        root: null,
        rootMargin: "200px",
        threshold: 0.1,
      }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasLoadedFirstPage, siteHasMore, siteLoading, loadSites, siteList.length]);

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
    "날짜를 선택해주세요"
  );

  const filteredSites = useMemo(() => {
    if (data?.siteType && data.siteType !== "all") {
      return siteList.filter((s) => s.type === data.siteType);
    }
    return siteList;
  }, [siteList, data?.siteType]);
  const filteredSiteIds = useMemo(
    () => filteredSites.map((site) => site.id),
    [filteredSites]
  );

  useEffect(() => {
    if (
      !checkIn ||
      !checkOut ||
      filteredSites.length === 0 ||
      !filteredSiteIds.length
    ) {
      setSiteAvailability({});
      return undefined;
    }

    const controller = new AbortController();
    let active = true;

    const fetchSiteAvailability = async () => {
      const updates = {};
      await Promise.all(
        filteredSiteIds.map(async (siteId) => {
          try {
            const params = new URLSearchParams({
              siteId,
              checkIn,
              checkOut,
            });
            const response = await fetch(
              `${API_BASE}/reservations/availability?${params.toString()}`,
              { signal: controller.signal }
            );
            if (!response.ok) {
              throw new Error("availability request failed");
            }
            const data = await response.json();
            updates[siteId] = data.available !== false;
          } catch (err) {
            console.error("[SiteSelectStep] availability error", err);
            updates[siteId] = false;
          }
        })
      );
      if (active) {
        setSiteAvailability(updates);
      }
    };

    fetchSiteAvailability();

    return () => {
      active = false;
      controller.abort();
    };
  }, [checkIn, checkOut, filteredSiteIds.join(",")]);

  return (
    <section className="dc-step-card dc-site-select-card">
      <div className="dc-site-grid-wrapper" ref={gridWrapperRef}>
        <div className="dc-site-grid">
          {filteredSites.length === 0 ? (
            <div className="dc-site-empty">
              <p>표시할 사이트가 없습니다.</p>
            </div>
          ) : (
            filteredSites.map((site) => (
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
                      <div className="dc-site-meta-info">
                        {siteAvailability[site.id] === false ? (
                          <span className="dc-site-remain dc-site-unavailable">
                            해당 날짜 예약완료
                          </span>
                        ) : (
                          <>
                            <span className="dc-site-remain">예약 가능</span>
                            <span
                              className="dc-site-divider"
                              aria-hidden="true"
                            >
                              |
                            </span>
                            <span className="dc-site-price">
                              {site.price?.toLocaleString()}원
                            </span>
                          </>
                        )}
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
            ))
          )}
        </div>
        <div ref={sentinelRef} className="dc-site-sentinel" aria-hidden="true" />
      </div>

      <div className="dc-fixed-filter-bar">
        <button
          type="button"
          className="dc-fixed-filter-btn"
          onClick={openDateSheet}
        >
          {checkIn || checkOut ? rangeText : "날짜선택"}
        </button>
        <button
          type="button"
          className="dc-fixed-filter-btn"
          onClick={openPeopleSheet}
        >
          {`인원 ${people}`}
        </button>
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
              <span className="dc-text-orange">유아 및 아동</span>도 인원수에{" "}
              <span className="dc-text-orange">포함</span>해주세요.
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
