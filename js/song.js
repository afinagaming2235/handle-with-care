import { $, showMsg } from "./shared.js";

document.addEventListener("DOMContentLoaded", () => {

  const timerEl   = $("#timerText");
  const inputEl   = $("#songAnswer");
  const submitBtn = $("#submitSong");
  const msgEl     = $("#songMsg");

  // 🔒 SAFETY CHECK
  if (!timerEl || !inputEl || !submitBtn || !msgEl) {
    console.error("Song page HTML elements missing");
    return;
  }

  /* ======================
     QUESTIONS
  ====================== */
  const QUESTIONS = [
    { q: "What is my favorite song all throughout? (Tagalog)", a: "153" },
    { q: "What is my favorite song in my other persona?", a: "b.a.d." }
  ];

  let index = 0;

  /* ======================
     TIMER (10 MINUTES)
  ====================== */
  let remaining = 10 * 60; // seconds

  function updateTimer() {
    const m = String(Math.floor(remaining / 60)).padStart(2, "0");
    const s = String(remaining % 60).padStart(2, "0");
    timerEl.textContent = `${m}:${s}`;

    if (remaining <= 0) {
      showMsg(msgEl, "You don’t know me enough. Let’s stay friends.", "error");
      submitBtn.disabled = true;
      clearInterval(timerInterval);
    }

    remaining--;
  }

  updateTimer();
  const timerInterval = setInterval(updateTimer, 1000);

  /* ======================
     RENDER QUESTION
  ====================== */
  function renderQuestion() {
    msgEl.textContent = "";
    inputEl.value = "";
    inputEl.placeholder = QUESTIONS[index].q;
  }

  renderQuestion();

  /* ======================
     SUBMIT HANDLER
  ====================== */
  submitBtn.onclick = () => {
    const answer = inputEl.value.trim().toLowerCase();
    const correct = QUESTIONS[index].a.toLowerCase();

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

      // TODO: call API to send LINK 2
      submitBtn.disabled = true;
      return;
    }

    renderQuestion();
  };

});
