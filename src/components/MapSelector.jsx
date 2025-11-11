import React, { useCallback, useMemo, useRef, useState } from "react";
import { sites } from "../config/sitesConfig";

const TYPE_OPTIONS = [
  { label: "자가 카라반", value: "caravan" },
  { label: "카바나 데크", value: "cabana" },
  { label: "텐트 사이트", value: "camp" },
  { label: "숙박시설", value: "room" },
];

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

  const filteredSites = useMemo(
    () => sites.filter((site) => site.type === selectedType),
    [selectedType]
  );

  const handleSelectSite = (site) => {
    setSelectedSite(site);
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
    if (e.target.closest(".map-selector-point")) return;
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
      <div className="map-selector-header">
        <div className="map-selector-headline">
          <span role="img" aria-hidden="true">
            🗺️
          </span>
          지도에서 선택
        </div>
        <p className="map-selector-sub">
          이용 유형을 고르면 해당 구역이 지도 위에 표시됩니다.
        </p>
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
              setSelectedType(option.value);
              setSelectedSite(null);
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="map-selector-canvas" ref={frameRef}>
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
            −
          </button>
          <button
            type="button"
            onClick={() => changeZoom(ZOOM_STEP)}
            disabled={scale >= MAX_ZOOM}
          >
            ＋
          </button>
        </div>
      </div>

      <button
        type="button"
        className="map-selector-submit"
        disabled={!selectedSite}
        onClick={handleSubmit}
      >
        {selectedSite ? `${selectedSite.id} 예약 진행하기` : "다음 단계로 진행"}
      </button>
    </section>
  );
}

export default MapSelector;
