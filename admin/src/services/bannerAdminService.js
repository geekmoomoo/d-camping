const API_BASE = import.meta.env.VITE_API_BASE;

export async function adminFetchBanners() {
  const res = await fetch(`${API_BASE}/admin/banners`);
  if (!res.ok) {
    throw new Error("FAILED_TO_LIST_BANNERS");
  }
  return res.json();
}

export async function adminCreateBanner(payload) {
  const res = await fetch(`${API_BASE}/admin/banners`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("FAILED_TO_CREATE_BANNER");
  }
  return res.json();
}

export async function adminUpdateBanner(id, payload) {
  const res = await fetch(`${API_BASE}/admin/banners/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("FAILED_TO_UPDATE_BANNER");
  }
  return res.json();
}

export async function adminDeleteBanner(id) {
  const res = await fetch(`${API_BASE}/admin/banners/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("FAILED_TO_DELETE_BANNER");
  }
  return res.json();
}
