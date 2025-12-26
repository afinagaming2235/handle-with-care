import { getTokenFromUrl, norm } from "./shared.js";

const token = getTokenFromUrl();
const ANSWER = "153";
const LIMIT = 10 * 60;

let time = LIMIT;
const timerEl = document.querySelector("#timer");
const msg = document.querySelector("#msg");

function drawTimer() {
  const m = Math.floor(time / 60);
  const s = time % 60;
  timerEl.textContent = `${m}:${s.toString().padStart(2, "0")}`;
}

drawTimer();

const interval = setInterval(() => {
  time--;
  drawTimer();
  if (time <= 0) {
    clearInterval(interval);
    msg.textContent = "You don’t know me enough. Let’s stay friends.";
  }
}, 1000);

document.querySelector("#submit").onclick = async () => {
  if (norm(document.querySelector("#answer").value) !== ANSWER) {
    msg.textContent = "Wrong.";
    return;
  }

  clearInterval(interval);

  await fetch("/api/send-questions-link", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token })
  });

  msg.textContent = "Check your email. One more link was sent.";
};
