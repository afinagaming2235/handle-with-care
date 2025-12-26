export function $(sel) {
  return document.querySelector(sel);
}

export function norm(v) {
  return String(v || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function showMsg(el, text = "", type = "") {
  if (!el) return;
  el.textContent = text;
  el.className = `msg ${type}`;
}

export function getTokenFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("token");
}
