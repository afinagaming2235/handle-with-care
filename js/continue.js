import { $, showMsg, getTokenFromUrl } from "./shared.js";

/* ======================
   TOKEN VALIDATION
====================== */
async function mustBeContinueToken() {
  const token = getTokenFromUrl();
  if (!token) return false;

  const res = await fetch(`/api/validate-token?token=${encodeURIComponent(token)}`);
  const data = await res.json().catch(() => null);

  return !!(data && data.ok && data.stage === "continue");
}

/* ======================
   SECTIONS
====================== */
const blocked = $("#blocked");
const personal = $("#personal");
const main = $("#mainQuestions");
const afterMain = $("#afterMain");
const game = $("#game");
const afterGame = $("#afterGame");
const scroll = $("#scroll");
const final = $("#final");

function showOnly(section) {
  [blocked, personal, main, afterMain, game, afterGame, scroll, final]
    .forEach(s => s?.classList.add("hidden"));
  section?.classList.remove("hidden");
}

/* ======================
   HEARTS HUD
====================== */
const heartsWrap = $("#hearts");
const HEART_OK = "/assets/heart.svg";
const HEART_BROKEN = "/assets/heart-broken.svg";

let hearts = 3;

function renderHearts() {
  heartsWrap.innerHTML = "";
  for (let i = 0; i < 3; i++) {
    const img = document.createElement("img");
    img.src = i < hearts ? HEART_OK : HEART_BROKEN;
    img.className = "heart";
    img.alt = "heart";
    heartsWrap.appendChild(img);
  }
  heartsWrap.classList.remove("hidden");
}

/* ======================
   WORD LIMIT
====================== */
const MAX_WORDS = 100;
function countWords(text) {
  return String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .length;
}

/* ======================
   HURT DETECTION (minus 1 only)
   - If answer "hurts": hearts -= 1
   - else: no change
====================== */
function hurtsByRules(answerRaw, rules) {
  const a = String(answerRaw || "").toLowerCase();

  // if any red triggers => hurt
  const redHit = rules.red.some(rx => rx.test(a));
  if (redHit) return true;

  // if yellow triggers AND no green => hurt
  const yellowHit = rules.yellow.some(rx => rx.test(a));
  const greenHit = rules.green.some(rx => rx.test(a));
  if (yellowHit && !greenHit) return true;

  return false;
}

/* ======================
   RULES (same spirit as before)
====================== */
const RULES_LEAVING = {
  red: [
    /don'?t\s+leave|stay\s+here|change\s+your\s+plan|stop\s+college|don'?t\s+go/i,
    /if\s+you\s+love\s+me.*(you|you'll)\s+stay/i,
    /you\s+owe\s+me|after\s+all\s+i\s+did/i,
    /i\s+won'?t\s+allow|i\s+won'?t\s+accept/i,
    /it'?s\s+selfish|ang\s+selfish|bahala\s+ka\s+na/i,
    /guilt|kasalanan|sisi/i
  ],
  yellow: [
    /i\s+hate\s+ldr|i\s+can'?t\s+handle\s+ldr/i,
    /it\s+will\s+be\s+hard.*(for\s+me|on\s+me)/i,
    /i\s+will\s+struggle/i,
    /i'?m\s+not\s+sure/i
  ],
  green: [
    /i\s+respect|i\s+understand|i\s+support/i,
    /your\s+future|your\s+dreams|your\s+goals/i,
    /i\s+will\s+be\s+patient|patience/i,
    /we\s+can\s+communicate|communication/i,
    /no\s+pressure|i\s+won'?t\s+pressure/i
  ]
};

const RULES_FIND_SOMEONE = {
  red: [
    /i\s+won'?t\s+let\s+you|i\s+won'?t\s+accept/i,
    /i'?ll\s+force|i'?ll\s+make\s+you/i,
    /you\s+owe\s+me|after\s+all\s+i\s+did/i,
    /you\s+belong\s+to\s+me|you\s+are\s+mine/i,
    /i'?ll\s+fight\s+you|no\s+matter\s+what/i
  ],
  yellow: [
    /please\s+don'?t\s+leave|don'?t\s+leave\s+me/i,
    /i\s+can'?t\s+move\s+on/i,
    /wait\s+forever/i
  ],
  green: [
    /i\s+respect\s+your\s+decision|i\s+respect\s+it/i,
    /i\s+won'?t\s+pressure|no\s+pressure/i,
    /i\s+will\s+step\s+back|i\s+will\s+let\s+you\s+go/i,
    /i\s+will\s+accept/i
  ]
};

const RULES_HARD_TO_HANDLE = {
  red: [
    /i\s+will\s+control|i\s+will\s+change\s+you|i\s+will\s+fix\s+you/i,
    /you\s+are\s+mine|you\s+belong\s+to\s+me/i,
    /i\s+won'?t\s+take\s+no|i\s+won'?t\s+accept\s+no/i,
    /silent\s+treatment|punish/i,
    /if\s+you\s+love\s+me.*you\s+should/i
  ],
  yellow: [
    /i\s+will\s+try\s+my\s+best/i,
    /i\s+will\s+endure|i\s+can\s+endure/i,
    /i'?ll\s+adjust\s+for\s+you/i
  ],
  green: [
    /communication|listen|understand/i,
    /boundaries|respect/i,
    /patience|gentle|calm/i,
    /no\s+pressure|i\s+won'?t\s+rush/i
  ]
};

/* ======================
   QUESTIONS (DON'T REMOVE)
   + add your 3 text questions
====================== */
const MAIN = [
  {
    type: "choice",
    q: "When I say I’m not ready today…",
    a: [
      { t: "I respect your pace and don’t make you feel guilty.", d: 0 },
      { t: "I try to understand, but I still feel frustrated.", d: 1 },
      { t: "I take it personally and pressure you.", d: 2 }
    ]
  },
  {
    type: "choice",
    q: "When I become quiet instead of expressive…",
    a: [
      { t: "I stay present without forcing words.", d: 0 },
      { t: "I keep asking until it becomes pressure.", d: 1 },
      { t: "I pull away and make you feel alone.", d: 2 }
    ]
  },

  // ✅ your 3 text questions (max 100 words)
  { type: "text_scored", q: "I will be leaving after college. How do you feel?", rules: RULES_LEAVING },

  {
    type: "choice",
    q: "If I’m not allowed to have a boyfriend yet…",
    a: [
      { t: "I respect it and never pressure you.", d: 0 },
      { t: "I stay, but I struggle privately.", d: 1 },
      { t: "I think rules shouldn’t apply to us.", d: 2 }
    ]
  },

  { type: "text_scored", q: "If I asked you to find someone else…", rules: RULES_FIND_SOMEONE },
  { type: "text_scored", q: "I’m hard to handle. How would you stay?", rules: RULES_HARD_TO_HANDLE }
];

let mainIndex = 0;
const answers = []; // store text answers to email you later

function pushAnswer(question, text, hurt) {
  answers.push({
    question,
    answer: text,
    hurt: !!hurt
  });
}

/* ======================
   RENDER QUESTIONS
====================== */
function renderMainQuestion() {
  const q = MAIN[mainIndex];

  $("#mqPrompt").textContent = q.q;
  $("#mqChoices").innerHTML = "";
  showMsg($("#mqMsg"), "");

  // text question (max 100 words)
  if (q.type === "text_scored") {
    const ta = document.createElement("textarea");
    ta.className = "input";
    ta.rows = 6;
    ta.placeholder = `Answer honestly (max ${MAX_WORDS} words)…`;

    const btn = document.createElement("button");
    btn.className = "btn glow";
    btn.textContent = "Continue";

    btn.onclick = () => {
      const text = String(ta.value || "").trim();
      if (!text) return showMsg($("#mqMsg"), "Answer required.", "error");

      const w = countWords(text);
      if (w > MAX_WORDS) return showMsg($("#mqMsg"), `Maximum ${MAX_WORDS} words only.`, "error");

      const hurt = hurtsByRules(text, q.rules);
      if (hurt) {
        hearts = Math.max(0, hearts - 1);
        renderHearts();
      }

      pushAnswer(q.q, text, hurt);

      mainIndex++;
      endOrNext();
    };

    $("#mqChoices").appendChild(ta);
    $("#mqChoices").appendChild(btn);
    return;
  }

  // choice question
  q.a.forEach(choice => {
    const btn = document.createElement("div");
    btn.className = "choice";
    btn.textContent = choice.t;

    btn.onclick = () => {
      if (choice.d > 0) {
        hearts = Math.max(0, hearts - choice.d);
        renderHearts();
      }
      mainIndex++;
      endOrNext();
    };

    $("#mqChoices").appendChild(btn);
  });
}

async function endOrNext() {
  if (mainIndex < MAIN.length) {
    renderMainQuestion();
    return;
  }

  // end of questions
  showOnly(afterMain);

  const toGameBtn = $("#toGameBtn");
  toGameBtn.classList.add("hidden");

  // send answers to your email (backend will format)
  // NOTE: you need to create /api/send-answers (we’ll do that in your next step)
  try {
    await fetch("/api/send-answers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: getTokenFromUrl(),
        hearts,
        answers
      })
    });
  } catch {}

  if (hearts <= 0) {
    $("#afterMainTitle").textContent = "This stops here.";
    $("#afterMainBody").textContent = "I can’t do this if I’ll be hurt.";
    return;
  }

  $("#afterMainTitle").textContent = "Continue.";
  $("#afterMainBody").textContent = "";
  toGameBtn.classList.remove("hidden");
}

/* ======================
   HEART INSTRUCTION START
====================== */
$("#personalBtn").addEventListener("click", () => {
  hearts = 3;
  renderHearts();
  mainIndex = 0;
  renderMainQuestion();
  showOnly(main);
});

/* ======================
   HOLD GAME
====================== */
$("#toGameBtn").addEventListener("click", () => showOnly(game));

const holdBtn = $("#holdBtn");
const holdProgress = $("#holdProgress");

let holdTimer = null;
let holdPct = 0;
let holding = false;

const HOLD_TARGET = 100;
const HOLD_STEP = 0.8;
const HOLD_TICK = 35;

function resetHold() {
  clearInterval(holdTimer);
  holdTimer = null;
  holdPct = 0;
  holding = false;
  holdProgress.style.width = "0%";
}

function gameFail() {
  hearts = Math.max(0, hearts - 1);
  renderHearts();

  showOnly(afterGame);
  $("#afterGameTitle").textContent = "Too rushed.";
  $("#afterGameBody").textContent = "Patience matters.";
  $("#toScrollBtn").classList.toggle("hidden", hearts <= 0);
}

function gameWin() {
  showOnly(afterGame);
  $("#afterGameTitle").textContent = "You waited.";
  $("#afterGameBody").textContent = "That matters.";
  $("#toScrollBtn").classList.remove("hidden");
}

function startHold() {
  if (holding) return;
  holding = true;

  holdTimer = setInterval(() => {
    holdPct += HOLD_STEP;
    holdProgress.style.width = `${Math.min(holdPct, 100)}%`;

    if (holdPct >= HOLD_TARGET) {
      resetHold();
      gameWin();
    }
  }, HOLD_TICK);
}

function stopHold() {
  if (!holding) return;

  if (holdPct > 0 && holdPct < HOLD_TARGET) {
    resetHold();
    gameFail();
    return;
  }
  resetHold();
}

// Desktop
holdBtn.addEventListener("mousedown", startHold);
holdBtn.addEventListener("mouseup", stopHold);
holdBtn.addEventListener("mouseleave", stopHold);

// Mobile
holdBtn.addEventListener("touchstart", (e) => { e.preventDefault(); startHold(); }, { passive: false });
holdBtn.addEventListener("touchend", (e) => { e.preventDefault(); stopHold(); }, { passive: false });

/* ======================
   SCROLL LETTER (LONG + TYPE ANIM)
====================== */
$("#toScrollBtn").addEventListener("click", () => showOnly(scroll));

$("#openScroll").addEventListener("click", () => {
  $("#letterWrap").classList.remove("hidden");
  $("#toFinalBtn").classList.remove("hidden");
  typeLetter();
});

const LETTER = `
I didn’t want to make this a simple “yes” or “no”.

Because you’re not just a moment.
You’re not just a message.
You’re not just a person who asked.

I notice how you speak when you’re excited.
I notice how you respond when things don’t go your way.
I notice when you listen… and when you only wait for your turn to talk.

And the truth is—
I’ve always been careful with my heart.
Not because I’m cold.
Not because I don’t feel.
But because once I give it… I give it fully.

So I needed to see something first.

Not perfection.
Not a “right” answer.
Not a performance.

Just the way you choose to treat me
when it’s inconvenient.
When it takes time.
When it isn’t easy.
When I’m not ready.

If you’re still here…
it means you didn’t rush.
It means you stayed.

And maybe that’s the point.

I don’t want someone who only wants me when it’s simple.
I want someone who can hold steady when it’s quiet.
Someone who doesn’t punish me for needing space.
Someone who doesn’t love me like ownership.

So here’s the most honest thing I can say:

I’m not giving you a perfect answer—
but I’m giving you a real one.

And if you can handle “real”…

then maybe…
this is worth exploring.
`.trim();

let typed = false;

function typeLetter() {
  if (typed) return;
  typed = true;

  const el = $("#letter");
  el.textContent = "";
  let i = 0;

  const t = setInterval(() => {
    el.textContent += LETTER[i++] || "";
    if (i >= LETTER.length) clearInterval(t);
  }, 14);
}

$("#toFinalBtn").addEventListener("click", () => {
  showOnly(final);
  startFinalTimer();
  startGridGame();
});

/* ======================
   FINAL: 3-LEVEL CARD GAME (NO HEARTS)
====================== */
let photoExpired = false;
let photoTimerInt = null;

const TOTAL_MS = 3 * 60 * 1000;
let gameStart = 0;

let level = 1;
let targetIndex = -1;

function startFinalTimer() {
  photoExpired = false;
  const bar = $("#photoTimerBar");

  gameStart = Date.now();

  function tick() {
    const elapsed = Date.now() - gameStart;
    const remaining = Math.max(0, TOTAL_MS - elapsed);
    const ratio = remaining / TOTAL_MS;

    bar.style.transform = `scaleX(${ratio})`;

    if (remaining <= 0) {
      clearInterval(photoTimerInt);
      photoExpired = true;
      showMsg($("#levelMsg"), "Time’s up.", "error");
      $("#grid").classList.add("hidden");
      $("#photoStage").classList.add("hidden");
    }
  }

  tick();
  photoTimerInt = setInterval(tick, 200);
}

function startGridGame() {
  level = 1;
  $("#grid").classList.remove("hidden");
  $("#photoStage").classList.add("hidden");
  $("#rewardText").classList.add("hidden");
  showMsg($("#levelMsg"), "Level 1: Find the correct card.", "");

  buildGrid();
}

function buildGrid() {
  const grid = $("#grid");
  grid.innerHTML = "";

  // 25 tiles
  const total = 25;
  targetIndex = Math.floor(Math.random() * total);

  for (let i = 0; i < total; i++) {
    const tile = document.createElement("div");
    tile.className = "tile";

    tile.addEventListener("click", () => {
      if (photoExpired) return;

      if (i === targetIndex) {
        onFoundCorrect();
      } else {
        tile.classList.add("found");
        showMsg($("#levelMsg"), "Not this one.", "error");
      }
    });

    grid.appendChild(tile);
  }
}

function onFoundCorrect() {
  const reward = $("#rewardText");

  if (level === 1) {
    reward.textContent = "my";
    reward.classList.remove("hidden");
    showMsg($("#levelMsg"), "Good. Level 2.", "ok");
    level = 2;
    buildGrid();
    return;
  }

  if (level === 2) {
    reward.textContent = "answer is";
    reward.classList.remove("hidden");
    showMsg($("#levelMsg"), "Last level. Don’t rush.", "ok");
    level = 3;
    buildGrid();
    return;
  }

  // Level 3 success => show photo card + scratch
  $("#grid").classList.add("hidden");
  $("#photoStage").classList.remove("hidden");
  showMsg($("#levelMsg"), "You found it.", "ok");
  setupPhotoCardAndScratch();
}

/* ======================
   PHOTO CARD FLIP + SCRATCH
====================== */
const photoCard = $("#photoCard");

photoCard.addEventListener("click", () => {
  if (photoExpired) return;
  photoCard.classList.toggle("flipped");
});

function setupPhotoCardAndScratch() {
  const canvas = $("#scratch");
  const revealText = $("#revealText");
  const img = $("#hiddenPhoto");

  // ensure image is visible under scratch layer
  img.style.display = "block";

  // size canvas to card
  const rect = canvas.getBoundingClientRect();
  const w = Math.floor(rect.width);
  const h = Math.floor(rect.height);

  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d");

  // overlay paint
  ctx.fillStyle = "rgba(18,7,23,0.95)";
  ctx.fillRect(0, 0, w, h);

  ctx.globalCompositeOperation = "destination-out";

  let scratching = false;

  function scratchAt(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  function getPos(e) {
    const r = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - r.left, y: clientY - r.top };
  }

  function start(e) {
    e.preventDefault();
    scratching = true;
    revealText.style.display = "none";
    const p = getPos(e);
    scratchAt(p.x, p.y);
  }

  function move(e) {
    if (!scratching) return;
    e.preventDefault();
    const p = getPos(e);
    scratchAt(p.x, p.y);
  }

  function end(e) {
    e.preventDefault();
    scratching = false;
  }

  // Mouse
  canvas.addEventListener("mousedown", start);
  canvas.addEventListener("mousemove", move);
  window.addEventListener("mouseup", end);

  // Touch (mobile)
  canvas.addEventListener("touchstart", start, { passive: false });
  canvas.addEventListener("touchmove", move, { passive: false });
  canvas.addEventListener("touchend", end, { passive: false });

  showMsg($("#finalMsg"), "Flip it… then scratch the back.", "");
}

/* ======================
   BOOT
====================== */
(async function init() {
  const ok = await mustBeContinueToken();
  if (!ok) return showOnly(blocked);

  hearts = 3;
  renderHearts();
  showOnly(personal);
})();
