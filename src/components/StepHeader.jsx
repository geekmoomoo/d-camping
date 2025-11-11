import React from "react";

function StepHeader({ title, onBack, onHome }) {
  return (
    <header className="dc-step-header">
      <button type="button" className="dc-step-icon" onClick={onBack}>
        ←
      </button>
      <div className="dc-step-title">{title}</div>
      <button type="button" className="dc-step-icon" onClick={onHome}>
        🏠
      </button>
    </header>
  );
}

export default StepHeader;
