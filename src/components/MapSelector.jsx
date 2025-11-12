import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { sites } from "../config/sitesConfig";
import { mockSites } from "../data/mockSites";

const TYPE_OPTIONS = [
  { label: "자가 카라반", value: "caravan" },
  { label: "카바나 데크", value: "cabana" },
  { label: "텐트 사이트", value: "camp" },
  { label: "팬션", value: "room" },
];



const TYPE_FOCUS = {
  caravan: { scale: 3, center: { x: 49.5, y: 93.5 } },
  cabana: { scale: 3, center: { x: 50, y: 83 } },
  camp: { scale: 1.5, center: { x: 50, y: 50 } },
  room: { scale: 3, center: { x: 53, y: 17 } },
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 3.5;
const ZOOM_STEP = 0.25;

function MapSelector({ onNext }) {
  const [selectedType, setSelectedType] = useState(TYPE_OPTIONS[0].value);
  const [selectedSite, setSelectedSite] = useState(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const frameRef = useRef(null);
  const panRef = useRef(null);
  const dragRef = useRef({
    active: false,
    pointerId: null,
    start: { x: 0, y: 0 },
    origin: { x: 0, y: 0 },
  });

  const filteredSites = useMemo(() => {
    if (!selectedType) return [];
    return sites.filter((site) => site.type === selectedType);
  }, [selectedType]);

  const siteDetailsMap = useMemo(() => {
    const map = new Map();
    mockSites.forEach((detail) => map.set(detail.id, detail));
    return map;
  }, []);

  const handleSelectSite = (site) => {
    const detail = siteDetailsMap.get(site.id);
    const nextSite = detail
      ? { ...detail, x: site.x, y: site.y }
      : { ...site, name: site.id, zone: site.id, carOption: "" };
    setSelectedSite(nextSite);
  };

  const handleSubmit = () => {
    if (selectedSite && typeof onNext === "function") {
      onNext(selectedSite);
    }
  };

  const clampOffset = useCallback(
    (nextScale, proposed) => {
      const frame = frameRef.current;
      if (!frame) return proposed;
      const { width, height } = frame.getBoundingClientRect();
      const scaledWidth = width * nextScale;
      const scaledHeight = height * nextScale;
      const minX = Math.min(0, width - scaledWidth);
      const minY = Math.min(0, height - scaledHeight);
      return {
        x: Math.min(0, Math.max(minX, proposed.x)),
        y: Math.min(0, Math.max(minY, proposed.y)),
      };
    },
    []
  );

  const getCenteredOffset = useCallback(
    (nextScale, centerPercent) => {
      const frame = frameRef.current;
      if (!frame) return { x: 0, y: 0 };
      const { width, height } = frame.getBoundingClientRect();
      const target = centerPercent
        ? {
            x: (centerPercent.x / 100) * width,
            y: (centerPercent.y / 100) * height,
          }
        : { x: width / 2, y: height / 2 };
      const desiredCenter = { x: width / 2, y: height / 2 };
      const proposed = {
        x: desiredCenter.x - target.x * nextScale,
        y: desiredCenter.y - target.y * nextScale,
      };
      return clampOffset(nextScale, proposed);
    },
    [clampOffset]
  );

  const focusOnType = useCallback(
    (type) => {
      const focus = TYPE_FOCUS[type];
      if (!focus) return;
      const boundedScale = Math.min(
        MAX_ZOOM,
        Math.max(MIN_ZOOM, focus.scale || MIN_ZOOM)
      );
      setScale(boundedScale);
      setOffset(getCenteredOffset(boundedScale, focus.center));
    },
    [getCenteredOffset]
  );

  useEffect(() => {
    if (selectedType) {
      focusOnType(selectedType);
    }
  }, [selectedType, focusOnType]);

  const handleOverview = useCallback(() => {
    setSelectedSite(null);
    setSelectedType(null);
    setScale(1);
    setOffset(clampOffset(1, { x: 0, y: 0 }));
  }, [clampOffset]);

  const changeZoom = (delta) => {
    setScale((prev) => {
      const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + delta));
      if (next !== prev) {
        setOffset((prevOffset) => clampOffset(next, prevOffset));
      }
      return next;
    });
  };

  const handlePointerDown = (e) => {
    if (
      e.target.closest(".map-selector-point") ||
      e.target.closest(".map-selector-overview")
    )
      return;
    e.preventDefault();
    const pan = panRef.current;
    if (pan) {
      pan.setPointerCapture(e.pointerId);
    }
    dragRef.current = {
      active: true,
      pointerId: e.pointerId,
      start: { x: e.clientX, y: e.clientY },
      origin: { ...offset },
    };
    setIsDragging(true);
  };

  const handlePointerMove = (e) => {
    if (!dragRef.current.active || dragRef.current.pointerId !== e.pointerId)
      return;
    e.preventDefault();
    const dx = e.clientX - dragRef.current.start.x;
    const dy = e.clientY - dragRef.current.start.y;
    const nextOffset = {
      x: dragRef.current.origin.x + dx,
      y: dragRef.current.origin.y + dy,
    };
    setOffset(clampOffset(scale, nextOffset));
  };

  const handlePointerUp = (e) => {
    if (dragRef.current.pointerId !== e.pointerId) return;
    dragRef.current = {
      active: false,
      pointerId: null,
      start: { x: 0, y: 0 },
      origin: { x: 0, y: 0 },
    };
    setIsDragging(false);
    const pan = panRef.current;
    if (pan) {
      pan.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <section className="map-selector">
      <div className="dc-qb-header dc-qb-header-blue">
        <div className="dc-qb-title">
          <span className="dc-qb-title-icon">🗺️</span>
          지도에서 선택
        </div>
      </div>
      <div className="map-selector-type-grid">
        {TYPE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={
              "map-selector-type-btn" +
              (selectedType === option.value ? " active" : "")
            }
            onClick={() => {
              setSelectedSite(null);
              if (selectedType === option.value) {
                focusOnType(option.value);
              } else {
                setSelectedType(option.value);
              }
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="map-selector-canvas" ref={frameRef}>
        <button
          type="button"
          className="map-selector-overview"
          onClick={handleOverview}
        >
          전체보기
        </button>
        <div
          ref={panRef}
          className={
            "map-selector-pan" + (isDragging ? " dragging" : "")
          }
          style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <div
            className="map-selector-stage"
            style={{ transform: `scale(${scale})` }}
          >
            <img src="/img/map_02.png" alt="캠핑장 지도" />
            {filteredSites.map((site) => {
              const isActive = selectedSite?.id === site.id;
              const label =
                site.type === "caravan" || site.type === "cabana"
                  ? site.id.replace(/\D+/g, "")
                  : site.id;
              return (
                <button
                  key={site.id}
                  type="button"
                  className={
                    "map-selector-point" + (isActive ? " selected" : "")
                  }
                  style={{
                    left: `${site.x}%`,
                    top: `${site.y}%`,
                  }}
                  onClick={() => handleSelectSite(site)}
                >
                  {label || site.id}
                </button>
              );
            })}
          </div>
        </div>

        <div className="map-selector-zoom">
          <button
            type="button"
            onClick={() => changeZoom(-ZOOM_STEP)}
            disabled={scale <= MIN_ZOOM}
          >
            -
          </button>
          <button
            type="button"
            onClick={() => changeZoom(ZOOM_STEP)}
            disabled={scale >= MAX_ZOOM}
          >
            +
          </button>
        </div>
      </div>

      <button
        type="button"
        className="map-selector-submit"
        disabled={!selectedSite}
        onClick={handleSubmit}
      >
        {selectedSite ? (
          <>
            <span className="map-selector-submit-site">{selectedSite.id}</span>{" "}
            예약하기
          </>
        ) : (
          "다음으로 이동"
        )}
      </button>
    </section>
  );
}

export default MapSelector;
