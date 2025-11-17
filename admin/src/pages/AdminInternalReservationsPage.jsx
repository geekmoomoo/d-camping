import React, { useEffect, useState } from "react";
import { getSites } from "../../../src/services/siteService.js";
import AdminCalendar from "../components/AdminCalendar.jsx";
import {
  cancelInternalReservation,
  createInternalReservation,
  fetchInternalReservations,
  updateInternalReservation,
} from "../services/internalReservationService.js";
import { fetchReservations } from "../services/reservationAdminService.js";

const INTERNAL_TYPE_OPTIONS = [
  { value: "paid", label: "일반 유료" },
  { value: "free", label: "무료" },
  { value: "manual", label: "수동 금액 입력" },
];

const INITIAL_FORM_STATE = {
  siteId: "",
  checkIn: "",
  checkOut: "",
  people: "1",
  internalType: "paid",
  totalAmount: "",
  adminName: "",
  internalMemo: "",
};

const INITIAL_FILTERS = {
  siteId: "",
  from: "",
  to: "",
  internalType: "",
  adminName: "",
};

const TYPE_DESCRIPTIONS = {
  paid: "일반 유료 예약은 기존 요금/요금표 로직으로 금액이 정산됩니다.",
  free: "무료 예약은 총액 0원으로 처리됩니다.",
  manual: "수동 금액은 운영자가 직접 입력한 금액으로 저장됩니다.",
};

function getInternalTypeLabel(type) {
  return (
    INTERNAL_TYPE_OPTIONS.find((option) => option.value === type)?.label || type || "-"
  );
}

function resolveSiteLabel(site) {
  if (!site) return "";
  if (site.zone && site.name) {
    return `${site.zone} · ${site.name}`;
  }
  return site.name || site.zone || site.id || "";
}

function formatAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return "-";
  }
  return `${amount.toLocaleString()}원`;
}

const BLOCKED_STATUSES = new Set(["paid", "confirmed"]);

const normalizeStatus = (status) =>
  (status || "").toString().toLowerCase() || "";

const isBlockingStatus = (status) =>
  BLOCKED_STATUSES.has(normalizeStatus(status));

const parseCalendarDate = (value) => {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const rangesOverlap = (startA, endA, startB, endB) => {
  if (!startA || !endA || !startB || !endB) return false;
  return startA < endB && startB < endA;
};

const rangeConflictsWithBlocked = (start, end, blockedRanges) => {
  const startDate = parseCalendarDate(start);
  const endDate = parseCalendarDate(end);
  if (!startDate || !endDate) return false;
  return blockedRanges.some((range) => {
    const blockedStart = parseCalendarDate(range.checkIn);
    const blockedEnd = parseCalendarDate(range.checkOut);
    return rangesOverlap(startDate, endDate, blockedStart, blockedEnd);
  });
};

const isDayInBlockedRanges = (iso, blockedRanges) => {
  const current = parseCalendarDate(iso);
  if (!current) return false;
  return blockedRanges.some((range) => {
    const from = parseCalendarDate(range.checkIn);
    const to = parseCalendarDate(range.checkOut);
    return from && to && current >= from && current < to;
  });
};

export default function AdminInternalReservationsPage() {
  const [sites, setSites] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM_STATE);
  const [formMessage, setFormMessage] = useState(null);
  const [adminNameError, setAdminNameError] = useState("");
  const [creating, setCreating] = useState(false);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [reservations, setReservations] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState("");
  const [editingReservation, setEditingReservation] = useState(null);
  const [editingValues, setEditingValues] = useState(null);
  const [editingSaving, setEditingSaving] = useState(false);
  const [cancelingId, setCancelingId] = useState(null);
  const [blockedRanges, setBlockedRanges] = useState([]);
  const [calendarSelection, setCalendarSelection] = useState({ start: "", end: "" });
  const [calendarError, setCalendarError] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [calendarLoading, setCalendarLoading] = useState(false);

  useEffect(() => {
    getSites()
      .then((data) => setSites(data.sites || []))
      .catch((err) => console.error("[AdminInternalReservationsPage] site load", err));
  }, []);

  const loadReservations = async () => {
    setLoadingList(true);
    setListError("");
    try {
      const payload = await fetchInternalReservations(filters);
      const records =
        payload?.internalReservations ||
        payload?.reservations ||
        payload?.items ||
        [];
      setReservations(records);
    } catch (err) {
      console.error("internal reservation load failed", err);
      setListError(err.message || "내부 예약 목록을 불러오는 데 실패했습니다.");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadReservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!form.siteId) {
      setBlockedRanges([]);
      setCalendarLoading(false);
      setCalendarError("");
      return;
    }
    let canceled = false;
    setCalendarLoading(true);
    setCalendarError("");
    (async () => {
      try {
        const payload = await fetchReservations({ siteId: form.siteId });
        if (canceled) return;
        const candidates =
          payload?.reservations ||
          payload?.internalReservations ||
          payload?.items ||
          [];
        const blocked = candidates
          .filter((reservation) => reservation.checkIn && reservation.checkOut)
          .filter((reservation) => isBlockingStatus(reservation.status))
          .map((reservation) => ({
            checkIn: reservation.checkIn,
            checkOut: reservation.checkOut,
            source: reservation.source || (reservation.internalType ? "admin" : "user"),
            status: reservation.status,
          }));
        setBlockedRanges(blocked);
      } catch (err) {
        console.error("[AdminInternalReservationsPage] calendar reservation load failed", err);
      } finally {
        if (!canceled) {
          setCalendarLoading(false);
        }
      }
    })();
    return () => {
      canceled = true;
    };
  }, [form.siteId]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleFilterReset = () => {
    setFilters(INITIAL_FILTERS);
    setTimeout(() => loadReservations(), 0);
  };

  const handleFilterSearch = () => {
    loadReservations();
  };

  const handleFormChange = (key, value) => {
    setForm((prev) => {
      const nextForm =
        key === "internalType" && value !== "manual"
          ? { ...prev, [key]: value, totalAmount: "" }
          : { ...prev, [key]: value };
      if (key === "checkIn" || key === "checkOut") {
        setCalendarSelection({
          start: key === "checkIn" ? value : nextForm.checkIn,
          end: key === "checkOut" ? value : nextForm.checkOut,
        });
        setCalendarError("");
      }
      if (key === "siteId") {
        setCalendarSelection({ start: "", end: "" });
        setCalendarError("");
      }
      return nextForm;
    });
    if (key === "adminName" && adminNameError) {
      setAdminNameError("");
    }
  };

  const handleCalendarMonthChange = (offset) => {
    setCalendarMonth((prev) => {
      const date = new Date(prev.year, prev.month + offset, 1);
      return { year: date.getFullYear(), month: date.getMonth() };
    });
  };

  const handleCalendarDateClick = (iso) => {
    if (!iso || !form.siteId) {
      return;
    }
    if (isDayInBlockedRanges(iso, blockedRanges)) {
      setCalendarError("선택한 날짜는 이미 예약된 기간입니다.");
      return;
    }
    const selectionStart = calendarSelection.start;
    const selectionEnd = calendarSelection.end;
    if (!selectionStart || (selectionStart && selectionEnd)) {
      setCalendarSelection({ start: iso, end: "" });
      setForm((prev) => ({ ...prev, checkIn: iso, checkOut: "" }));
      setCalendarError("");
      return;
    }
    const startDate = parseCalendarDate(selectionStart);
    const clickedDate = parseCalendarDate(iso);
    if (startDate && clickedDate && clickedDate <= startDate) {
      setCalendarSelection({ start: iso, end: "" });
      setForm((prev) => ({ ...prev, checkIn: iso, checkOut: "" }));
      setCalendarError("");
      return;
    }
    if (rangeConflictsWithBlocked(selectionStart, iso, blockedRanges)) {
      setCalendarError(
        "선택한 기간에는 이미 예약이 있어 내부 예약을 생성할 수 없습니다."
      );
      return;
    }
    setCalendarSelection({ start: selectionStart, end: iso });
    setForm((prev) => ({
      ...prev,
      checkIn: selectionStart,
      checkOut: iso,
    }));
    setCalendarError("");
  };

  const resetForm = () => {
    setForm(INITIAL_FORM_STATE);
    setCalendarSelection({ start: "", end: "" });
    setCalendarError("");
  };

  const getManualAmountValue = (record) => {
    if (record.internalType === "manual") {
      return record.totalAmount ?? record.amountBreakdown?.total ?? 0;
    }
    return "";
  };

  const handleCreate = async (event) => {
    event?.preventDefault();
    setFormMessage(null);
    setAdminNameError("");
    if (!form.adminName.trim()) {
      setAdminNameError("관리자 이름을 입력해주세요.");
      return;
    }
    if (!form.siteId) {
      setFormMessage({ type: "error", text: "사이트를 선택해 주세요." });
      return;
    }
    if (!form.checkIn || !form.checkOut) {
      setFormMessage({ type: "error", text: "체크인/체크아웃 날짜를 입력해 주세요." });
      return;
    }
    if (new Date(form.checkIn) >= new Date(form.checkOut)) {
      setFormMessage({ type: "error", text: "체크인보다 체크아웃이 늦어야 합니다." });
      return;
    }
    const peopleCount = Number(form.people) || 1;
    if (peopleCount <= 0) {
      setFormMessage({ type: "error", text: "인원은 1명 이상이어야 합니다." });
      return;
    }
    if (form.internalType === "manual" && !form.totalAmount) {
      setFormMessage({ type: "error", text: "수동 입력 금액을 입력해 주세요." });
      return;
    }

    const payload = {
      siteId: form.siteId,
      checkIn: form.checkIn,
      checkOut: form.checkOut,
      people: peopleCount,
      internalType: form.internalType,
      totalAmount:
        form.internalType === "manual" ? Number(form.totalAmount) : form.internalType === "free" ? 0 : undefined,
      adminName: form.adminName.trim(),
      internalMemo: form.internalMemo.trim() || undefined,
    };

    try {
      setCreating(true);
      await createInternalReservation(payload);
      setFormMessage({ type: "success", text: "내부 예약이 생성되었습니다." });
      resetForm();
      loadReservations();
    } catch (err) {
      console.error(err);
      setFormMessage({ type: "error", text: err.message || "내부 예약 생성에 실패했습니다." });
    } finally {
      setCreating(false);
    }
  };

  const handleBeginEdit = (record) => {
    const values = {
      siteId: record.siteId || "",
      checkIn: record.checkIn || "",
      checkOut: record.checkOut || "",
      people: (record.people ?? record.options?.people ?? 1).toString(),
      internalType: record.internalType || "paid",
      totalAmount: getManualAmountValue(record)?.toString() || "",
      adminName: record.adminInfo?.adminName || "",
      internalMemo: record.internalMemo || "",
    };
    setEditingReservation(record);
    setEditingValues(values);
  };

  const handleEditingChange = (key, value) => {
    setEditingValues((prev) => {
      if (!prev) {
        return prev;
      }
      if (key === "internalType" && value !== "manual") {
        return { ...prev, [key]: value, totalAmount: "" };
      }
      return { ...prev, [key]: value };
    });
  };

  const handleSaveEdit = async () => {
    if (!editingReservation || !editingValues) {
      return;
    }
    if (!editingValues.siteId) {
      setFormMessage({ type: "error", text: "수정할 사이트를 선택해 주세요." });
      return;
    }
    if (!editingValues.checkIn || !editingValues.checkOut) {
      setFormMessage({ type: "error", text: "체크인/체크아웃을 입력해 주세요." });
      return;
    }
    if (new Date(editingValues.checkIn) >= new Date(editingValues.checkOut)) {
      setFormMessage({ type: "error", text: "체크인 날짜가 체크아웃보다 뒤일 수 없습니다." });
      return;
    }
    const peopleCount = Number(editingValues.people) || 1;
    if (peopleCount <= 0) {
      setFormMessage({ type: "error", text: "인원은 1명 이상이어야 합니다." });
      return;
    }
    if (editingValues.internalType === "manual" && !editingValues.totalAmount) {
      setFormMessage({ type: "error", text: "수동 금액을 입력해 주세요." });
      return;
    }

    const payload = {
      siteId: editingValues.siteId,
      checkIn: editingValues.checkIn,
      checkOut: editingValues.checkOut,
      people: peopleCount,
      internalType: editingValues.internalType,
      totalAmount:
        editingValues.internalType === "manual"
          ? Number(editingValues.totalAmount)
          : editingValues.internalType === "free"
          ? 0
          : undefined,
      adminName: editingValues.adminName.trim(),
      internalMemo: editingValues.internalMemo.trim() || undefined,
    };
    try {
      setEditingSaving(true);
      await updateInternalReservation(editingReservation.reservationId || editingReservation.id, payload);
      setFormMessage({ type: "success", text: "내부 예약이 수정되었습니다." });
      loadReservations();
      setEditingReservation(null);
      setEditingValues(null);
    } catch (err) {
      console.error(err);
      setFormMessage({ type: "error", text: err.message || "수정에 실패했습니다." });
    } finally {
      setEditingSaving(false);
    }
  };

  const handleCancelReservation = async (record) => {
    const reservationId = record.reservationId || record.id;
    if (!reservationId) return;
    setCancelingId(reservationId);
    try {
      await cancelInternalReservation(reservationId);
      loadReservations();
      setFormMessage({ type: "success", text: "내부 예약이 취소되었습니다." });
      if (editingReservation && (editingReservation.reservationId || editingReservation.id) === reservationId) {
        setEditingReservation(null);
        setEditingValues(null);
      }
    } catch (err) {
      console.error(err);
      setFormMessage({ type: "error", text: err.message || "취소 요청에 실패했습니다." });
    } finally {
      setCancelingId(null);
    }
  };

  const findSiteLabel = (siteId) => {
    const match = sites.find((site) => site.id === siteId);
    return resolveSiteLabel(match) || siteId;
  };

  return (
    <div className="internal-reservation-page">
      <section className="dc-card internal-reservation-form">
        <div className="dc-card-title">내부 예약 생성</div>
        <form className="internal-form-fields" onSubmit={handleCreate}>
          <div className="internal-field-row">
            <label>
              사이트 선택
              <select
                value={form.siteId}
                onChange={(event) => handleFormChange("siteId", event.target.value)}
              >
                <option value="">사이트 선택</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {resolveSiteLabel(site)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              체크인
              <input
                type="date"
                value={form.checkIn}
                onChange={(event) => handleFormChange("checkIn", event.target.value)}
              />
            </label>
            <label>
              체크아웃
              <input
                type="date"
                value={form.checkOut}
                onChange={(event) => handleFormChange("checkOut", event.target.value)}
              />
            </label>
            <label>
              인원
              <input
                type="number"
                min="1"
                value={form.people}
                onChange={(event) => handleFormChange("people", event.target.value)}
              />
            </label>
          </div>
          <div className="internal-calendar-wrapper">
            <AdminCalendar
              year={calendarMonth.year}
              month={calendarMonth.month}
              blockedRanges={blockedRanges}
              selection={calendarSelection}
              onDateClick={handleCalendarDateClick}
              onChangeMonth={handleCalendarMonthChange}
              disabled={!form.siteId}
              loading={calendarLoading}
            />
            {calendarError && (
              <p className="reserve-warning-text">{calendarError}</p>
            )}
            <div className="internal-calendar-legend">
              <span>
                <span className="legend-pill legend-available" />
                예약 가능
              </span>
              <span>
                <span className="legend-pill legend-blocked" />
                이미 예약됨
              </span>
              <span>
                <span className="legend-pill legend-selected" />
                선택한 기간
              </span>
            </div>
          </div>
          <div className="internal-field-row internal-field-row--gap">
            <label>
              예약 유형
              <div className="internal-radio-group">
                {INTERNAL_TYPE_OPTIONS.map((option) => (
                  <label key={option.value} className="internal-radio">
                    <input
                      type="radio"
                      name="internalType"
                      value={option.value}
                      checked={form.internalType === option.value}
                      onChange={(event) => handleFormChange("internalType", event.target.value)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </label>
            <label>
              금액
              <input
                type="number"
                placeholder="원 단위"
                disabled={form.internalType !== "manual"}
                value={form.totalAmount}
                onChange={(event) => handleFormChange("totalAmount", event.target.value)}
              />
              <p className="internal-field-caption">
                {TYPE_DESCRIPTIONS[form.internalType]}
              </p>
            </label>
            <label>
              관리자 이름
              <input
                type="text"
                className={`form-input${adminNameError ? " form-input-error" : ""}`}
                value={form.adminName}
                onChange={(event) => handleFormChange("adminName", event.target.value)}
                placeholder="담당 관리자 이름"
              />
              {adminNameError && (
                <p className="form-error-text">{adminNameError}</p>
              )}
            </label>
            <label className="internal-memo-field">
              메모 (사유)
              <textarea
                placeholder="예: 촬영팀 장기 대여"
                value={form.internalMemo}
                onChange={(event) => handleFormChange("internalMemo", event.target.value)}
              />
            </label>
          </div>
          {formMessage && (
            <p className={`dc-status-text ${formMessage.type === "error" ? "dc-status-text--danger" : ""}`}>
              {formMessage.text}
            </p>
          )}
          <div className="internal-form-actions">
            <button type="submit" className="dc-btn-primary" disabled={creating}>
              {creating ? "생성 중..." : "내부 예약 생성"}
            </button>
            <button
              type="button"
              className="dc-btn dc-btn-outline"
              disabled={creating}
              onClick={resetForm}
            >
              초기화
            </button>
          </div>
        </form>
      </section>

      <section className="dc-card internal-reservation-filters">
        <div className="dc-card-title">내부 예약 검색 / 필터</div>
        <div className="internal-filter-row">
          <label>
            기간 시작
            <input
              type="date"
              value={filters.from}
              onChange={(event) => handleFilterChange("from", event.target.value)}
            />
          </label>
          <label>
            기간 종료
            <input
              type="date"
              value={filters.to}
              onChange={(event) => handleFilterChange("to", event.target.value)}
            />
          </label>
          <label>
            사이트
            <select
              value={filters.siteId}
              onChange={(event) => handleFilterChange("siteId", event.target.value)}
            >
              <option value="">전체</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {resolveSiteLabel(site)}
                </option>
              ))}
            </select>
          </label>
          <label>
            유형
            <select
              value={filters.internalType}
              onChange={(event) => handleFilterChange("internalType", event.target.value)}
            >
              <option value="">전체</option>
              {INTERNAL_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            관리자
            <input
              type="text"
              placeholder="관리자 이름"
              value={filters.adminName}
              onChange={(event) => handleFilterChange("adminName", event.target.value)}
            />
          </label>
        </div>
        <div className="internal-form-actions">
          <button type="button" className="dc-btn-primary" onClick={handleFilterSearch}>
            검색
          </button>
          <button type="button" className="dc-btn dc-btn-outline" onClick={handleFilterReset}>
            필터 초기화
          </button>
        </div>
      </section>

      <section className="dc-card internal-reservation-list">
        <div className="dc-card-title">내부 예약 리스트</div>
        {loadingList && <p className="dc-status-text">목록을 불러오는 중...</p>}
        {listError && (
          <p className="dc-status-text dc-status-text--danger">{listError}</p>
        )}
        {!loadingList && reservations.length === 0 && !listError && (
          <p className="dc-status-text">조건에 맞는 내부 예약이 없습니다.</p>
        )}
        {reservations.length > 0 && (
          <div className="dc-table-wrap">
            <table className="dc-table">
              <thead>
                <tr>
                  <th>예약번호</th>
                  <th>사이트</th>
                  <th>기간</th>
                  <th>인원</th>
                  <th>유형</th>
                  <th>금액</th>
                  <th>관리자</th>
                  <th>상태</th>
                  <th>메모</th>
                  <th>액션</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((row) => {
                  const recordId = row.reservationId || row.id;
                  const peopleCount = row.people ?? row.options?.people ?? "-";
                  const displayAmount =
                    row.internalType === "manual"
                      ? formatAmount(row.totalAmount ?? row.amountBreakdown?.total)
                      : row.internalType === "free"
                      ? "0원"
                      : formatAmount(row.totalAmount ?? row.amountBreakdown?.total);
                  const statusLabel = (row.status || "ACTIVE").toUpperCase();
                  const typeLabel = getInternalTypeLabel(row.internalType);
                  return (
                    <tr key={recordId}>
                      <td>{recordId}</td>
                      <td>{findSiteLabel(row.siteId)}</td>
                      <td>
                        {(row.checkIn || "-") +
                          " ~ " +
                          (row.checkOut || "-") +
                          " (" +
                          (row.nights ?? "-") +
                          "박)"}
                      </td>
                      <td>{peopleCount}</td>
                      <td>{typeLabel}</td>
                      <td>{displayAmount}</td>
                      <td>{row.adminInfo?.adminName || row.adminName || "-"}</td>
                      <td>{statusLabel}</td>
                      <td style={{ minWidth: 160 }}>{row.internalMemo || "-"}</td>
                      <td className="internal-action-column">
                        <button
                          type="button"
                          className="dc-btn dc-btn-outline"
                          onClick={() => handleBeginEdit(row)}
                        >
                          편집
                        </button>
                        <button
                          type="button"
                          className="dc-btn dc-btn-outline"
                          disabled={cancelingId === recordId || statusLabel === "CANCELED"}
                          onClick={() => handleCancelReservation(row)}
                        >
                          {cancelingId === recordId ? "취소 중..." : "취소"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editingReservation && editingValues && (
        <section className="dc-card internal-reservation-edit">
          <div className="dc-card-title">내부 예약 수정</div>
          <div className="internal-edit-grid">
            <label>
              사이트
              <select
                value={editingValues.siteId}
                onChange={(event) => handleEditingChange("siteId", event.target.value)}
              >
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {resolveSiteLabel(site)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              체크인
              <input
                type="date"
                value={editingValues.checkIn}
                onChange={(event) => handleEditingChange("checkIn", event.target.value)}
              />
            </label>
            <label>
              체크아웃
              <input
                type="date"
                value={editingValues.checkOut}
                onChange={(event) => handleEditingChange("checkOut", event.target.value)}
              />
            </label>
            <label>
              인원
              <input
                type="number"
                min="1"
                value={editingValues.people}
                onChange={(event) => handleEditingChange("people", event.target.value)}
              />
            </label>
            <label>
              유형
              <div className="internal-radio-group">
                {INTERNAL_TYPE_OPTIONS.map((option) => (
                  <label key={`edit-${option.value}`} className="internal-radio">
                    <input
                      type="radio"
                      name="editInternalType"
                      value={option.value}
                      checked={editingValues.internalType === option.value}
                      onChange={(event) => handleEditingChange("internalType", event.target.value)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </label>
            <label>
              금액
              <input
                type="number"
                min="0"
                disabled={editingValues.internalType !== "manual"}
                value={editingValues.totalAmount}
                onChange={(event) => handleEditingChange("totalAmount", event.target.value)}
              />
              <p className="internal-field-caption">
                {TYPE_DESCRIPTIONS[editingValues.internalType]}
              </p>
            </label>
            <label>
              관리자 이름
              <input
                type="text"
                value={editingValues.adminName}
                onChange={(event) => handleEditingChange("adminName", event.target.value)}
              />
            </label>
            <label className="internal-memo-field">
              메모 (사유)
              <textarea
                value={editingValues.internalMemo}
                onChange={(event) => handleEditingChange("internalMemo", event.target.value)}
              />
            </label>
          </div>
          <div className="internal-form-actions">
            <button
              type="button"
              className="dc-btn-primary"
              onClick={handleSaveEdit}
              disabled={editingSaving}
            >
              {editingSaving ? "저장 중..." : "수정 저장"}
            </button>
            <button
              type="button"
              className="dc-btn dc-btn-outline"
              onClick={() => {
                setEditingReservation(null);
                setEditingValues(null);
              }}
              disabled={editingSaving}
            >
              편집 취소
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
