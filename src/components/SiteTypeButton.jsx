import React from "react";

function SiteTypeButton({ label, value, siteType, onChange, variant, icon }) {
  const active = siteType === value;
  const toggle = () => onChange(active ? "all" : value);
  const baseClass =
    "dc-qb-type-btn" +
    (active ? " active" : "") +
    (variant === "blue" ? " blue" : "");
  return (
    <button type="button" className={baseClass} onClick={toggle}>
      {icon && <span className="dc-qb-type-icon">{icon}</span>}
      {label}
    </button>
  );
}

export default SiteTypeButton;
