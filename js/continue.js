import { $, norm, showMsg, getTokenFromUrl } from "./shared.js";

/* =====================
   TOKEN
===================== */
const token = getTokenFromUrl();

/* =====================
   SECTIONS
===================== */
const blocked = $("#blocked");
const personal = $("#personal");
const heartIntro = $("#heartIntro");
const mainQuestions = $("#mainQuestions");
const afterMain = $("#afterMain");
const game = $("#game");
const afterGame = $("#afterGame");
const scroll = $("#scroll");
const final = $("#final");

/* =====================
   HEARTS HUD
===================== */
const hud = $("#hearts");
const heartsEl = hud;

const HEART_OK = "/assets/heart.svg";
const HEART_BROKEN = "/assets/heart-broken.svg";

let hearts = 3;

/* =====================
   PERSONAL QUESTIONS
===================== */
const p1 = $("#p1");
const p2 = $("#p2");
const p1Msg = $("#p1Msg");
const p2Msg = $("#p2Msg");
const personalBtn = $("#personalBtn");
const personalMsg = $("#personalMsg");

// EXACT answers
const PERSONAL_1 = "153";
const PERSONAL_2 = "b.a.d.";

/* =====================
   HEART INTRO
===================== */
const toMainBtn = $("#toMainBtn");

/* =====================
   MAIN QUESTIONS
===================== */
const mqPrompt = $("#mqPrompt");
const mqChoices = $("#mqChoices");
const mqMsg = $("#mqMsg");
const afterMainTitle = $("#afterMainTitle");
const afterMainBody = $("#afterMainBody");
const toGameBtn = $("#toGameBtn");

let mainIndex = 0;

const MAIN = [
  {
    prompt: "If I say I’m not ready today…",
    choices: [
      { text: "I wait and respect your pace.", dmg: 0 },
      { text: "I push a little because I want certainty.", dmg: 1 },
      { text: "I get upset and make you feel guilty.", dmg: 2 }
    ]
  },
  {
    prompt: "When I’m overwhelmed and quiet…",
    choices: [
      { text: "I stay present without forcing words.", dmg: 0 },
      { text: "I keep asking until you respond.", dmg: 1 },
      { text: "I leave to punish you for being distant.", dmg: 2 }
    ]
  },
  {
    prompt: "If boundaries slow things down…",
    choices: [
      { text: "I treat boundaries as care, not rejection.", dmg: 0 },
      { text: "I feel offended but I hide it.", dmg: 1 },
      { text: "I demand proof and control.", dmg: 2 }
    ]
  }
];

/* =====================
   GAME
===================== */
const steadyCanvas = $("#steadyCanvas");
const gameStart = $("#gameStart");
const gameReset = $("#gameReset");
const gameMsg = $("#gameMsg");

const afterGameTitle = $("#afterGameTitle");
const afterGameBody = $("#afterGameBody");
const toScrollBtn = $("#toScrollBtn");

/* =====================
   SCROLL
===================== */
const openScroll = $("#openScroll");
const letterWrap = $("#letterWrap");
const letterEl = $("#letter");
const toFinalBtn = $("#toFinalBtn");

const LETTER = `
If you’re reading this,
it means you didn’t rush.

I value patience.
Consistency.
Care.

If you’re still here,
you treated this like a heart,
not a challenge.

My answer exists.

But only if you stayed.
`.trim();

/* =====================
   FINAL
===================== */
const finalTitle = $("#finalTitle");
const finalSub = $("#finalSub");
const grid = $("#grid");
const finalMsg = $("#finalMsg");

const photoStage = $("#photoStage");
const photoCard = $("#photoCard");
const scratch = $("#scratch");
const revealText = $("#revealText");

/* =====================
   HELPERS
===================== */
function showOnly(section) {
  [
    blocked, personal, heartIntro, mainQuestions,
    afterMain, game, afterGame, scroll, final
  ].forEach(el => el.classList.add("hidden"));

  section.classList.remove("hidden");
}

function hudOff() {
  hud.classList.add("hidden");
}

function hudOn() {
  hud.classList.remove("hidden");
  renderHearts();
}

function renderHearts() {
  heartsEl.innerHTML = "";
  for (let i = 0; i < 3; i++) {
    const img = document.createElement("img");
    img.src = i < hearts ? HEART_OK : HEART_BROKEN;
    img.className = "heart";
    heartsEl.appendChild(img);
  }
}

/* =====================
   TOKEN VALIDATION
===================== */
async function validateToken() {
  if (!token) return false;
  try {
    const res = await fetch(`/api/validate-token?token=${encodeURIComponent(token)}`);
    const data = await res.json();
    return !!data.ok;
  } catch {
    return false;
  }
}

/* =====================
   PERSONAL FLOW
===================== */
personalBtn.addEventListener("click", () => {
  showMsg(p1Msg, "");
  showMsg(p2Msg, "");
  showMsg(personalMsg, "");

  if (norm(p1.value) !== norm(PERSONAL_1)) {
    showMsg(p1Msg, "Wrong.", "error");
    return;
  }

  if (norm(p2.value) !== norm(PERSONAL_2)) {
    showMsg(p2Msg, "Wrong.", "error");
    return;
  }

  hearts = 3;
  hudOn();

  showOnly(heartIntro);
});

toMainBtn.addEventListener("click", () => {
  mainIndex = 0;
  renderMainQuestion();
  showOnly(mainQuestions);
});

/* =====================
   MAIN QUESTIONS
===================== */
function renderMainQuestion() {
  const q = MAIN[mainIndex];
  mqPrompt.textContent = q.prompt;
  mqChoices.innerHTML = "";
  showMsg(mqMsg, "");

  q.choices.forEach(c => {
    const btn = document.createElement("div");
    btn.className = "choice";
    btn.textContent = c.text;

    btn.onclick = () => {
      hearts = Math.max(0, hearts - c.dmg);
      renderHearts();

      mainIndex++;

      if (mainIndex >= MAIN.length) {
        showOnly(afterMain);
        applyOutcome(afterMainTitle, afterMainBody, toGameBtn);
      } else {
        renderMainQuestion();
      }
    };

    mqChoices.appendChild(btn);
  });
}

function applyOutcome(titleEl, bodyEl, btn) {
  btn.classList.add("hidden");

  if (hearts <= 0) {
    titleEl.textContent = "I don’t feel safe continuing.";
    bodyEl.textContent = "This ends here.";
    return;
  }

  if (hearts === 1) {
    titleEl.textContent = "We should stop.";
    bodyEl.textContent = "I need more care than this.";
    return;
  }

  titleEl.textContent = "Continue.";
  bodyEl.textContent = "";
  btn.classList.remove("hidden");
}

toGameBtn.addEventListener("click", () => {
  showOnly(game);
});

/* =====================
   SCROLL
===================== */
toScrollBtn.addEventListener("click", () => {
  showOnly(scroll);
});

openScroll.addEventListener("click", () => {
  openScroll.classList.add("hidden");
  letterWrap.classList.remove("hidden");
  typeLetter(LETTER);
  toFinalBtn.classList.remove("hidden");
});

function typeLetter(text) {
  letterEl.textContent = "";
  let i = 0;
  const t = setInterval(() => {
    letterEl.textContent += text[i++] || "";
    if (i >= text.length) clearInterval(t);
  }, 18);
}

toFinalBtn.addEventListener("click", () => {
  showOnly(final);
  photoStage.classList.remove("hidden");
});

/* =====================
   SCRATCH
===================== */
function initScratch() {
  const ctx = scratch.getContext("2d");
  ctx.fillStyle = "rgba(18,7,23,0.95)";
  ctx.fillRect(0, 0, scratch.width, scratch.height);

  let scratching = false;
  let cleared = 0;

  function scratchAt(x, y) {
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    cleared++;
    if (cleared > 150) revealText.classList.remove("hidden");
  }

  scratch.addEventListener("mousedown", () => scratching = true);
  scratch.addEventListener("mouseup", () => scratching = false);
  scratch.addEventListener("mousemove", e => {
    if (!scratching) return;
    const r = scratch.getBoundingClientRect();
    scratchAt(e.clientX - r.left, e.clientY - r.top);
  });
}

photoStage.addEventListener("click", initScratch);

/* =====================
   BOOT
===================== */
(async function boot() {
  hudOff();
  const ok = await validateToken();
  if (!ok) {
    showOnly(blocked);
    return;
  }
  showOnly(personal);
})();
