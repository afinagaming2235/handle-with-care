import { showMsg } from "./shared.js";

/* ======================
   CONFIG
====================== */
const TOTAL_TIME = 10 * 60; // 10 minutes (seconds)

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
      showMsg(msgEl, "Time’s up. You don’t know me enough.", "error");
    }
  }, 1000);
}

/* ======================
   QUESTIONS
====================== */
function renderQuestion() {
  const q = QUESTIONS[index];
  questionEl.textContent = q.q;
  inputEl.value = "";
  showMsg(msgEl, "");
}

/* ======================
   SUBMIT
====================== */
submitBtn.onclick = () => {
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
    return;
  }

  renderQuestion();
};

/* ======================
   BOOT (THIS WAS MISSING)
====================== */
renderQuestion();   // ← THIS fixes the missing question
startTimer();       // ← THIS fixes the frozen timer
