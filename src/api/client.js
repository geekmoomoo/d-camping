const API_BASE = "http://localhost:4000";

/**
 * @typedef {"self-caravan" | "cabana-deck" | "tent" | "pension"} SiteType
 *
 * @typedef {Object} Site
 * @property {string} id
 * @property {SiteType} type
 * @property {string} name
 * @property {string} zone
 * @property {string} [carOption]
 * @property {number} price
 * @property {string} [squareImg]
 * @property {string[]} [images]
 * @property {number} [stockTotal]
 * @property {boolean} [isActive]
 */

/**
 * Fetches the active sites from the backend API.
 * @returns {Promise<Site[]>}
 */
export async function fetchSites() {
  try {
    const response = await fetch(`${API_BASE}/api/sites`);
    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      const message =
        errorText || `사이트 목록을 불러오는 데 실패했습니다 (${response.status})`;
      throw new Error(message);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("[api/client] fetchSites failed", error);
    throw error;
  }
}

/**
 * @typedef {{ q1: boolean; q2: string; q3: boolean; q4: boolean; q5: boolean; q6: boolean; q7: boolean; q8: boolean }} QAResponses
 * @typedef {{ a1: boolean; a2: boolean; a3: boolean; a4: boolean; a5: boolean }} AgreementFlags
 * @typedef {Object} ReservationPayload
 * @property {string} siteId
 * @property {string} checkIn
 * @property {string} checkOut
 * @property {number} people
 * @property {"self-caravan" | "cabana-deck" | "tent" | "pension"} siteType
 * @property {number} price
 * @property {number} extraCharge
 * @property {Object} userInfo
 * @property {string} userInfo.name
 * @property {string} userInfo.phone
 * @property {string} userInfo.email
 * @property {string} userInfo.request
 * @property {QAResponses} qa
 * @property {AgreementFlags} agree
 */

/**
 * @typedef {Object} ReservationResponse
 * @property {string} reservationId
 * @property {string} status
 * @property {number} amount
 */

/**
 * @typedef {Object} PaymentReadyParams
 * @property {string} reservationId
 * @property {number} amount
 * @property {string} successUrl
 * @property {string} failUrl
 * @property {string} customerName
 * @property {string} customerEmail
 */

/**
 * @typedef {Object} PaymentReadyResponse
 * @property {string} checkoutUrl
 * @property {string} orderId
 */

/**
 * Creates a reservation record on the backend.
 * @param {ReservationPayload} payload
 * @returns {Promise<any>}
 */
export async function createReservation(payload) {
  console.log("[api#createReservation] params:", payload);
  const res = await fetch(`${API_BASE}/api/reservations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const rawText = await res.text();
  console.log("[api#createReservation] status:", res.status);
  console.log("[api#createReservation] raw:", rawText);

  if (!res.ok) {
    throw new Error(
      `createReservation failed (status: ${res.status}) - ${rawText}`
    );
  }

  let data;
  try {
    data = JSON.parse(rawText);
  } catch (e) {
    console.error("[api#createReservation] JSON parse error:", e);
    throw new Error("createReservation: invalid JSON response");
  }

  if (!data.id) {
    throw new Error("createReservation: reservation id not found in response");
  }

  return data;
}

/**
 * Requests Toss payment readiness (mock).
 * @param {PaymentReadyParams} params
 * @returns {Promise<any>}
 */
export async function readyPayment(params) {
  console.log("[api#readyPayment] params:", params);

  const res = await fetch(`${API_BASE}/api/payments/ready`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  const rawText = await res.text();
  console.log("[api#readyPayment] status:", res.status);
  console.log("[api#readyPayment] raw:", rawText);

  if (!res.ok) {
    throw new Error(
      `readyPayment failed (status: ${res.status}) - ${rawText}`
    );
  }

  let data;
  try {
    data = JSON.parse(rawText);
  } catch (e) {
    console.error("[api#readyPayment] JSON parse error:", e);
    throw new Error("readyPayment: invalid JSON response");
  }

  if (!data.redirectUrl) {
    throw new Error("readyPayment: redirectUrl not found in response");
  }

  return data;
}

export async function searchReservationsByPhone(phone) {
  console.log("[api#searchReservationsByPhone] phone:", phone);

  const params = new URLSearchParams({ phone: String(phone || "").trim() });
  const res = await fetch(
    `${API_BASE}/api/reservations/search?${params.toString()}`,
    {
      method: "GET",
    }
  );

  const rawText = await res.text();
  console.log("[api#searchReservationsByPhone] status:", res.status);
  console.log("[api#searchReservationsByPhone] raw:", rawText);

  // Treat 404 as "no reservations found" instead of an error
  if (res.status === 404) {
    return { total: 0, items: [] };
  }

  if (!res.ok) {
    throw new Error(
      `searchReservationsByPhone failed (status: ${res.status}) - ${rawText}`
    );
  }

  let data;
  try {
    data = JSON.parse(rawText || "{}");
  } catch (e) {
    console.error("[api#searchReservationsByPhone] JSON parse error:", e);
    // In case of malformed JSON, fall back to an empty result set
    return { total: 0, items: [] };
  }

  if (!Array.isArray(data.items)) {
    // If items is missing or not an array, normalize it
    return {
      total: data.total ?? 0,
      items: [],
    };
  }

  return data;
}

export async function requestCancelReservation({ id, phone, reason }) {
  console.log("[api#requestCancelReservation] id, phone, reason:", {
    id,
    phone,
    reason,
  });

  const res = await fetch(`${API_BASE}/api/reservations/${id}/cancel-request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      phone: String(phone || "").trim(),
      reason: reason || "",
    }),
  });

  const rawText = await res.text();
  console.log("[api#requestCancelReservation] status:", res.status);
  console.log("[api#requestCancelReservation] raw:", rawText);

  if (!res.ok) {
    throw new Error(
      `requestCancelReservation failed (status: ${res.status}) - ${rawText}`
    );
  }

  let data;
  try {
    data = JSON.parse(rawText);
  } catch (e) {
    console.error("[api#requestCancelReservation] JSON parse error:", e);
    throw new Error("requestCancelReservation: invalid JSON response");
  }

  if (!data.id) {
    throw new Error(
      "requestCancelReservation: reservation id not found in response"
    );
  }

  return data;
}

export async function calcPrice({ site, checkIn, checkOut, people }) {
  try {
    console.log("[api/calcPrice] params:", { site, checkIn, checkOut, people });

    const res = await fetch(`${API_BASE}/api/price/calc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ site, checkIn, checkOut, people }),
    });

    const data = await res.json();
    console.log("[api/calcPrice] result:", data);

    return data;
  } catch (err) {
    console.error("[api/calcPrice] ERROR:", err);
    return null;
  }
}
