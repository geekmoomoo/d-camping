import React, { useCallback, useEffect, useRef, useState } from "react";

const navLinks = [
  { id: "lookup", label: "📅 예약확인" },
  { id: "inquiry", label: "💬 고객문의" },
  { id: "guide", label: "📖 이용안내" },
];

function Header({ onMenuSelect }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const headerRef = useRef(null);
  const closeMenu = () => setIsMenuOpen(false);
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);
  const handleLogoKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      scrollToTop();
    }
  };


  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    document.body.style.position = isMenuOpen ? "fixed" : "";
    document.body.style.width = isMenuOpen ? "100%" : "";
    const handleDocumentClick = (event) => {
      if (!isMenuOpen) return;
      if (headerRef.current?.contains(event.target)) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      closeMenu();
    };
    if (isMenuOpen) {
      document.addEventListener("click", handleDocumentClick, true);
    }
    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    };
  }, [isMenuOpen, closeMenu]);
  const handleSelect = (id) => {
    if (onMenuSelect) {
      onMenuSelect(id);
    }
    scrollToTop();
  };

  return (
    <header
      ref={headerRef}
      className={`dc-header${isMenuOpen ? " dc-header-menu-open" : ""}`}
    >
      <div className="dc-header-inner">
        <div className="dc-header-left">
          <div className="dc-logo-group">
            <div
              className="dc-logo"
              role="button"
              tabIndex={0}
              aria-label="홈으로 이동"
              onClick={scrollToTop}
              onKeyDown={handleLogoKeyDown}
            >
              담양 금성산성 오토캠핑장
            </div>
            <div className="dc-logo-sub">Damyang Auto Camping</div>
          </div>
        </div>

        <nav className="dc-nav">
          {navLinks.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => handleSelect(link.id)}
            >
              {link.label}
            </button>
          ))}
        </nav>

        <button
          type="button"
          className="dc-nav-toggle"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-label="메뉴 열기"
          aria-expanded={isMenuOpen}
        >
          ☰
        </button>
      </div>

      {isMenuOpen && (
        <>
          <div
            className="dc-nav-sheet"
          >
            <div
              className="dc-nav-sheet-card"
              role="presentation"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="dc-nav-sheet-header" aria-label="메뉴" />
              <div className="dc-nav-sheet-links">
                {navLinks.map((link) => (
                  <button
                    key={link.id}
                    type="button"
                    onClick={() => {
                      handleSelect(link.id);
                      closeMenu();
                    }}
                  >
                    {link.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div
            className="dc-nav-backdrop"
            onClick={(e) => {
              e.stopPropagation();
              closeMenu();
            }}
          />
        </>
      )}
    </header>
  );
}

export default Header;
