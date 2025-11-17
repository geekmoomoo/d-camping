const INTERNAL_PATH = "/api/admin/internal-reservations";

async function handleResponse(response) {
  if (response.ok) {
    return response.json();
  }
  const errorBody = await response.json().catch(() => null);
  throw new Error(errorBody?.error || "Internal reservation request failed.");
}

function buildQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    search.append(key, value);
  });
  const queryString = search.toString();
  return queryString ? `?${queryString}` : "";
}

export async function fetchInternalReservations(filters = {}) {
  const query = buildQuery({
    siteId: filters.siteId,
    from: filters.from,
    to: filters.to,
    type: filters.internalType,
    adminName: filters.adminName,
  });
  const response = await fetch(`${INTERNAL_PATH}${query}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse(response);
}

export async function createInternalReservation(payload) {
  const response = await fetch(INTERNAL_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source: "admin", ...payload }),
  });
  return handleResponse(response);
}

export async function updateInternalReservation(reservationId, payload) {
  const response = await fetch(`${INTERNAL_PATH}/${reservationId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source: "admin", ...payload }),
  });
  return handleResponse(response);
}

export async function cancelInternalReservation(reservationId) {
  const response = await fetch(`${INTERNAL_PATH}/${reservationId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse(response);
}
