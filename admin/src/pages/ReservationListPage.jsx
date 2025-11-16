import React, { useEffect, useMemo, useState } from "react";
import AdminFilterBox from "../components/AdminFilterBox.jsx";
import AdminTable from "../components/AdminTable.jsx";
import { fetchReservations } from "../services/reservationAdminService.js";
import { getSites } from "../../../src/services/siteService.js";

const PRE_CHECK_LABELS = {
  people: "인원",
  onsite: "현장 결제",
  qa: "질문",
  agree: "동의",
  refund: "환불",
};

const PRE_CHECK_ORDER = ["people", "onsite", "qa", "agree", "refund"];

const renderPreCheckBadges = (flags) => {
  if (!flags) {
    return <span className="dc-status-text">이상 없음</span>;
  }
  const active = PRE_CHECK_ORDER.filter((key) => flags[key]?.active);
  if (!active.length) {
    return <span className="dc-status-text">이상 없음</span>;
  }
  return active.map((key) => (
    <span
      key={key}
      className="dc-tag"
      style={{ marginRight: 4 }}
      title={flags[key]?.message || PRE_CHECK_LABELS[key]}
    >
      {PRE_CHECK_LABELS[key]}
    </span>
  ));
};

const INITIAL_FILTERS = {
  dateFrom: "",
  dateTo: "",
  siteId: "",
  name: "",
  phone: "",
  status: "",
};

export default function ReservationListPage({ onViewDetail }) {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sites, setSites] = useState([]);

  useEffect(() => {
    getSites().then((data) => {
      setSites(data.sites || []);
    });
  }, []);

  const loadReservations = async () => {
    setLoading(true);
    setError("");
    try {
      const payload = await fetchReservations(filters);
      setReservations(payload.reservations || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "예약 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (updates) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const handleSearch = () => {
    loadReservations();
  };

  const handleReset = () => {
    setFilters(INITIAL_FILTERS);
    setTimeout(() => loadReservations(), 0);
  };

  const columns = useMemo(
    () => [
      { label: "예약번호", key: "reservationId" },
      { label: "사이트", key: "siteId" },
      { label: "이름", key: "userName" },
      { label: "연락처", key: "phone" },
      {
        label: "기간 / 박수",
        key: "dates",
        render: (row) =>
          `${row.checkIn || "-"} ~ ${row.checkOut || "-"} / ${
            row.nights ?? 0
          }박`,
      },
      { label: "인원", key: "people" },
      {
        label: "결제금액",
        key: "amount",
        render: (row) => {
          const amount = row.amountBreakdown?.total;
          if (!amount) return "-";
          return `${amount.toLocaleString()}원`;
        },
      },
      { label: "상태", key: "status" },
      {
        label: "환불 상태",
        key: "cancelRequest",
        render: (row) => row.cancelRequest?.status || "-",
      },
      {
        label: "사전 체크",
        key: "preCheckFlags",
        render: (row) => renderPreCheckBadges(row.preCheckFlags),
      },
    ],
    []
  );

  return (
    <div>
      <AdminFilterBox
        filters={filters}
        sites={sites}
        onChange={handleFilterChange}
        onSearch={handleSearch}
        onReset={handleReset}
      />
      {loading && (
        <p className="dc-status-text" style={{ marginTop: 12 }}>
          데이터 불러오는 중...
        </p>
      )}
      {error && (
        <p className="dc-status-text" style={{ marginTop: 12 }}>
          {error}
        </p>
      )}
      {!loading && !error && reservations.length === 0 && (
        <p className="dc-status-text" style={{ marginTop: 12 }}>
          예약 내역이 없습니다.
        </p>
      )}
      {reservations.length > 0 && (
        <>
          <AdminTable
            columns={columns}
            data={reservations}
            onAction={(row) => onViewDetail?.(row)}
          />
          <div className="admin-card-list">
            {reservations.map((reservation) => (
              <div key={reservation.reservationId} className="admin-card-item">
                <div className="admin-card-header">
                  <strong>{reservation.reservationId}</strong>
                  <span>{reservation.status}</span>
                </div>
                <p>
                  {reservation.userName} / {reservation.phone}
                </p>
                <p>
                  {reservation.checkIn} ~ {reservation.checkOut} / {reservation.nights ?? 0}박
                </p>
                <p>
                  결제금액 {reservation.amountBreakdown?.total?.toLocaleString() ?? "-"}원
                </p>
                <div style={{ marginBottom: 8 }}>{renderPreCheckBadges(reservation.preCheckFlags)}</div>
                <button
                  type="button"
                  className="dc-btn dc-btn-outline"
                  onClick={() => onViewDetail?.(reservation)}
                >
                  상세 보기
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
