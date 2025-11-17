import { API_BASE } from "../config/api";

const ADMIN_BASE = `${API_BASE}/admin`;

export async function fetchReservations(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    params.append(key, value);
  });

  const query = params.toString();
  const response = await fetch(
    `${ADMIN_BASE}/reservations${query ? `?${query}` : ""}`,
    {
      headers: { "Content-Type": "application/json" },
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.error || "Failed to load reservations");
  }
  return response.json();
}

export async function fetchTodayReservations(date) {
  const params = date ? `?date=${encodeURIComponent(date)}` : "";
  const response = await fetch(`${ADMIN_BASE}/reservations/today${params}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.error || "Failed to load today reservations.");
  }
  return response.json();
}

export async function fetchSiteStatusReservations({ startDate, endDate }) {
  const payload = await fetchReservations({
    checkInStart: startDate,
    checkInEnd: endDate,
    status: "PAID",
  });
  return payload;
}

export async function fetchAdminStatsSummary({ from, to } = {}) {
  const params = new URLSearchParams();
  if (from) params.append("from", from);
  if (to) params.append("to", to);
  const query = params.toString();
  const response = await fetch(
    `${ADMIN_BASE}/stats/summary${query ? `?${query}` : ""}`
  );
  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.error || "Failed to load dashboard stats.");
  }
  return response.json();
}

export async function updateReservationStatus(reservationId, status) {
  const res = await fetch(`${ADMIN_BASE}/reservations/update-status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reservationId, status }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error || "Failed to update reservation status.");
  }

  return res.json();
}

export async function addReservationNote(reservationId, note, operator) {
  const res = await fetch(`${ADMIN_BASE}/reservations/add-note`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reservationId, note, operator }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error || "Failed to add admin note.");
  }

  return res.json();
}
