import { API_BASE } from "../config/api";

async function fetchSites({ limit, startAfterId } = {}) {
  const params = new URLSearchParams();
  if (limit > 0) params.append("limit", limit);
  if (startAfterId) params.append("startAfterId", startAfterId);
  const query = params.toString();
  const res = await fetch(
    `${API_BASE}/sites${query ? `?${query}` : ""}`
  );
  if (!res.ok) {
    throw new Error("Failed to load site list.");
  }
  const data = await res.json();
  const payload = Array.isArray(data)
    ? { items: data }
    : { ...data, items: data?.items ?? data?.sites ?? [] };
  const items = Array.isArray(data) ? data : payload?.items;
  return {
    ...payload,
    items,
    sites: items,
  };
}

export async function getSites(options = {}) {
  try {
    return await fetchSites(options);
  } catch (err) {
    console.error("[siteService.getSites] error:", err);
    return { sites: [] };
  }
}

export const siteService = {
  getSites,
};
