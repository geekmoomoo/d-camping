import { API_BASE } from "../config/api";

/**
 * @typedef {Object} ReservationSearchCriteria
 * @property {string} name
 * @property {string} phone
 * @property {string} [reservationId]
 */

export async function searchReservations(criteria) {
  const params = new URLSearchParams();
  if (criteria?.name) params.append("name", criteria.name);
  if (criteria?.phone) params.append("phone", criteria.phone);
  if (criteria?.reservationId) params.append("reservationId", criteria.reservationId);
  const response = await fetch(
    `${API_BASE}/reservations/search?${params.toString()}`,
    {
      headers: { "Content-Type": "application/json" },
    }
  );
  if (!response.ok) {
    throw new Error("Failed to search reservations.");
  }
  return response.json();
}

export async function lookupReservation({ reservationId, phone }) {
  const response = await fetch(`${API_BASE}/reservations/lookup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reservationId, phone }),
  });
  if (!response.ok) {
    throw new Error("Reservation lookup failed.");
  }
  return response.json();
}

export async function requestRefund(payload) {
  const response = await fetch(`${API_BASE}/refunds`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error("Failed to submit refund request.");
  }
  return response.json();
}

export async function requestCancel(payload) {
  const { reservationId, phone, reason } = payload;
  return requestRefund({
    reservationId,
    phone,
    reason,
    causeType: "GUEST",
  });
}

export async function submitInquiry(payload) {
  const response = await fetch(`${API_BASE}/inquiries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error("Failed to submit inquiry.");
  }
  return response.json();
}

export async function fetchDisabledDates({ siteId, from, to }) {
  const params = new URLSearchParams({ siteId, from, to });
  const res = await fetch(
    `${API_BASE}/reservations/disabled-dates?${params.toString()}`
  );
  if (!res.ok) {
    throw new Error("FAILED_TO_FETCH_DISABLED_DATES");
  }
  return res.json();
}
