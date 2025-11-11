import React, { useEffect, useRef, useState } from "react";

function SiteImageCarousel({ images }) {
  const valid = images && images.length ? images : [];
  const [idx, setIdx] = useState(0);
  const timerRef = useRef(null);
  const dragRef = useRef({ isDown: false, startX: 0, moved: false });
  const containerRef = useRef(null);

  const next = () => setIdx((p) => (p + 1) % valid.length);
  const prev = () => setIdx((p) => (p - 1 + valid.length) % valid.length);

  const startAuto = () => {
    if (timerRef.current || valid.length <= 1) return;
    timerRef.current = setInterval(next, 3000);
  };
  const stopAuto = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    startAuto();
    return () => stopAuto();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valid.length]);

  if (!valid.length) {
    return (
      <div className="dc-site-carousel">
        <div className="dc-hero-slide-empty">이미지를 등록해 주세요.</div>
      </div>
    );
  }

  const onMouseDown = (e) => {
    stopAuto();
    dragRef.current = { isDown: true, startX: e.clientX, moved: false };
  };
  const onMouseMove = (e) => {
    if (!dragRef.current.isDown) return;
    if (Math.abs(e.clientX - dragRef.current.startX) > 5) dragRef.current.moved = true;
  };
  const onMouseUp = (e) => {
    if (!dragRef.current.isDown) return;
    const dx = e.clientX - dragRef.current.startX;
    dragRef.current.isDown = false;
    if (Math.abs(dx) > 40) {
      if (dx > 0) prev(); else next();
    } else if (!dragRef.current.moved && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      if (e.clientX - rect.left < rect.width / 2) prev(); else next();
    }
    startAuto();
  };
  const onMouseLeave = () => {
    if (dragRef.current.isDown) {
      dragRef.current.isDown = false;
      startAuto();
    }
  };

  const onTouchStart = (e) => {
    if (!e.touches.length) return;
    stopAuto();
    dragRef.current = { isDown: true, startX: e.touches[0].clientX, moved: false };
  };
  const onTouchMove = (e) => {
    if (!dragRef.current.isDown || !e.touches.length) return;
    if (Math.abs(e.touches[0].clientX - dragRef.current.startX) > 5) dragRef.current.moved = true;
  };
  const onTouchEnd = (e) => {
    const dx = (e.changedTouches?.[0]?.clientX ?? dragRef.current.startX) - dragRef.current.startX;
    dragRef.current.isDown = false;
    if (Math.abs(dx) > 40) {
      if (dx > 0) prev(); else next();
    }
    startAuto();
  };

  return (
    <div
      className="dc-site-carousel"
      ref={containerRef}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {valid.map((src, i) => (
        <img
          key={`${src}-${i}`}
          src={src}
          alt=""
          className={"dc-site-img" + (i === idx ? " active" : "")}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ))}
      <div className="dc-site-count">{idx + 1} / {valid.length}</div>
    </div>
  );
}

export default SiteImageCarousel;
