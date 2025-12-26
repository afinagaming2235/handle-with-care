import { showMsg } from "./shared.js";

document.addEventListener("DOMContentLoaded", () => {

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
     ELEMENTS (SAFE)
  ====================== */
  const questionEl = document.getElementById("questionTitle");
  const timerEl = document.getElementById("timer");
  const inputEl = document.getElementById("answerInput");
  const submitBtn = document.getElementById("submitBtn");
  const msgEl = document.getElementById("msg");

  // HARD STOP if HTML is wrong
  if (!questionEl || !timerEl || !inputEl || !submitBtn || !msgEl) {
    console.error("Song page DOM mismatch. Check element IDs.");
    return;
  }

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
        showMsg(
          msgEl,
          "Time’s up. You don’t know me enough. Let’s stay as friends.",
          "error"
        );
      }
    }, 1000);
  }

  /* ======================
     QUESTIONS
  ====================== */
  function renderQuestion() {
    const q = QUESTIONS[index];
    questionEl.textContent = q.q;   // ✅ QUESTION IN H1
    inputEl.value = "";
    showMsg(msgEl, "");
    inputEl.focus();
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
      submitBtn.disabled = true;

      showMsg(
        msgEl,
        "Correct. Another link will be sent to your email.",
        "ok"
      );

      // TODO: call API to send LINK 2 here
      return;
    }

    renderQuestion();
  };

  /* ======================
     BOOT
  ====================== */
  renderQuestion();   // ✅ shows first question
  startTimer();       // ✅ starts countdown

});
