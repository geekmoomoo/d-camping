import React, { useEffect, useRef, useState } from "react";

const defaultImages = [
  "banners/banner1.jpg",
  "banners/banner2.jpg",
  "banners/banner3.jpg",
  "banners/banner4.jpg",
  "banners/banner5.jpg",
];

function HeroCarousel({ images = defaultImages }) {
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

  const next = () => setCurrentIndex((prev) => prev + 1);
  const prev = () => setCurrentIndex((prev) => prev - 1);

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
      const id = window.requestAnimationFrame(() =>
        setIsTransitioning(true)
      );
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

export default HeroCarousel;
