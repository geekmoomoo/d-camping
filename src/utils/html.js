const isBrowser = typeof window !== "undefined" && typeof window.DOMParser !== "undefined";

const createParser = () => {
  if (!isBrowser) return null;
  return new DOMParser();
};

export function sanitizeHtml(value = "") {
  if (!value) return "";
  const parser = createParser();
  if (!parser) {
    return value;
  }
  const doc = parser.parseFromString(value, "text/html");
  doc.querySelectorAll("script,style").forEach((node) => node.remove());
  return doc.body.innerHTML || "";
}

export function ensureHtmlParagraphs(value = "") {
  const sanitized = sanitizeHtml(value);
  if (!sanitized.trim()) return "";
  if (/<[a-z][\s\S]*>/i.test(sanitized)) {
    return sanitized;
  }
  return sanitized
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${line}</p>`)
    .join("");
}

export function htmlToTextLines(value = "") {
  if (!value) return [];
  const parser = createParser();
  if (!parser) {
    return value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }
  const doc = parser.parseFromString(value, "text/html");
  const text = doc.body.textContent || "";
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}
