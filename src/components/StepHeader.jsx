import React from "react";

function StepHeader({ title, onBack, onHome }) {
  return (
    <header className="dc-step-header">
      <button
        type="button"
        className="dc-step-icon"
        onClick={onBack}
        aria-label="이전 단계로 이동"
      >
        ←
      </button>
      <div className="dc-step-title">{title}</div>
      <button
        type="button"
        className="dc-step-icon"
        onClick={onHome}
        aria-label="홈으로 이동"
      >
        ⌂
      </button>
    </header>
  );
}

export default StepHeader;
