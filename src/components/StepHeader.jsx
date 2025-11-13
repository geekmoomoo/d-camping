import React, { useCallback } from "react";

function StepHeader({ title, onBack, onHome }) {
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);
  const handleTitleKeyDown = useCallback(
    (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        scrollToTop();
      }
    },
    [scrollToTop]
  );

  return (
    <header className="dc-step-header">
      <div className="dc-step-header-inner">
        <button
          type="button"
          className="dc-step-icon"
          onClick={onBack}
          aria-label="뒤로가기 이동"
        >
          <span aria-hidden="true">←</span>
        </button>
        <div
          className="dc-step-title"
          role="button"
          tabIndex={0}
          aria-label="상단으로 이동"
          onClick={scrollToTop}
          onKeyDown={handleTitleKeyDown}
        >
          {title}
        </div>
        <button
          type="button"
          className="dc-step-icon"
          onClick={onHome}
          aria-label="처음으로 이동"
        >
          <span aria-hidden="true">⌂</span>
        </button>
      </div>
    </header>
  );
}

export default StepHeader;
