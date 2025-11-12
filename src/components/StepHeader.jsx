import React from "react";

function StepHeader({ title, onBack, onHome }) {
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
        <div className="dc-step-title">{title}</div>
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
