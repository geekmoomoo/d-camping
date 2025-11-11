import React, { useCallback, useMemo, useRef, useState } from "react";
import { sites as initialSites } from "../config/sitesConfig";

const BASE_WIDTH = 1200;
const BASE_HEIGHT = 957;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3.5;
const ZOOM_STEP = 0.25;

function MapEditor() {
  const [points, setPoints] = useState(initialSites);
  const [zoom, setZoom] = useState(1);
  const stageRef = useRef(null);
  const dragRef = useRef({
    id: null,
    pointerId: null,
    start: { x: 0, y: 0 },
    origin: { x: 0, y: 0 },
  });

  const displayedPoints = useMemo(
    () =>
      points.map((site) => ({
        ...site,
        xPx: (site.x / 100) * BASE_WIDTH,
        yPx: (site.y / 100) * BASE_HEIGHT,
      })),
    [points]
  );

  const clampPercent = useCallback((value, maxPercent) => {
    const clamped = Math.max(0, Math.min(maxPercent, value));
    return clamped;
  }, []);

  const handlePointerDown = (site, e) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = {
      id: site.id,
      pointerId: e.pointerId,
      start: { x: e.clientX, y: e.clientY },
      origin: {
        x: (site.x / 100) * BASE_WIDTH,
        y: (site.y / 100) * BASE_HEIGHT,
      },
    };
    const stage = stageRef.current;
    if (stage && stage.setPointerCapture) {
      stage.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e) => {
    const drag = dragRef.current;
    if (!drag.id || drag.pointerId !== e.pointerId) return;
    e.preventDefault();

    const dx = (e.clientX - drag.start.x) / zoom;
    const dy = (e.clientY - drag.start.y) / zoom;
    const nextXpx = drag.origin.x + dx;
    const nextYpx = drag.origin.y + dy;
    const nextXPercent = clampPercent((nextXpx / BASE_WIDTH) * 100, 100);
    const nextYPercent = clampPercent((nextYpx / BASE_HEIGHT) * 100, 100);

    setPoints((prev) =>
      prev.map((site) =>
        site.id === drag.id
          ? { ...site, x: nextXPercent, y: nextYPercent }
          : site
      )
    );
  };

  const handlePointerUp = (e) => {
    const drag = dragRef.current;
    if (!drag.id || drag.pointerId !== e.pointerId) return;

    const site = points.find((item) => item.id === drag.id);
    if (site) {
      console.log(
        `${site.id}: { x: ${site.x.toFixed(2)}, y: ${site.y.toFixed(2)} }`
      );
    }

    const stage = stageRef.current;
    if (stage && stage.releasePointerCapture) {
      stage.releasePointerCapture(e.pointerId);
    }
    dragRef.current = {
      id: null,
      pointerId: null,
      start: { x: 0, y: 0 },
      origin: { x: 0, y: 0 },
    };
  };

  const changeZoom = (delta) => {
    setZoom((prev) => {
      const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + delta));
      return next;
    });
  };

  return (
    <div className="map-editor">
      <div className="map-editor-toolbar">
        <button type="button" onClick={() => changeZoom(-ZOOM_STEP)}>
          −
        </button>
        <span>{zoom.toFixed(2)}x</span>
        <button type="button" onClick={() => changeZoom(ZOOM_STEP)}>
          ＋
        </button>
      </div>

      <div className="map-editor-frame">
        <div
          className="map-editor-stage"
          ref={stageRef}
          style={{ transform: `scale(${zoom})` }}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <img
            src="/img/map_02.png"
            alt="캠핑장 지도"
            width={BASE_WIDTH}
            height={BASE_HEIGHT}
          />
          {displayedPoints.map((site) => (
            <button
              key={site.id}
              type="button"
              className="map-editor-point"
              style={{
                left: `${site.x}%`,
                top: `${site.y}%`,
              }}
              onPointerDown={(e) => handlePointerDown(site, e)}
            >
              {site.id}
            </button>
          ))}
        </div>
      </div>

      <div className="map-editor-log">
        <h4>현재 좌표 (퍼센트)</h4>
        <pre>
{`[
${points
  .map(
    (site) =>
      `  { id: "${site.id}", type: "${site.type}", x: ${site.x.toFixed(
        2
      )}, y: ${site.y.toFixed(2)} },`
  )
  .join("\n")}
]`}
        </pre>
      </div>
    </div>
  );
}

export default MapEditor;
