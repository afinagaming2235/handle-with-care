import { $, norm, showMsg, getTokenFromUrl } from "./shared.js";

/* ======================
   CONFIG
====================== */
const SONGS = [
  {
    q: "What is my favorite song all throughout? (clue: Tagalog song)",
    a: "153"
  },
  {
    q: "What is my favorite song in my other persona? (clue: in a playlist)",
    a: "b.a.d."
  }
];

const TOTAL_TIME = 10 * 60 * 1000; // 10 minutes

/* ======================
   ELEMENTS
====================== */
const blocked = $("#blocked");
const songStage = $("#songStage");

const titleEl = $("#songTitle");
const subtitleEl = $("#songSubtitle");
const inputEl = $("#songInput");
const btnEl = $("#songSubmit");
const msgEl = $("#songMsg");

const timerText = $("#songTimerText");
const timerBar = $("#songTimerBar");

/* ======================
   STATE
====================== */
let index = 0;
let startTime = null;
let timerInt = null;
let expired = false;

/* ======================
   TOKEN CHECK
====================== */
async function validateToken() {
  const token = getTokenFromUrl();
  if (!token) return false;

  try {
    const res = await fetch(
      `/api/validate-token?token=${encodeURIComponent(token)}`
    );
    const data = await res.json();
    return data?.ok === true;
  } catch {
    return false;
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

    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);

    timerText.textContent =
      `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

    timerBar.style.transform =
      `scaleX(${remaining / TOTAL_TIME})`;

    if (remaining <= 0) {
      clearInterval(timerInt);
      expired = true;
      failTimeUp();
    }
  }

  tick();
  timerInt = setInterval(tick, 250);
}

/* ======================
   QUESTIONS
====================== */
function loadQuestion() {
  const q = SONGS[index];
  titleEl.textContent = "One question.";
  subtitleEl.textContent = "You have 10 minutes.";
  inputEl.value = "";
  inputEl.focus();
  showMsg(msgEl, "");
}

function nextQuestion() {
  index++;

  if (index >= SONGS.length) {
    passSongs();
    return;
  }

  loadQuestion();
}

/* ======================
   SUBMIT HANDLER (THIS WAS MISSING)
====================== */
btnEl.addEventListener("click", () => {
  if (expired) return;

  const answer = norm(inputEl.value);
  const correct = norm(SONGS[index].a);

  if (!answer) {
    showMsg(msgEl, "Answer required.", "error");
    return;
  }

  if (answer !== correct) {
    showMsg(msgEl, "Wrong answer.", "error");
    return;
  }

  nextQuestion();
});

/* ======================
   FAIL / PASS
====================== */
function failTimeUp() {
  titleEl.textContent = "Time’s up.";
  subtitleEl.textContent =
    "You don’t know me enough. Let’s stay as friends.";
  inputEl.disabled = true;
  btnEl.disabled = true;
}

async function passSongs() {
  clearInterval(timerInt);

  titleEl.textContent = "You remembered.";
  subtitleEl.textContent =
    "I’ll send you another link. Check your email.";
  inputEl.disabled = true;
  btnEl.disabled = true;

  try {
    await fetch("/api/send-questions-link", { method: "POST" });
  } catch {
    showMsg(msgEl, "Failed to send next link.", "error");
  }
}

/* ======================
   BOOT
====================== */
(async function boot() {
  const ok = await validateToken();

  if (!ok) {
    blocked.classList.remove("hidden");
    songStage.classList.add("hidden");
    return;
  }

  blocked.classList.add("hidden");
  songStage.classList.remove("hidden");

  index = 0;
  expired = false;

  loadQuestion();
  startTimer();
})();
