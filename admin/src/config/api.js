const rawApiBase = import.meta.env.VITE_API_BASE;

if (!rawApiBase) {
  throw new Error("VITE_API_BASE is not defined");
}

const sanitizedBase = rawApiBase.replace(/\/+$/, "");
export const API_BASE = sanitizedBase.endsWith("/api")
  ? sanitizedBase
  : `${sanitizedBase}/api`;
