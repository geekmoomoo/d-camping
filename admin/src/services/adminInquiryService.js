export async function fetchInquiries({ status, from, to } = {}) {
  const params = new URLSearchParams();
  if (status) params.append("status", status);
  if (from) params.append("from", from);
  if (to) params.append("to", to);
  const response = await fetch(`/api/admin/inquiries${params.toString() ? `?${params.toString()}` : ""}`);
  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.error || "Failed to load inquiries.");
  }
  return response.json();
}

export async function updateInquiry({ id, status, adminNote }) {
  const response = await fetch("/api/admin/inquiries/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, status, adminNote }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.error || "Failed to update inquiry.");
  }
  return response.json();
}
