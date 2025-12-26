import { $, norm, showMsg, getTokenFromUrl } from "./shared.js";

/* ======================
   CONFIG
====================== */
const SONG_1 = "153";
const SONG_2 = "b.a.d.";
const TOTAL_TIME = 10 * 60 * 1000; // 10 minutes in ms

/* ======================
   ELEMENTS
====================== */
const blocked = $("#blocked");
const stage = $("#songStage");
const timerText = $("#songTimerText");
const timerBar = $("#songTimerBar");
const input = $("#songInput");
const btn = $("#songSubmit");
const msg = $("#songMsg");

/* ======================
   STATE
====================== */
let step = 1;
let expired = false;
let timerInt = null;
let startTime = 0;

/* ======================
   TOKEN VALIDATION
====================== */
async function validateToken() {
  const token = getTokenFromUrl();
  if (!token) return null;

  try {
    const res = await fetch(`/api/validate-token?token=${encodeURIComponent(token)}`);
    const data = await res.json();
    if (!data?.ok || data.stage !== "song") return null;
    return data;
  } catch {
    return null;
  }
}

/* ======================
   TIMER
====================== */
function startTimer() {
  startTime = Date.now();

  function tick() {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, TOTAL_TIME - elapsed);
    const ratio = remaining / TOTAL_TIME;

    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000)
      .toString()
      .padStart(2, "0");

    timerText.textContent = `${mins}:${secs}`;
    timerBar.style.transform = `scaleX(${ratio})`;

    if (remaining <= 0) {
      clearInterval(timerInt);
      expired = true;
      fail();
    }
  }

  tick();
  timerInt = setInterval(tick, 250);
}

/* ======================
   FAIL
====================== */
function fail() {
  stage.classList.add("hidden");
  blocked.classList.remove("hidden");

  blocked.innerHTML = `
    <div class="stack">
      <p class="title">You don’t know me enough.</p>
      <p class="subtitle">Let’s stay as friends.</p>
    </div>
  `;
}

/* ======================
   SUCCESS → SEND LINK 2
====================== */
async function sendNextLink() {
  btn.disabled = true;
  showMsg(msg, "Sending the next link…", "");

  try {
    const res = await fetch("/api/continue-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}) // token already in cookie/url
    });

    const data = await res.json();

    if (!data?.ok) throw new Error();

    showMsg(
      msg,
      "Check your email. I sent you another link.",
      "ok"
    );
  } catch {
    showMsg(msg, "Something went wrong. Please wait.", "error");
  }
}

/* ======================
   SUBMIT HANDLER
====================== */
btn.addEventListener("click", () => {
  if (expired) return;

  const answer = norm(input.value);
  input.value = "";

  if (!answer) {
    showMsg(msg, "Required.", "error");
    return;
  }

  if (step === 1) {
    if (answer !== norm(SONG_1)) {
      showMsg(msg, "That’s not it.", "error");
      return;
    }

    step = 2;
    showMsg(msg, "");
    stage.querySelector(".title").textContent = "One more.";
    stage.querySelector(".subtitle").textContent = "You still have time.";
    input.placeholder = "Second song";
    return;
  }

  if (step === 2) {
    if (answer !== norm(SONG_2)) {
      showMsg(msg, "That’s not it.", "error");
      return;
    }

    clearInterval(timerInt);
    sendNextLink();
  }
});

/* ======================
   BOOT
====================== */
(async function boot() {
  const ok = await validateToken();

  if (!ok) {
    blocked.classList.remove("hidden");
    return;
  }

  blocked.classList.add("hidden");
  stage.classList.remove("hidden");
  startTimer();
})();
