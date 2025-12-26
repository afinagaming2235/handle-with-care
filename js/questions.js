import { showMsg, getTokenFromUrl } from "./shared.js";

(async function stageGuard() {
  const token = getTokenFromUrl();
  if (!token) {
    document.body.innerHTML = "Access denied.";
    return;
  }

  const res = await fetch(`/api/validate-token?token=${encodeURIComponent(token)}`);
  const data = await res.json().catch(() => null);

  if (!data || !data.ok || data.stage !== "questions") {
    document.body.innerHTML = "Access denied.";
  }
})();


/* ======================
   CONFIG
====================== */
const TOTAL_TIME = 10 * 60;

const QUESTIONS = [
  {
    q: "What is my favorite song all throughout? (Tagalog song)",
    a: "153"
  },
  {
    q: "What is my favorite song in my other persona?",
    a: "B.A.D."
  }
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
  return String(v || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/\./g, "");
}

function formatTime(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

/* ======================
   TIMER
====================== */
function startTimer() {
  timerEl.textContent = formatTime(timeLeft);

  timerInterval = setInterval(() => {
    timeLeft--;
    timerEl.textContent = formatTime(timeLeft);

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      submitBtn.disabled = true;
      showMsg(msgEl, "Time’s up. This stops here.", "error");
    }
  }, 1000);
}

/* ======================
   QUESTIONS
====================== */
function renderQuestion() {
  questionEl.textContent = QUESTIONS[index].q;
  inputEl.value = "";
  showMsg(msgEl, "");
}

/* ======================
   SUBMIT
====================== */
submitBtn.onclick = async () => {
  const answer = normalize(inputEl.value);
  const correct = normalize(QUESTIONS[index].a);

  if (!answer) {
    showMsg(msgEl, "Answer required.", "error");
    return;
  }

  if (answer !== correct) {
    showMsg(msgEl, "Wrong answer.", "error");
    return;
  }

  index++;

  if (index >= QUESTIONS.length) {
    clearInterval(timerInterval);
    showMsg(
      msgEl,
      "Correct. Another link will be sent to your email.",
      "ok"
    );

    submitBtn.disabled = true;

    // 🔥 CALL BACKEND TO SEND NEXT LINK
    await fetch("/api/send-next-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    return;
  }

  renderQuestion();
};

/* ======================
   BOOT
====================== */
renderQuestion();
startTimer();
