// src/MapEditor.jsx
import React, { useRef, useState } from "react";
import mapImage from "./map_02.png"; // 실제 선택에 쓸 지도와 동일한 파일 사용 (map_01이면 그걸 import)

const initialSites = [
  // 지금은 자가 카라반 예시. 카바나/다른 존 할 땐 여기만 바꿔서 쓰면 됨.
  {id: 'B1', type: 'camp', x: 100, y: 100},
  {id: 'B2', type: 'camp', x: 78.2451923076923, y: 71.21158601200989},
  {id: 'B3', type: 'camp', x: 82.21153846153845, y: 70.91016130931355},
  {id: 'B4', type: 'camp', x: 73.85817307692307, y: 66.99164017426116},
  {id: 'B5', type: 'camp', x: 77.58413461538461, y: 66.3134345931944},
  {id: 'B6', type: 'camp', x: 81.43028846153845, y: 65.63522901212764},
  {id: 'B7', type: 'camp', x: 72.89663461538461, y: 62.24420110679383},
  {id: 'B8', type: 'camp', x: 76.92307692307693, y: 61.56599552572707},
  {id: 'B9', type: 'camp', x: 81.00961538461539, y: 60.88778994466031},
  {id: 'B10', type: 'camp', x: 72.41586538461539, y: 57.64747439067467},
  {id: 'B11', type: 'camp', x: 76.08173076923077, y: 56.89391263393383},
  {id: 'B12', type: 'camp', x: 79.98798076923077, y: 55.83892617449664},
  {id: 'B13', type: 'camp', x: 71.51442307692307, y: 53.20146002590369},
  {id: 'B14', type: 'camp', x: 75.24038461538461, y: 52.1464735664665},
  {id: 'B15', type: 'camp', x: 79.0264423076923, y: 50.94077475568115},
  {id: 'B16', type: 'camp', x: 70.37259615384616, y: 48.45402095843636},
  {id: 'B17', type: 'camp', x: 74.21875, y: 46.946897444954665},
  {id: 'B18', type: 'camp', x: 68.6298076923077, y: 44.30943129636171},
  {id: 'B19', type: 'camp', x: 71.7548076923077, y: 41.29518426939833},
];






const MapEditor = () => {
  const wrapperRef = useRef(null);
  const [sites, setSites] = useState(initialSites);
  const [draggingId, setDraggingId] = useState(null);

  const handleMouseDown = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingId(id);
  };

  const handleMouseUp = () => setDraggingId(null);

  const handleMouseMove = (e) => {
    if (!draggingId || !wrapperRef.current) return;

    const rect = wrapperRef.current.getBoundingClientRect();

    // wrapper 안에서의 상대 좌표 (줌 없음, 그대로%)
    const relX = e.clientX - rect.left;
    const relY = e.clientY - rect.top;

    const x = Math.max(0, Math.min(100, (relX / rect.width) * 100));
    const y = Math.max(0, Math.min(100, (relY / rect.height) * 100));

    setSites((prev) =>
      prev.map((s) => (s.id === draggingId ? { ...s, x, y } : s))
    );
  };

  const logSites = () => {
    console.clear();
    console.table(sites);
  };

  // 최소 스타일 (Tailwind 안씀)
  const containerStyle = {
    width: "100%",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#000",
    color: "#fff",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  };

  const toolbarStyle = {
    padding: "6px 10px",
    backgroundColor: "#111827",
    fontSize: "12px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  };

  const btnStyle = {
    padding: "4px 8px",
    borderRadius: "4px",
    border: "none",
    cursor: "pointer",
    backgroundColor: "#059669",
    color: "#fff",
    fontSize: "11px",
  };

  const mapAreaStyle = {
    flex: 1,
    overflow: "auto",
    backgroundColor: "#020817",
    padding: "8px",
  };

  const wrapperStyle = {
    position: "relative",
    display: "inline-block",
  };

  const mapStyle = {
    display: "block",
    width: "1200px", // 기준 고정
    height: "auto",
  };

  const markerStyle = {
    position: "absolute",
    width: "32px",
    height: "32px",
    marginLeft: "-16px", // 중심 보정
    marginTop: "-16px",
    borderRadius: "50%",
    backgroundColor: "rgba(0,0,0,0.85)",
    color: "#00ff00",
    border: "2px solid #ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    fontWeight: "bold",
    cursor: "move",
    userSelect: "none",
    boxShadow: "0 0 8px rgba(0,0,0,0.8)",
    zIndex: 9999,
  };

  const footerStyle = {
    padding: "6px 10px",
    backgroundColor: "#000",
    color: "#22c55e",
    fontSize: "11px",
    fontFamily: "monospace",
    height: "90px",
    overflow: "auto",
  };

  return (
    <div
      style={containerStyle}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div style={toolbarStyle}>
        <span>MapEditor (줌 없이 정확 좌표 찍기용)</span>
        <button style={btnStyle} onClick={logSites}>
          좌표 콘솔 출력
        </button>
      </div>

      <div style={mapAreaStyle}>
        <div ref={wrapperRef} style={wrapperStyle}>
          <img src={mapImage} alt="map" style={mapStyle} />
          {sites.map((s) => (
            <div
              key={s.id}
              style={{
                ...markerStyle,
                left: `${s.x}%`,
                top: `${s.y}%`,
              }}
              onMouseDown={(e) => handleMouseDown(e, s.id)}
            >
              {s.id}
            </div>
          ))}
        </div>
      </div>

      <div style={footerStyle}>
        {sites.map((s) => (
          <div key={s.id}>
            {s.id}: x={s.x.toFixed(2)}, y={s.y.toFixed(2)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MapEditor;
