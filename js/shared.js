export const $ = (sel) => document.querySelector(sel);

export function norm(v){
  return String(v || "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function showMsg(el, text, type=""){
  if(!el) return;
  el.textContent = text || "";
  el.classList.remove("error","ok");
  if(type) el.classList.add(type);
}

export function getTokenFromUrl(){
  const u = new URL(window.location.href);
  return String(u.searchParams.get("token") || "").trim();
}
