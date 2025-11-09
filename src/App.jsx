import React, { useState, useEffect, useRef } from "react";
import "./index.css";

/* =========================
   Root App
   ========================= */

function App() {
  // step: home -> select-site -> site-detail -> confirm
  const [step, setStep] = useState("home");
  const [quickData, setQuickData] = useState(null);
  const [selectedSite, setSelectedSite] = useState(null);

  const goHome = () => {
    setStep("home");
    setSelectedSite(null);
  };

  // 홈 빠른예약 → 사이트 선택
  const handleQuickNext = (payload) => {
    setQuickData(payload);
    setSelectedSite(null);
    setStep("select-site");
  };

  // 사이트 카드 선택 → 상세
  const handleSiteSelect = (site) => {
    setSelectedSite(site);
    setStep("site-detail");
  };

  // 상세 하단 "예약하기" → 예약확정 페이지
  const handleGoConfirm = () => {
    setStep("confirm");
  };

  // 상세에서 날짜 변경 시 상위 상태도 갱신
  const handleUpdateDatesFromDetail = (partial) => {
    setQuickData((prev) => ({
      ...(prev || {}),
      ...partial,
    }));
  };

  const headerTitle = getHeaderTitle(step, quickData, selectedSite);

  const handleBack = () => {
    if (step === "select-site") {
      setStep("home");
      setSelectedSite(null);
    } else if (step === "site-detail") {
      setStep("select-site");
      setSelectedSite(null);
    } else if (step === "confirm") {
      setStep("site-detail");
    } else {
      goHome();
    }
  };

  return (
    <div className="dc-page">
      {step === "home" ? (
        <>
          <Header />
          <main>
            <section className="dc-hero">
              <div className="dc-hero-left">
                <HeroCarousel />
              </div>
              <div className="dc-hero-search">
                <QuickReserveBox onNext={handleQuickNext} />
                <MapReserveBox />
              </div>
            </section>
            <FeatureSection />
          </main>
          <Footer />
        </>
      ) : (
        <>
          <StepHeader title={headerTitle} onBack={handleBack} onHome={goHome} />
          <main className="dc-step-main">
            {step === "select-site" && (
              <SiteSelectStep
                data={quickData}
                onChangeFilter={setQuickData}
                onSelectSite={handleSiteSelect}
              />
            )}
            {step === "site-detail" && (
              <ReserveStep
                data={quickData}
                site={selectedSite}
                onReserve={handleGoConfirm}
                onUpdateDates={handleUpdateDatesFromDetail}
              />
            )}
            {step === "confirm" && (
              <ConfirmReservePage quickData={quickData} site={selectedSite} />
            )}
          </main>
          <Footer />
        </>
      )}
      
    </div>
  );
  
}

/* =========================
   Helpers
   ========================= */

function getHeaderTitle(step, quickData, selectedSite) {
  const t = quickData?.siteType;
  const typeLabel =
    t === "self-caravan"
      ? "자가 카라반"
      : t === "cabana-deck"
      ? "카바나 데크"
      : t === "tent"
      ? "텐트 사이트"
      : t === "lodging"
      ? "숙박 시설"
      : "캠핑장";

  if (step === "select-site") {
    return `${typeLabel} 사이트 선택`;
  }

  if (step === "site-detail") {
    if (selectedSite?.name) return selectedSite.name;
    return `${typeLabel} 사이트 상세`;
  }

  if (step === "confirm") {
    return "예약하기";
  }

  return "예약 단계";
}

const weekday = ["일", "월", "화", "수", "목", "금", "토"];

const toISO = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const parseISO = (str) => {
  if (!str) return null;
  const d = new Date(str + "T00:00:00");
  return Number.isNaN(d.getTime()) ? null : d;
};

const compareISO = (a, b) => {
  if (!a || !b) return 0;
  if (a === b) return 0;
  return a < b ? -1 : 1;
};

const addDaysISO = (iso, days) => {
  const d = parseISO(iso);
  if (!d) return iso;
  d.setDate(d.getDate() + days);
  return toISO(d);
};

const diffDays = (aISO, bISO) => {
  const a = parseISO(aISO);
  const b = parseISO(bISO);
  if (!a || !b) return 0;
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
};

const formatDateLabel = (iso) => {
  const d = parseISO(iso);
  if (!d) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const w = weekday[d.getDay()];
  return `${mm}.${dd}(${w})`;
};

/* =========================
   Headers
   ========================= */

function Header() {
  return (
    <header className="dc-header">
      <div className="dc-header-left">
        <div className="dc-logo">담양 금성산성 오토캠핑장</div>
      </div>
      <nav className="dc-nav">
        <a href="#reserve-check">예약확인</a>
        <a href="#cancel-refund">취소/환불 요청</a>
        <a href="#customer-support">고객문의</a>
        <a href="#info">이용안내</a>
      </nav>
    </header>
  );
}

function StepHeader({ title, onBack, onHome }) {
  return (
    <header className="dc-step-header">
      <button type="button" className="dc-step-icon" onClick={onBack}>
        ←
      </button>
      <div className="dc-step-title">{title}</div>
      <button type="button" className="dc-step-icon" onClick={onHome}>
        🏠
      </button>
    </header>
  );
}

/* =========================
   Hero Carousel
   ========================= */

function HeroCarousel() {
  const images = [
    "banners/banner1.jpg",
    "banners/banner2.jpg",
    "banners/banner3.jpg",
    "banners/banner4.jpg",
    "banners/banner5.jpg",
  ];
  const total = images.length;
  const extended = [images[total - 1], ...images, images[0]];

  const [currentIndex, setCurrentIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [dragOffset, setDragOffset] = useState(0);
  const intervalRef = useRef(null);
  const dragRef = useRef({
    isDown: false,
    startX: 0,
    deltaX: 0,
    preventClick: false,
  });

  const realIndex =
    currentIndex === 0 ? total : currentIndex === total + 1 ? 1 : currentIndex;

  const next = () => setCurrentIndex((p) => p + 1);
  const prev = () => setCurrentIndex((p) => p - 1);

  const startAuto = () => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(next, 3000);
  };

  const stopAuto = () => {
    if (!intervalRef.current) return;
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  useEffect(() => {
    startAuto();
    return () => stopAuto();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  const handleTransitionEnd = () => {
    if (currentIndex === total + 1) {
      setIsTransitioning(false);
      setCurrentIndex(1);
    } else if (currentIndex === 0) {
      setIsTransitioning(false);
      setCurrentIndex(total);
    }
  };

  useEffect(() => {
    if (!isTransitioning) {
      const id = window.requestAnimationFrame(() => setIsTransitioning(true));
      return () => cancelAnimationFrame(id);
    }
  }, [isTransitioning]);

  const handleBannerClick = (realSlideIndex) => {
    if (dragRef.current.preventClick) return;
    console.log(`배너 ${realSlideIndex} 클릭`);
  };

  const beginDrag = (clientX) => {
    stopAuto();
    dragRef.current = {
      isDown: true,
      startX: clientX,
      deltaX: 0,
      preventClick: false,
    };
    setIsTransitioning(false);
  };

  const moveDrag = (clientX) => {
    const state = dragRef.current;
    if (!state.isDown) return;
    const dx = clientX - state.startX;
    state.deltaX = dx;
    if (Math.abs(dx) > 5) state.preventClick = true;
    setDragOffset(dx);
  };

  const endDrag = () => {
    const state = dragRef.current;
    if (!state.isDown) return;
    const dx = state.deltaX;
    const threshold = 80;

    setIsTransitioning(true);
    setDragOffset(0);

    if (dx > threshold) prev();
    else if (dx < -threshold) next();

    dragRef.current = {
      isDown: false,
      startX: 0,
      deltaX: 0,
      preventClick: state.preventClick,
    };
    startAuto();
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    beginDrag(e.clientX);
  };
  const handleMouseMove = (e) => {
    if (!dragRef.current.isDown) return;
    e.preventDefault();
    moveDrag(e.clientX);
  };
  const handleMouseUp = (e) => {
    if (dragRef.current.isDown) {
      e.preventDefault();
      endDrag();
    }
  };
  const handleMouseLeave = () => {
    if (dragRef.current.isDown) endDrag();
  };

  const handleTouchStart = (e) => {
    if (e.touches.length > 0) beginDrag(e.touches[0].clientX);
  };
  const handleTouchMove = (e) => {
    if (!dragRef.current.isDown) return;
    if (e.touches.length > 0) moveDrag(e.touches[0].clientX);
  };
  const handleTouchEnd = () => {
    endDrag();
  };

  const goTo = (i) => {
    setIsTransitioning(true);
    setCurrentIndex(i + 1);
  };

  return (
    <div
      className="dc-hero-carousel"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="dc-hero-track"
        style={{
          transform: `translateX(calc(-${currentIndex * 100}% + ${dragOffset}px))`,
          transition: isTransitioning ? "transform 0.6s ease-in-out" : "none",
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        {extended.map((src, i) => {
          const real = i === 0 ? total : i === total + 1 ? 1 : i;
          return (
            <div
              className="dc-hero-slide"
              key={`${src}-${i}`}
              onClick={() => handleBannerClick(real)}
            >
              <img
                src={src}
                alt=""
                onError={(e) => {
                  e.target.style.display = "none";
                  e.currentTarget.classList.add("dc-hero-slide-empty");
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="dc-hero-page-indicator-fixed">
        {realIndex} / {total}
      </div>
      <div className="dc-hero-dots">
        {images.map((_, i) => (
          <button
            key={i}
            type="button"
            className={"dc-hero-dot" + (i + 1 === realIndex ? " active" : "")}
            onClick={() => goTo(i)}
          />
        ))}
      </div>
    </div>
  );
}

/* =========================
   Quick Reserve Box
   ========================= */

function QuickReserveBox({ onNext }) {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [people, setPeople] = useState(2);
  const [siteType, setSiteType] = useState("all");
  const [dDay, setDDay] = useState(null);
  const [error, setError] = useState("");

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
      : "날짜를 선택해주세요";

  const openDateSheet = () => {
    setError("");
    const base = parseISO(checkIn) || today;
    setCalYear(base.getFullYear());
    setCalMonth(base.getMonth());
    setIsDateSheetOpen(true);
    setIsPeopleSheetOpen(false);
  };

  const openPeopleSheet = () => {
    setError("");
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
    closeSheets();
  };

  const handlePeopleChange = (delta) => {
    setPeople((prev) => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (next > 16) return 16;
      return next;
    });
  };

  const handlePeopleConfirm = () => {
    setError("");
    closeSheets();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!checkIn || !checkOut) {
      setError("입실/퇴실 날짜를 선택해주세요.");
      return;
    }
    const nights = diffDays(checkIn, checkOut);
    if (nights < 1 || nights > 10) {
      setError("예약은 최대 10박까지 가능합니다.");
      return;
    }
    if (people < 1) {
      setError("인원을 1명 이상으로 입력해주세요.");
      return;
    }

    const payload = {
      checkIn,
      checkOut,
      people,
      siteType,
    };

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
    closeSheets();
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

  return (
    <>
      <form className="dc-qb dc-qb-quick" onSubmit={handleSubmit}>
        <div className="dc-qb-header dc-qb-header-green">
          <div className="dc-qb-title">⚡ 빠른 예약</div>
        </div>

        <div className="dc-qb-bar-row">
          <button
            type="button"
            className="dc-qb-btn dc-qb-date-btn"
            onClick={openDateSheet}
          >
            <div className="dc-qb-btn-label">
              <span className="dc-qb-bar-icon">📅</span>
              <span
                className={
                  checkIn && checkOut
                    ? "dc-qb-btn-main"
                    : "dc-qb-btn-main dc-qb-bar-placeholder"
                }
              >
                {rangeText}
              </span>
            </div>
            <div className="dc-qb-btn-sub">
              {checkIn && dDay !== null ? `D-${dDay}` : "날짜 선택"}
            </div>
          </button>

          <button
            type="button"
            className="dc-qb-btn dc-qb-people-btn"
            onClick={openPeopleSheet}
          >
            <div className="dc-qb-btn-label">
              <span className="dc-qb-bar-icon">👤</span>
              <span className="dc-qb-btn-main">인원 {people}명</span>
            </div>
            <div className="dc-qb-btn-sub">변경</div>
          </button>
        </div>

        <div className="dc-qb-type-label">
          이용 유형
          <span className="dc-qb-type-tip">(선택 안 하면 전체 보기)</span>
        </div>
        <div className="dc-qb-type-grid">
          <TypeButton
            label="자가 카라반"
            value="self-caravan"
            siteType={siteType}
            setSiteType={setSiteType}
          />
          <TypeButton
            label="카바나 데크"
            value="cabana-deck"
            siteType={siteType}
            setSiteType={setSiteType}
          />
          <TypeButton
            label="텐트 사이트"
            value="tent"
            siteType={siteType}
            setSiteType={setSiteType}
          />
          <TypeButton
            label="숙박 시설"
            value="lodging"
            siteType={siteType}
            setSiteType={setSiteType}
          />
        </div>

        <div className="dc-qb-actions dc-qb-actions-full">
          <button type="submit" className="dc-btn-primary">
            다음 단계로 진행
          </button>
          <button
            type="button"
            className="dc-btn-outline"
            onClick={handleReset}
          >
            초기화
          </button>
        </div>

        {error && <div className="dc-qb-error">{error}</div>}
        <p className="dc-qb-helper">
          예약은 오늘부터 한 달 이내, 최대 10박까지 선택 가능
        </p>
      </form>

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
    </>
  );
}

/* 공통 Calendar Grid */

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

/* 유형 버튼 */

function TypeButton({ label, value, siteType, setSiteType, variant }) {
  const active = siteType === value;
  const toggle = () => setSiteType(active ? "all" : value);
  const baseClass =
    "dc-qb-type-btn" +
    (active ? " active" : "") +
    (variant === "blue" ? " blue" : "");
  return (
    <button type="button" className={baseClass} onClick={toggle}>
      {label}
    </button>
  );
}

/* =========================
   Map Reserve Box
   ========================= */

function MapReserveBox() {
  const [siteType, setSiteType] = useState("all");
  const [zone, setZone] = useState("");
  const [error, setError] = useState("");

  const zoneOptions = {
    "self-caravan": ["카라반 A존 (1~7번)", "카라반 B존 (8~14번)", "카라반 C존 (15~21번)"],
    "cabana-deck": ["카바나존 (1~4번)", "카바나존 (5~8번)", "카바나존 (9~12번)"],
    tent: ["텐트 A존 (1~15번)", "텐트 B존 (16~30번)", "텐트 C존 (31~43번)"],
    lodging: ["숙박동 1~5동", "숙박동 6~10동", "숙박동 11~15동"],
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (siteType === "all") {
      setError("이용 유형을 선택해주세요.");
      return;
    }
    if (!zone) {
      setError("지도에서 원하는 구역을 선택해주세요.");
      return;
    }
    console.log("지도에서 선택:", siteType, zone);
  };

  const handleReset = () => {
    setSiteType("all");
    setZone("");
    setError("");
  };

  const currentZones = siteType !== "all" ? zoneOptions[siteType] || [] : [];

  return (
    <form className="dc-qb dc-qb-map" onSubmit={handleSubmit}>
      <div className="dc-qb-header dc-qb-header-blue">
        <div className="dc-qb-title dc-qb-map-title">🗺️ 지도에서 선택</div>
      </div>

      <div className="dc-qb-type-label">
        이용 유형
        <span className="dc-qb-type-tip">
          (타입 선택 후, 지도에서 구역 선택)
        </span>
      </div>
      <div className="dc-qb-type-grid">
        <TypeButton
          label="자가 카라반"
          value="self-caravan"
          siteType={siteType}
          setSiteType={setSiteType}
          variant="blue"
        />
        <TypeButton
          label="카바나 데크"
          value="cabana-deck"
          siteType={siteType}
          setSiteType={setSiteType}
          variant="blue"
        />
        <TypeButton
          label="텐트 사이트"
          value="tent"
          siteType={siteType}
          setSiteType={setSiteType}
          variant="blue"
        />
        <TypeButton
          label="숙박 시설"
          value="lodging"
          siteType={siteType}
          setSiteType={setSiteType}
          variant="blue"
        />
      </div>

      <div className="dc-map-area">
        {siteType === "all" ? (
          <p className="dc-map-hint">
            상단에서 이용 유형을 선택하면, 해당 구역이 여기에서 표시됩니다.
          </p>
        ) : (
          <>
            <div className="dc-map-label">선택 가능한 구역</div>
            <div className="dc-map-zones">
              {currentZones.map((z) => (
                <label
                  key={z}
                  className={
                    "dc-map-zone" + (zone === z ? " active" : "")
                  }
                >
                  <input
                    type="radio"
                    name="map-zone"
                    value={z}
                    checked={zone === z}
                    onChange={() => setZone(z)}
                  />
                  <span>{z}</span>
                </label>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="dc-qb-actions dc-qb-actions-full">
        <button
          type="submit"
          className="dc-btn-primary dc-btn-map-primary"
        >
          다음 단계로 진행
        </button>
        <button
          type="button"
          className="dc-btn-outline dc-btn-map-outline"
          onClick={handleReset}
        >
          초기화
        </button>
      </div>

      {error && <div className="dc-qb-error dc-qb-map-error">{error}</div>}
    </form>
  );
}

/* =========================
   Feature Section
   ========================= */

function FeatureSection() {
  return (
    <section className="dc-section">
      <h2>이 캠핑장에서 누릴 수 있는 것들</h2>
      <div className="dc-cat-grid">
        <div className="dc-cat-item">
          <div className="dc-cat-icon">🚙</div>
          <div className="dc-cat-label">자가 카라반 사이트</div>
          <div className="dc-cat-desc">여유 있는 크기, 차량 옆 캠핑.</div>
        </div>
        <div className="dc-cat-item">
          <div className="dc-cat-icon">🏕️</div>
          <div className="dc-cat-label">카바나 데크 사이트</div>
          <div className="dc-cat-desc">덮개와 데크로 아늑한 감성 캠핑.</div>
        </div>
        <div className="dc-cat-item">
          <div className="dc-cat-icon">⛺</div>
          <div className="dc-cat-label">텐트 사이트</div>
          <div className="dc-cat-desc">자유롭게 텐트 설치 가능한 잔디.</div>
        </div>
        <div className="dc-cat-item">
          <div className="dc-cat-icon">🏡</div>
          <div className="dc-cat-label">숙박 시설</div>
          <div className="dc-cat-desc">가족용 독립형 숙박동.</div>
        </div>
      </div>
    </section>
  );
}

/* =========================
   Site Select Step
   ========================= */

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
      : "날짜를 선택해주세요";

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
    data?.siteType && data.siteType !== "all"
      ? sites.filter((s) => s.type === data.siteType)
      : sites;

  return (
    <section className="dc-step-card dc-site-list-wrap">
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
            <span className="dc-qb-btn-main">인원 {people}명</span>
          </div>
        </button>
      </div>

      <div className="dc-site-list">
        {filteredSites.map((site) => (
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
              {(() => {
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
                  <>
                    <div className={`dc-site-type-tag ${typeClass}`}>
                      {typeText}
                    </div>
                    <div className="dc-site-label">
                      {site.zone} 구역 / {site.carOption}
                    </div>
                    <div className="dc-site-capacity">
                      기준 4인 / 최대 5인
                    </div>
                  </>
                );
              })()}

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

/* =========================
   Site Detail Step
   ========================= */

function ReserveStep({ data, site, onReserve, onUpdateDates }) {
  const metaTitle = site?.name || "카바나 데크";

  const images = [
    "/site_img/site_001.jpg",
    "/site_img/site_002.jpg",
    "/site_img/site_003.jpg",
    "/site_img/site_004.jpg",
  ];

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
      : "입실/퇴실일을 선택해주세요";

  const handleReserveClick = () => {
    if (!checkIn || !checkOut) {
      alert("입실일과 퇴실일을 먼저 선택해주세요.");
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
            <span className="dc-site-pill">카바나 데크</span>
            <span className="dc-site-time">입실 13:00 - 퇴실 11:00</span>
          </div>
          <div className="dc-site-people">
            <span className="dc-site-people-icon">👤</span>
            기준 4인 / 최대 5인
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

        {/* 상품소개 */}
        <div className="dc-site-desc">
          <div className="dc-site-desc-title">상품소개</div>
          <ul className="dc-site-desc-list">
            <li>
              22년도 수영장 오픈은 7월 20일 예정입니다. 오픈 일정은 업체
              사정에 따라 변동될 수 있습니다.
            </li>
            <li>기준 인원 4인, 최대 인원 5인</li>
          </ul>
          <div className="dc-site-desc-subtitle">예약방법안내</div>
          <ul className="dc-site-desc-list">
            <li>입실일과 퇴실일을 클릭하시면 됩니다.</li>
            <li>
              예시) 8월 1일 ~ 8월 4일 (3박4일) → 8/1(입실), 8/4(퇴실) 클릭
            </li>
          </ul>
          <div className="dc-site-desc-subtitle">시설상태</div>
          <ul className="dc-site-desc-list">
            <li>전기, 온수, 배수 양호, 화로대 사용 가능 (전 구역 자갈 양호)</li>
            <li>
              부대시설: 펜션 1개동, 관리동(화장실/샤워실 남·녀, 개수대),
              농구대, 잔디마당, 야외 수영장
            </li>
          </ul>
        </div>

        {/* 알립니다 */}
        <div className="dc-site-desc">
          <div className="dc-site-desc-title">알립니다</div>
          <div className="dc-site-alert">
            알림 내용을 읽지 않고 발생하는 불이익에 대해 책임지지 않습니다.
          </div>
          <ul className="dc-site-desc-list">
            <li>기준 인원 초과 시 1인당 추가 요금이 발생할 수 있습니다.</li>
            <li>여름 성수기 텐트촌 에어컨 사용 시 전기요금이 별도 부과됩니다.</li>
            <li>예약 변경은 불가하며, 취소 후 재예약해야 합니다.</li>
            <li>10:30~11:30 매너타임을 꼭 지켜주세요.</li>
            <li>입실 13시 / 퇴실 12시를 준수해주세요.</li>
          </ul>
        </div>

        {/* 취소 수수료 안내 (아코디언) */}
        <CancelPolicyAccordion />
      </section>

      {/* 하단 고정 예약 바 */}
      <div className="dc-fixed-reserve-bar">
        <button
          type="button"
          className="dc-fixed-date"
          onClick={openDateSheet}
        >
          <span className="dc-fixed-date-icon">📅</span>
          <span className="dc-fixed-date-text">{rangeText}</span>
        </button>
        <button
          type="button"
          className="dc-fixed-reserve-btn"
          onClick={handleReserveClick}
        >
          예약하기
        </button>
      </div>

      {/* 날짜 변경 시트 */}
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
    </>
  );
}

/* =========================
   Cancel Policy Accordion
   ========================= */

function CancelPolicyAccordion() {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen((v) => !v);

  return (
    <div className="dc-cancel-wrap">
      <button
        type="button"
        className="dc-cancel-header"
        onClick={toggle}
      >
        <span className="dc-cancel-title">취소수수료 안내</span>
        <span className={"dc-cancel-arrow" + (open ? " open" : "")}>⌃</span>
      </button>
      {open && (
        <div className="dc-cancel-body">
          <table className="dc-cancel-table">
            <thead>
              <tr>
                <th>취소 기준</th>
                <th>취소 수수료율</th>
                <th>환불률</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>이용일 7일 전</td>
                <td>수수료 없음</td>
                <td>전액 환불</td>
              </tr>
              <tr>
                <td>이용일 6일 전</td>
                <td>50%</td>
                <td>50%</td>
              </tr>
              <tr>
                <td>이용일 5일 전</td>
                <td>50%</td>
                <td>50%</td>
              </tr>
              <tr>
                <td>이용일 4일 전</td>
                <td>50%</td>
                <td>50%</td>
              </tr>
              <tr>
                <td>이용일 3일 전</td>
                <td>50%</td>
                <td>50%</td>
              </tr>
              <tr>
                <td>이용일 2일 전</td>
                <td>70%</td>
                <td>30%</td>
              </tr>
              <tr>
                <td>이용일 1일 전</td>
                <td>100%</td>
                <td>환불 없음</td>
              </tr>
              <tr>
                <td>이용일 당일</td>
                <td>100%</td>
                <td>환불 없음</td>
              </tr>
            </tbody>
          </table>
          <div className="dc-cancel-text">
            <p>
              예약취소는 "MYPAGE" 혹은 "예약확인/취소"에서 가능하며,
              취소수수료는 입실일 기준 남은 날짜에 따라 부과됩니다.
            </p>
            <p>
              우천, 단순 변심 등은 일반 환불 규정이 적용되며 상세 내용은
              캠핑장 안내를 참고해주세요.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================
   Site Detail Carousel
   ========================= */

function SiteImageCarousel({ images }) {
  const valid = images && images.length ? images : [];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (valid.length <= 1) return;
    const id = setInterval(
      () => setIdx((p) => (p + 1) % valid.length),
      2000
    );
    return () => clearInterval(id);
  }, [valid.length]);

  if (!valid.length) {
    return (
      <div className="dc-site-carousel">
        <div className="dc-hero-slide-empty">
          사이트 이미지를 등록해주세요.
        </div>
      </div>
    );
  }

  return (
    <div className="dc-site-carousel">
      {valid.map((src, i) => (
        <img
          key={`${src}-${i}`}
          src={src}
          alt=""
          className={
            "dc-site-img" + (i === idx ? " active" : "")
          }
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
      ))}
      <div className="dc-site-count">
        {idx + 1} / {valid.length}
      </div>
    </div>
  );
}

/* =========================
   Confirm Reserve Page
   ========================= */

function ConfirmReservePage({ quickData }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = toISO(today);

  const checkIn = quickData?.checkIn || "";
  const checkOut = quickData?.checkOut || "";
  const people = quickData?.people || 2;

  const d = checkIn ? diffDays(todayISO, checkIn) : null;
  const dLabel =
    d === null
      ? "-"
      : d > 0
      ? `D-${d}`
      : d === 0
      ? "D-Day"
      : "지난 날짜";

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [request, setRequest] = useState("");
  const [extraCnt, setExtraCnt] = useState(0);

  const [qa, setQa] = useState({
    q1: false,
    q2: "",
    q3: false,
    q4: false,
    q5: false,
    q6: false,
    q7: false,
    q8: false,
  });

  const [agree, setAgree] = useState({
    all: false,
    a1: false,
    a2: false,
    a3: false,
    a4: false,
    a5: false,
  });

  const handleExtraChange = (delta) => {
    setExtraCnt((prev) => {
      const next = prev + delta;
      if (next < 0) return 0;
      if (next > 10) return 10;
      return next;
    });
  };

  const toggleQa = (key) =>
    setQa((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleAgreeToggle = (key) => {
    if (key === "all") {
      const next = !agree.all;
      setAgree({
        all: next,
        a1: next,
        a2: next,
        a3: next,
        a4: next,
        a5: next,
      });
    } else {
      const next = { ...agree, [key]: !agree[key] };
      next.all = next.a1 && next.a2 && next.a3 && next.a4 && next.a5;
      setAgree(next);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("예약자 이름을 입력해주세요.");
      return;
    }
    if (!phone.trim()) {
      alert("휴대폰 번호를 입력해주세요.");
      return;
    }
    if (!(agree.a1 && agree.a2 && agree.a3 && agree.a4 && agree.a5)) {
      alert("모든 필수 약관에 동의해주세요.");
      return;
    }
    alert("예약 정보가 완료되었습니다. (실제 결제/전송 로직 연동 필요)");
  };

  return (
    <form
      className="dc-step-card dc-confirm-wrap"
      onSubmit={handleSubmit}
    >
      {/* 상단 일정 요약 */}
      <div className="dc-confirm-top">
        <div className="dc-confirm-camp-name">
          카바나 데크
        </div>

        <div className="dc-confirm-date-cards">
          <div className="dc-confirm-date-card">
            <div className="label">입실일</div>
            <div className="date">
              {checkIn ? formatDateLabel(checkIn) : "-"}
            </div>
          </div>
          <div className="dc-confirm-date-card">
            <div className="label">퇴실일</div>
            <div className="date">
              {checkOut ? formatDateLabel(checkOut) : "-"}
            </div>
          </div>
        </div>

        <div className="dc-confirm-dday">
          캠핑 가는 날{" "}
          <span className="point">{dLabel}</span>
        </div>
      </div>

      {/* 예약자 정보 */}
      <section className="dc-confirm-section">
        <h3>예약자 정보</h3>
        <div className="dc-field">
          <label>
            예약자 이름 <span className="req">*</span>
          </label>
          <input
            type="text"
            placeholder="예약자 이름을 입력해주세요."
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="dc-field">
          <label>
            휴대폰 번호 <span className="req">*</span>
          </label>
          <input
            type="tel"
            placeholder="휴대폰 번호를 입력해주세요."
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div className="dc-field">
          <label>이메일 (선택)</label>
          <input
            type="email"
            placeholder="(선택) 이메일을 입력해주세요."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="dc-field">
          <label>요청사항 (선택)</label>
          <textarea
            placeholder="(선택) 요청사항을 입력해주세요."
            value={request}
            onChange={(e) => setRequest(e.target.value)}
          />
        </div>
      </section>

      {/* 추가 옵션 */}
      <section className="dc-confirm-section">
        <h3>추가 옵션</h3>
        <div className="dc-option-box">
          <div className="dc-option-label-row">
            <span className="dc-option-badge">현장결제</span>
            <span className="dc-option-title">
              기준 인원 초과 시 모든 연령 1인 1박당 10,000원
            </span>
          </div>
          <p className="dc-option-help">
            상품 요금은 기준 인원에 대한 요금이며, 기준 인원 초과 시 추가
            인원 요금이 발생합니다. (최대 인원 초과 입실 불가)
          </p>
          <div className="dc-option-bottom">
            <div className="dc-option-price">10,000원</div>
            <div className="dc-option-counter">
              <button
                type="button"
                onClick={() => handleExtraChange(-1)}
              >
                -
              </button>
              <span>{extraCnt}</span>
              <button
                type="button"
                onClick={() => handleExtraChange(1)}
              >
                +
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 예약자 질의응답 */}
      <section className="dc-confirm-section">
        <h3>예약자 질의응답</h3>

        <QaToggle
          label="[예약안내] 어린이/연휴 기간 관련 안내를 확인하셨나요?"
          qaKey="q1"
          checked={qa.q1}
          onToggle={toggleQa}
        />
        <QaInput
          label="[필수] 본인 포함 총 방문 인원 수를 입력해주세요. (기준 인원 초과 시 현장 결제)"
          value={qa.q2}
          onChange={(v) => setQa((p) => ({ ...p, q2: v }))}
        />
        <QaToggle
          label="[예약안내] 1사이트 1차량, 추가 차량은 외부 주차 안내를 확인하셨나요?"
          qaKey="q3"
          checked={qa.q3}
          onToggle={toggleQa}
        />
        <QaToggle
          label="[예약안내] 취소·환불 규정 및 예약변경 불가 안내를 확인하셨나요?"
          qaKey="q4"
          checked={qa.q4}
          onToggle={toggleQa}
        />
        <QaToggle
          label="[예약안내] 중복 예약 및 요금 오류 관련 안내를 확인하셨나요?"
          qaKey="q5"
          checked={qa.q5}
          onToggle={toggleQa}
        />
        <QaToggle
          label="[예약안내] 매너타임(22:30~11:30) 준수에 동의하시나요?"
          qaKey="q6"
          checked={qa.q6}
          onToggle={toggleQa}
        />
        <QaToggle
          label="[예약안내] 본 시설 이용수칙 및 환불 규정에 동의하시나요?"
          qaKey="q7"
          checked={qa.q7}
          onToggle={toggleQa}
        />
        <QaToggle
          label="[예약안내] 만 19세 이상이며, 모든 안내사항을 확인하셨나요?"
          qaKey="q8"
          checked={qa.q8}
          onToggle={toggleQa}
        />
      </section>

      {/* 약관 동의 */}
      <section className="dc-confirm-section">
        <h3>약관 전체 동의</h3>
        <label className="dc-agree-all">
          <input
            type="checkbox"
            checked={agree.all}
            onChange={() => handleAgreeToggle("all")}
          />
          <span>(필수) 약관 전체 동의</span>
        </label>
        <ul className="dc-agree-list">
          <AgreeItem
            label="(필수) 취소 및 환불 규정 동의"
            checked={agree.a1}
            onToggle={() => handleAgreeToggle("a1")}
          />
          <AgreeItem
            label="(필수) 숙소 이용 규칙 및 주의사항 동의"
            checked={agree.a2}
            onToggle={() => handleAgreeToggle("a2")}
          />
          <AgreeItem
            label="(필수) 개인정보 수집 및 이용 동의"
            checked={agree.a3}
            onToggle={() => handleAgreeToggle("a3")}
          />
          <AgreeItem
            label="(필수) 개인정보 제3자 제공 동의"
            checked={agree.a4}
            onToggle={() => handleAgreeToggle("a4")}
          />
          <AgreeItem
            label="(필수) 만 19세 이상 이용 동의"
            checked={agree.a5}
            onToggle={() => handleAgreeToggle("a5")}
          />
        </ul>
      </section>

      {/* 제출 버튼 */}
      <div className="dc-confirm-submit-wrap">
        <button type="submit" className="dc-confirm-submit-btn">
          예약 신청 완료하기
        </button>
      </div>
    </form>
  );
}

/* 질의응답 컴포넌트 */

function QaToggle({ label, qaKey, checked, onToggle }) {
  return (
    <div className="dc-qa-box">
      <div className="dc-qa-label-row">
        <span className="dc-qa-required">필수</span>
        <p className="dc-qa-text">{label}</p>
      </div>
      <button
        type="button"
        className={
          "dc-qa-toggle" + (checked ? " active" : "")
        }
        onClick={() => onToggle(qaKey)}
      >
        네, 확인했습니다.
      </button>
    </div>
  );
}

function QaInput({ label, value, onChange }) {
  return (
    <div className="dc-qa-box">
      <div className="dc-qa-label-row">
        <span className="dc-qa-required">필수</span>
        <p className="dc-qa-text">{label}</p>
      </div>
      <textarea
        className="dc-qa-input"
        placeholder="필수 질의응답을 입력해주세요."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

/* 약관 아이템 */

function AgreeItem({ label, checked, onToggle }) {
  return (
    <li className="dc-agree-item">
      <label>
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
        />
        <span>{label}</span>
      </label>
      <span className="dc-agree-arrow">›</span>
    </li>
  );
}





/* =========================
   Footer
   ========================= */

function Footer() {
  return (
    <footer className="dc-footer">
      <div>
        <div className="dc-logo-sm">
          담양 금성산성 오토캠핑장
        </div>
        <div>
          예약 및 문의 : 010-0000-0000
          <br />
          주소 : 전라남도 담양군 (실제 주소 입력)
        </div>
      </div>
      <div>
        © {new Date().getFullYear()} Damyang Auto Camping. All Rights Reserved.
      </div>
    </footer>
  );
}

export default App;
