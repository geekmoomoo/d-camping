import React from "react";

const MENU_ITEMS = [
  { id: "dashboard", label: "대시보드" },
  { id: "today", label: "오늘 일정" },
  { id: "siteStatus", label: "사이트 현황" },
  { id: "siteManage", label: "사이트 관리" },
  { id: "reservationList", label: "전체 예약" },
  { id: "internalReservations", label: "내부 예약 관리" },
  { id: "refunds", label: "환불 요청" },
  { id: "banners", label: "배너 관리" },
  { id: "inquiries", label: "문의" },
];

export default function AdminLayout({ activePage, onChangePage, children }) {
  const current = MENU_ITEMS.find((m) => m.id === activePage);

  return (
    <div className="admin-root dc-admin-shell">
      <aside className="admin-sidebar dc-admin-sidebar">
        <div className="admin-logo dc-logo">담양 금성산성 오토캠핑장 관리자</div>
        <nav className="admin-nav dc-nav">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.id}
              className={
                "admin-nav-item dc-nav-item" +
                (activePage === item.id ? " admin-nav-item--active dc-nav-item--active" : "")
              }
              onClick={() => onChangePage(item.id)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="admin-main dc-admin-main">
        <header className="admin-header dc-admin-header">
          <h1 className="admin-title dc-admin-title">
            {current?.label || "관리자 콘솔"}
          </h1>
        </header>
        <section className="admin-content dc-page dc-page--step dc-admin-content">
          {children}
        </section>
      </main>
    </div>
  );
}
