import React, { useEffect, useRef, useState } from "react";

const defaultImages = [
  "banners/banner1.jpg",
  "banners/banner2.jpg",
  "banners/banner3.jpg",
  "banners/banner4.jpg",
  "banners/banner5.jpg",
];

const defaultItems = defaultImages.map((src, index) => ({
  id: `default-${index}`,
  title: "",
  subtitle: "",
  content: "",
  imageUrl: src,
}));

function ArrowIcon({ direction = "left" }) {
  const path =
    direction === "left"
      ? "M15 6l-6 6 6 6"
      : "M9 6l6 6-6 6";
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}

function HeroCarousel({ images = defaultImages, items = null, onItemClick }) {
  const baseItems = Array.isArray(items) && items.length > 0 ? items : defaultItems;
  const total = baseItems.length;
  const extended = [baseItems[total - 1], ...baseItems, baseItems[0]];

  const [currentIndex, setCurrentIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [dragOffset, setDragOffset] = useState(0);
  const intervalRef = useRef(null);
  const containerRef = useRef(null);
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
    const onVis = () => {
      if (document.hidden) stopAuto();
      else startAuto();
    };
    document.addEventListener("visibilitychange", onVis);
    // Pause when carousel leaves viewport
    const target = containerRef.current;
    let observer = null;
    if (target && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver((entries) => {
        const vis = entries[0]?.isIntersecting;
        if (vis) startAuto(); else stopAuto();
      }, { threshold: 0.1 });
      observer.observe(target);
    }
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      if (observer) observer.disconnect();
      stopAuto();
    };
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

  const handleBannerClick = (banner) => {
    if (dragRef.current.preventClick) return;
    if (typeof onItemClick === "function") {
      onItemClick(banner);
    }
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

  // Ensure indicator stays within 1..total even if transitions are paused
  const displayIndex = ((currentIndex - 1 + total) % total) + 1;

  return (
    <div
      className="dc-hero-carousel"
      ref={containerRef}
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
        {extended.map((banner, i) => {
          const real = i === 0 ? total : i === total + 1 ? 1 : i;
          const current = baseItems[real - 1] || banner;
          const note = current?.content ? current.content.split("\n")[0] : "";
          const imageUrl =
            current?.imageUrl || banner?.imageUrl || defaultImages[0];

          return (
            <div
              className="dc-hero-slide"
              key={`${current?.id || i}-${i}`}
              onClick={() => handleBannerClick(current)}
            >
              <div className="dc-hero-slide-inner">
                {imageUrl ? (
                  <>
                    <img
                      src={imageUrl}
                      alt={current?.title || `Slide ${real}`}
                      onLoad={(e) => {
                        e.currentTarget.dataset.loaded = "true";
                      }}
                      onError={(e) => {
                        e.currentTarget.dataset.failed = "true";
                        e.currentTarget.dataset.loaded = "true";
                      }}
                      data-failed="false"
                      data-loaded="false"
                    />
                    <div className="dc-hero-slide-empty">
                      이미지를 등록해 주세요.
                    </div>
                  </>
                ) : (
                  <div className="dc-hero-slide-empty dc-hero-slide-empty--standalone">
                    이미지를 등록해 주세요.
                  </div>
                )}
                {(current?.title || current?.subtitle || note) && (
                  <div className="dc-hero-slide-copy">
                    {current?.title && (
                      <p className="dc-hero-slide-title">{current.title}</p>
                    )}
                    {current?.subtitle && (
                      <p className="dc-hero-slide-subtitle">
                        {current.subtitle}
                      </p>
                    )}
                    {note && (
                      <p className="dc-hero-slide-note">{note}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <button
        type="button"
        className="dc-hero-arrow dc-hero-arrow--left"
        onClick={prev}
        aria-label="이전 배너"
      >
        <ArrowIcon direction="left" />
      </button>
      <button
        type="button"
        className="dc-hero-arrow dc-hero-arrow--right"
        onClick={next}
        aria-label="다음 배너"
      >
        <ArrowIcon direction="right" />
      </button>
      <div className="dc-hero-dots">
        {baseItems.map((_, i) => (
          <button
            key={i}
            type="button"
            className={
              "dc-hero-dot" + (i + 1 === displayIndex ? " active" : "")
            }
            onClick={() => goTo(i)}
          />
        ))}
      </div>
    </div>
  );
}

export default HeroCarousel;
