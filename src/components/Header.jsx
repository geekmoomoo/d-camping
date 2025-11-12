import React, { useState } from "react";

const navLinks = [
  { href: "#reserve-check", label: "예약확인" },
  { href: "#cancel-refund", label: "취소/환불 신청" },
  { href: "#customer-support", label: "고객문의" },
  { href: "#info", label: "이용안내" },
];

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="dc-header">
      <div className="dc-header-inner">
        <div className="dc-header-left">
          <div className="dc-logo-group">
            <div className="dc-logo">담양 금성산성 오토캠핑장</div>
            <div className="dc-logo-sub">Damyang Auto Camping</div>
          </div>
        </div>

        <nav className="dc-nav">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
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
          <div className="dc-nav-sheet">
            <div className="dc-nav-sheet-header">
              <span>메뉴</span>
              <button type="button" onClick={closeMenu} aria-label="메뉴 닫기">
                ×
              </button>
            </div>
            <div className="dc-nav-sheet-links">
              {navLinks.map((link) => (
                <a key={link.href} href={link.href} onClick={closeMenu}>
                  {link.label}
                </a>
              ))}
            </div>
          </div>
          <div className="dc-nav-backdrop" onClick={closeMenu} />
        </>
      )}
    </header>
  );
}

export default Header;

