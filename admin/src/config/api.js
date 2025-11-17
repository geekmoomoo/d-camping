const rawApiBase = import.meta.env.VITE_API_BASE_URL;

if (!rawApiBase) {
  throw new Error("VITE_API_BASE_URL is not defined");
}

const sanitizedBase = rawApiBase.replace(/\/+$/, "");
export const API_BASE = sanitizedBase.endsWith("/api")
  ? sanitizedBase
  : `${sanitizedBase}/api`;
