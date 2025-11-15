const API_BASE = import.meta.env.VITE_API_BASE || "";

async function fetchSites({ limit, startAfterId } = {}) {
  const params = new URLSearchParams();
  if (limit > 0) params.append("limit", limit);
  if (startAfterId) params.append("startAfterId", startAfterId);
  const query = params.toString();
  const res = await fetch(`${API_BASE}/api/sites${query ? `?${query}` : ""}`);
  if (!res.ok) {
    throw new Error("Failed to load site list.");
  }
  return res.json();
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
