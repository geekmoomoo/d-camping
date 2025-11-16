import React from "react";
import "../../src/index.css";

const STATUS_OPTIONS = [
  { value: "", label: "전체 상태" },
  { value: "PENDING", label: "PENDING" },
  { value: "PAID", label: "PAID" },
  { value: "REFUND", label: "REFUND" },
  { value: "COMPLETED", label: "COMPLETED" },
];

export default function AdminFilterBox({
  filters,
  sites = [],
  onChange,
  onSearch,
  onReset,
}) {
  return (
    <div className="admin-filter-box dc-card">
      <div className="admin-filter-row">
        <label>
          기간
          <div className="admin-filter-input-row">
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(event) => onChange({ dateFrom: event.target.value })}
            />
            <span>~</span>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(event) => onChange({ dateTo: event.target.value })}
            />
          </div>
        </label>
        <label>
          사이트
          <select
            value={filters.siteId}
            onChange={(event) => onChange({ siteId: event.target.value })}
          >
            <option value="">전체</option>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name || site.id}
              </option>
            ))}
          </select>
        </label>
        <label>
          이름
          <input
            type="text"
            placeholder="예약자 이름"
            value={filters.name}
            onChange={(event) => onChange({ name: event.target.value })}
          />
        </label>
        <label>
          연락처
          <input
            type="text"
            placeholder="01012345678"
            value={filters.phone}
            onChange={(event) => onChange({ phone: event.target.value })}
          />
        </label>
        <label>
          상태
          <select
            value={filters.status}
            onChange={(event) => onChange({ status: event.target.value })}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="admin-filter-actions">
        <button type="button" className="dc-btn-primary" onClick={onSearch}>
          검색
        </button>
        <button type="button" className="dc-btn dc-btn-outline" onClick={onReset}>
          초기화
        </button>
      </div>
    </div>
  );
}
