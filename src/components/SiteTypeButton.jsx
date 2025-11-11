import React from "react";

function SiteTypeButton({ label, value, siteType, onChange, variant }) {
  const active = siteType === value;
  const toggle = () => onChange(active ? "all" : value);
  const baseClass =
    "dc-qb-type-btn" +
    (active ? " active" : "") +
    (variant === "blue" ? " blue" : "");
  return (
    <button type="button" className={baseClass} onClick={toggle}>
      {label}
    </button>
  );
}

export default SiteTypeButton;
