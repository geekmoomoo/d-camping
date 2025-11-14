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
  const response = await fetch(`/api/reservations/search?${params.toString()}`, {
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    throw new Error("예약 조회에 실패했습니다.");
  }
  return response.json();
}

/**
 * @typedef {Object} CancelPayload
 * @property {string} reservationId
 * @property {string} name
 * @property {string} phone
 * @property {{ bank: string; account: string; holder: string }} bankInfo
 * @property {string} reason
 */

export async function requestCancel(payload) {
  console.log("cancel request payload:", payload);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true });
    }, 500);
  });
  // TODO: call `/api/reservations/cancel` with the payload when backend exists
}

/**
 * @typedef {Object} InquiryPayload
 * @property {string} name
 * @property {string} phone
 * @property {string} category
 * @property {string} message
 */

export async function submitInquiry(payload) {
  console.log("inquiry payload:", payload);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true });
    }, 500);
  });
  // TODO: call `/api/reservations/inquiry` once API is ready
}
