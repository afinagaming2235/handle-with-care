import { showMsg } from "./shared.js";

/* ======================
   CONFIG
====================== */
const TOTAL_TIME = 10 * 60; // 10 minutes

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
  questionEl.textContent = q.q; // QUESTION IN H1
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

  // ALL QUESTIONS ANSWERED
  if (index >= QUESTIONS.length) {
    clearInterval(timerInterval);
    submitBtn.disabled = true;

    showMsg(msgEl, "Correct. Sending the next link…", "ok");

    try {
      const res = await fetch("/api/send-questions-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "202510576@gordoncollege.edu.ph"
        })
      });

      const data = await res.json();

      if (!data.ok) {
        showMsg(msgEl, "Failed to send email.", "error");
        submitBtn.disabled = false;
        return;
      }

      showMsg(
        msgEl,
        "Correct. Another link has been sent to your email.",
        "ok"
      );
    } catch (err) {
      showMsg(msgEl, "Network error. Email not sent.", "error");
      submitBtn.disabled = false;
    }

    return;
  }

  renderQuestion();
};

/* ======================
   BOOT
====================== */
renderQuestion();
startTimer();
