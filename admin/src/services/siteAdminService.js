import { API_BASE } from "../config/api";

export async function fetchAdminSites() {
  const response = await fetch(`${API_BASE}/admin/sites`);
  if (!response.ok) {
    const err = await response.json().catch(() => null);
    console.error("[fetchAdminSites] failed", err);
    throw new Error(err?.error || "Failed to load admin sites.");
  }
  const data = await response.json();
  return data.sites || [];
}

export async function fetchAdminSiteDetail(id) {
  const response = await fetch(`${API_BASE}/admin/sites/${id}`);
  if (!response.ok) {
    const err = await response.json().catch(() => null);
    console.error("[fetchAdminSiteDetail] failed", err);
    throw new Error(err?.error || "Failed to load site detail.");
  }
  const data = await response.json();
  return data.site || null;
}

export async function updateAdminSite(payload) {
  const response = await fetch(`${API_BASE}/admin/sites/update`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => null);
    console.error("[updateAdminSite] failed", err);
    throw new Error(err?.error || "Failed to update site.");
  }
  const data = await response.json();
  return data.site || null;
}
