import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const MENU_ITEMS = [
  { key: "lookup", label: "예약확인", path: "/reservation/lookup" },
  { key: "cancel", label: "취소/환불 요청", path: "/reservation/cancel" },
  { key: "contact", label: "고객문의", path: "/contact" },
  { key: "guide", label: "이용안내", path: "/guide" },
];

function TopMenu() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = (path) => {
    navigate(path);
  };

  return (
    <div
      style={{
        display: "flex",
        gap: "8px",
        padding: "8px 12px",
        borderBottom: "1px solid #e5e5e5",
        overflowX: "auto",
        backgroundColor: "#ffffff",
      }}
    >
      {MENU_ITEMS.map((item) => {
        const isActive = location.pathname.startsWith(item.path);
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => handleClick(item.path)}
            style={{
              flexShrink: 0,
              padding: "6px 10px",
              borderRadius: "999px",
              border: isActive ? "1px solid #2d6cdf" : "1px solid #cccccc",
              backgroundColor: isActive ? "#2d6cdf" : "#ffffff",
              color: isActive ? "#ffffff" : "#333333",
              fontSize: "0.9rem",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export default TopMenu;
