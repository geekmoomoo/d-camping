const API_BASE = import.meta.env.VITE_API_BASE;

export async function fetchActiveBanners() {
  const res = await fetch(`${API_BASE}/banners`);
  if (!res.ok) {
    throw new Error("FAILED_TO_LOAD_BANNERS");
  }
  return res.json();
}
