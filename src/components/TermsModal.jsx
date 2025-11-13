import React from "react";

function TermsModal({ term, onClose }) {
  if (!term) return null;

  return (
    <div className="dc-terms-modal-backdrop" onClick={onClose}>
      <div
        className="dc-terms-modal"
        role="dialog"
        aria-modal="true"
        aria-label={term.title}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="dc-terms-modal-header">
          <h3>{term.title}</h3>
          <button
            type="button"
            className="dc-terms-modal-close-btn"
            aria-label="닫기"
            onClick={onClose}
          >
            ×
          </button>
        </header>
        <div className="dc-terms-modal-body">
          {term.sections.map((section) => (
            <div className="dc-terms-modal-section" key={section.title}>
              <p className="dc-terms-modal-section-title">{section.title}</p>
              <ul>
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="dc-terms-modal-footer">
          <button
            type="button"
            className="dc-terms-modal-confirm"
            onClick={onClose}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}

export default TermsModal;
