import { showMsg, getTokenFromUrl } from "./shared.js";

/* ======================
   TOKEN VALIDATION
====================== */
(async function validateStage() {
  const token = getTokenFromUrl();
  if (!token) {
    document.body.innerHTML = "Access denied.";
    return;
  }

  const res = await fetch(`/api/validate-token?token=${encodeURIComponent(token)}`);
  const data = await res.json().catch(() => null);

  if (!data || !data.ok || data.stage !== "song") {
    document.body.innerHTML = "Access denied.";
    return;
  }
})();

/* ======================
   CONFIG
====================== */
const TOTAL_TIME = 10 * 60;

const QUESTIONS = [
  { q: "What is my favorite song all throughout? (Tagalog song)", a: "153" },
  { q: "What is my favorite song in my other persona?", a: "B.A.D." }
];

/* ======================
   ELEMENTS
====================== */
const questionEl = document.getElementById("questionTitle");
const timerEl = document.getElementById("timer");
const inputEl = document.getElementById("answerInput");
const submitBtn = document.getElementById("submitBtn");
const msgEl = document.getElementById("msg");

/* ======================
   STATE
====================== */
let index = 0;
let timeLeft = TOTAL_TIME;
let timerInterval = null;

/* ======================
   HELPERS
====================== */
function normalize(v) {
  return String(v || "").toLowerCase().replace(/[\s.]/g, "");
}

function formatTime(sec) {
  return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
}

/* ======================
   TIMER
====================== */
function startTimer() {
  timerEl.textContent = formatTime(timeLeft);

  timerInterval = setInterval(() => {
    timeLeft--;
    timerEl.textContent = formatTime(Math.max(0, timeLeft));

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      submitBtn.disabled = true;
      showMsg(msgEl, "Time’s up. This stops here.", "error");
    }
  }, 1000);
}

/* ======================
   QUESTION
====================== */
function renderQuestion() {
  questionEl.textContent = QUESTIONS[index].q;
  inputEl.value = "";
  showMsg(msgEl, "");
}

submitBtn.onclick = async () => {
  // if time expired, block
  if (timeLeft <= 0) return;

  const answer = normalize(inputEl.value);
  const correct = normalize(QUESTIONS[index].a);

  if (!answer) return showMsg(msgEl, "Answer required.", "error");
  if (answer !== correct) return showMsg(msgEl, "Wrong answer.", "error");

  index++;
  if (index < QUESTIONS.length) return renderQuestion();

  // ✅ ALL CORRECT
  clearInterval(timerInterval);
  submitBtn.disabled = true;
  showMsg(msgEl, "Correct. Another link will be sent to your email.", "ok");

  // ✅ THIS IS WHERE IT GOES (after all answers are correct)
  await fetch("/api/send-next-link", {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  });
};

/* ======================
   BOOT
====================== */
renderQuestion();
startTimer();
