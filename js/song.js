import { getTokenFromUrl } from "./shared.js";

const token = getTokenFromUrl();
const timeBar = document.getElementById("timeBar");
const btn = document.getElementById("continueBtn");
const input = document.getElementById("answer");

let time = 600; // 10 mins

const timer = setInterval(() => {
  time--;
  timeBar.style.width = `${(time / 600) * 100}%`;

  if (time <= 0) {
    clearInterval(timer);
    document.body.innerHTML = "<h2>You don’t know me enough. Let’s stay friends.</h2>";
  }
}, 1000);

btn.onclick = async () => {
  if (input.value.trim() !== "153") return;

  clearInterval(timer);

  await fetch("/api/continue-link", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token })
  });

  alert("Check your email. Another link was sent.");
};
