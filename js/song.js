// ===============================
// SONG QUESTIONS (LINK 1)
// ===============================

// ---------- CONFIG ----------
const TOTAL_TIME = 10 * 60; // 10 minutes in seconds

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

// ---------- HELPERS ----------
function normalize(v) {
  return String(v || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

// ---------- DOM ----------
const titleEl   = document.getElementById("songTitle");
const timerEl   = document.getElementById("songTimer");
const inputEl   = document.getElementById("songInput");
const submitBtn = document.getElementById("songSubmit");
const msgEl     = document.getElementById("songMsg");

// ---------- STATE ----------
let index = 0;
let timeLeft = TOTAL_TIME;
let timerInterval = null;

// ---------- TIMER ----------
function startTimer() {
  timerInterval = setInterval(() => {
    timeLeft--;

    const min = Math.floor(timeLeft / 60);
    const sec = timeLeft % 60;
    timerEl.textContent = `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      lockScreen(
        "Time’s up.",
        "You don’t know me enough yet. Let’s stay friends."
      );
    }
  }, 1000);
}

// ---------- UI ----------
function showMsg(text, type = "") {
  msgEl.textContent = text;
  msgEl.className = "msg " + type;
}

function lockScreen(title, message) {
  submitBtn.disabled = true;
  inputEl.disabled = true;
  titleEl.textContent = title;
  showMsg(message, "error");
}

// ---------- QUESTIONS ----------
function renderQuestion() {
  const q = QUESTIONS[index];

  // SHOW QUESTION IN H1
  document.getElementById("questionTitle").textContent = q.q;

  // CLEAR INPUT + MESSAGE
  inputEl.value = "";
  showMsg(msgEl, "");
}


// ---------- SUBMIT ----------
submitBtn.onclick = () => {
  submitBtn.disabled = true;

  const answer  = normalize(inputEl.value);
  const correct = normalize(QUESTIONS[index].a);

  if (!answer) {
    showMsg("Answer required.", "error");
    submitBtn.disabled = false;
    return;
  }

  if (answer !== correct) {
    showMsg("Wrong answer.", "error");
    submitBtn.disabled = false;
    return;
  }

  // correct
  index++;

  if (index >= QUESTIONS.length) {
    clearInterval(timerInterval);
    showMsg(
      "Correct. Another link will be sent to your email.",
      "ok"
    );

    // 🔗 TODO: CALL API TO SEND LINK 2 HERE
    // fetch("/api/continue-link", { method: "POST" })

    return;
  }

  submitBtn.disabled = false;
  renderQuestion();
};

// ---------- BOOT ----------
renderQuestion();
startTimer();
