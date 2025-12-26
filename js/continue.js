import { $, norm, showMsg, getTokenFromUrl } from "./shared.js";

const token = getTokenFromUrl();

/* ======================
   TOKEN VALIDATION
====================== */
async function validateToken() {
  if (!token) return { ok: false };
  try {
    const res = await fetch(`/api/validate-token?token=${encodeURIComponent(token)}`);
    const data = await res.json().catch(() => ({}));
    return data;
  } catch {
    return { ok: false };
  }
}

/* ======================
   SECTIONS
====================== */
const blocked = $("#blocked");
const personal = $("#personal");        // used as HEART INSTRUCTIONS screen
const main = $("#mainQuestions");
const afterMain = $("#afterMain");
const game = $("#game");
const afterGame = $("#afterGame");
const scroll = $("#scroll");
const final = $("#final");

function showOnly(section) {
  [blocked, personal, main, afterMain, game, afterGame, scroll, final]
    .forEach(s => s.classList.add("hidden"));
  section.classList.remove("hidden");
}

/* ======================
   HEARTS HUD
====================== */
const heartsWrap = $("#hearts");
const HEART_OK = "/assets/heart.svg";
const HEART_BROKEN = "/assets/heart-broken.svg";

let hearts = 3;

function hudOff() { heartsWrap.classList.add("hidden"); }
function hudOn() { heartsWrap.classList.remove("hidden"); renderHearts(); }

function renderHearts() {
  heartsWrap.innerHTML = "";
  for (let i = 0; i < 3; i++) {
    const img = document.createElement("img");
    img.src = i < hearts ? HEART_OK : HEART_BROKEN;
    img.className = "heart";
    img.alt = "heart";
    heartsWrap.appendChild(img);
  }
}

/* ======================
   AUTO HEART DAMAGE (TEXT) — ONLY FOR 3 QUESTIONS
   Minimum length: 80 chars (B)
====================== */
const MIN_TEXT_LEN = 80;

function scoreByRules(answerRaw, rules) {
  const a = String(answerRaw || "").toLowerCase();

  const redCount = rules.red.reduce((acc, rx) => acc + (rx.test(a) ? 1 : 0), 0);
  const yellowCount = rules.yellow.reduce((acc, rx) => acc + (rx.test(a) ? 1 : 0), 0);
  const greenCount = rules.green.reduce((acc, rx) => acc + (rx.test(a) ? 1 : 0), 0);

  // Red dominates → -2
  if (redCount >= 1 && redCount >= greenCount + 1) return 2;

  // Yellow without green → -1
  if (yellowCount >= 1 && greenCount === 0) return 1;

  // Otherwise safe → 0
  return 0;
}

const RULES_LEAVING = {
  // leaving after college
  red: [
    /don'?t\s+leave|stay\s+here|change\s+your\s+plan|stop\s+college|don'?t\s+go/i,
    /if\s+you\s+love\s+me.*(you|you'll)\s+stay/i,
    /you\s+owe\s+me|after\s+all\s+i\s+did/i,
    /i\s+won'?t\s+allow|i\s+won'?t\s+accept/i,
    /it'?s\s+selfish|ang\s+selfish|bahala\s+ka\s+na/i
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
    /i'?ll\s+keep\s+trying\s+until/i,
    /you\s+owe\s+me|after\s+all\s+i\s+did/i,
    /i\s+deserve\s+you|you\s+belong\s+to\s+me/i,
    /i'?ll\s+fight\s+you|i'?ll\s+fight\s+for\s+you\s+no\s+matter\s+what/i
  ],
  yellow: [
    /i\s+would\s+beg|please\s+don'?t\s+leave/i,
    /i\s+can'?t\s+move\s+on/i,
    /i\s+would\s+be\s+broken|i\s+would\s+break/i,
    /i\s+will\s+wait\s+forever/i
  ],
  green: [
    /i\s+respect\s+your\s+decision|i\s+respect\s+it/i,
    /i\s+won'?t\s+pressure|no\s+pressure/i,
    /i\s+will\s+step\s+back|i\s+will\s+let\s+you\s+go/i,
    /i\s+care\s+about\s+what\s+you\s+need/i,
    /i\s+will\s+accept/i
  ]
};

const RULES_HARD_TO_HANDLE = {
  red: [
    /i\s+will\s+control|i\s+will\s+change\s+you|i\s+will\s+fix\s+you/i,
    /i\s+own\s+you|you\s+are\s+mine|you\s+belong\s+to\s+me/i,
    /i\s+won'?t\s+take\s+no|i\s+won'?t\s+accept\s+no/i,
    /if\s+you\s+love\s+me.*you\s+should/i,
    /i\s+will\s+get\s+mad|i\s+will\s+punish|silent\s+treatment/i
  ],
  yellow: [
    /i\s+will\s+try\s+my\s+best/i,
    /i\s+will\s+endure|i\s+can\s+endure/i,
    /i'?ll\s+adjust\s+for\s+you/i,
    /i'?m\s+not\s+perfect/i
  ],
  green: [
    /i\s+will\s+communicate|communication/i,
    /i\s+will\s+listen|i\s+will\s+understand/i,
    /boundaries|respect\s+your\s+boundaries/i,
    /patience|gentle|calm/i,
    /i\s+won'?t\s+rush|no\s+pressure/i
  ]
};

/* ======================
   HEART INSTRUCTIONS SCREEN (FIRST)
====================== */
const personalBtn = $("#personalBtn");
const personalMsg = $("#personalMsg");

// You can put the instruction text in continue.html,
// but we also ensure the button works:
personalBtn.textContent = "I understand";
showMsg(personalMsg, "", "");

// click -> start main questions
personalBtn.addEventListener("click", () => {
  hearts = 3;
  hudOn();
  mainIndex = 0;
  renderMainQuestion();
  showOnly(main);
});

/* ======================
   MAIN QUESTIONS
   - choice questions affect hearts
   - ONLY these 3 text questions can auto-damage hearts
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

  // TEXT (scored) #1
  {
    type: "text_scored",
    q: "I already told you I will be leaving after college. How do you honestly feel about that?",
    rules: RULES_LEAVING
  },

  {
    type: "choice",
    q: "If I’m not allowed to have a boyfriend yet…",
    a: [
      { t: "I respect it and never pressure you.", d: 0 },
      { t: "I stay, but I struggle privately.", d: 1 },
      { t: "I think rules shouldn’t apply to us.", d: 2 }
    ]
  },

  // TEXT (scored) #2
  {
    type: "text_scored",
    q: "If I told you to find someone else instead… what would you do, and why?",
    rules: RULES_FIND_SOMEONE
  },

  // TEXT (scored) #3
  {
    type: "text_scored",
    q: "You already know by now that I’m really hard to handle. How would you handle me and stay with me?",
    rules: RULES_HARD_TO_HANDLE
  }
];

let mainIndex = 0;

function renderMainQuestion() {
  const q = MAIN[mainIndex];
  $("#mqPrompt").textContent = q.q;
  $("#mqChoices").innerHTML = "";
  showMsg($("#mqMsg"), "");

  // Scored text question (required + auto heart damage)
  if (q.type === "text_scored") {
    const ta = document.createElement("textarea");
    ta.className = "input";
    ta.rows = 6;
    ta.placeholder = `Answer honestly (min ${MIN_TEXT_LEN} characters)…`;

    const btn = document.createElement("button");
    btn.className = "btn glow";
    btn.textContent = "Continue";

    btn.onclick = () => {
      const v = String(ta.value || "").trim();

      if (!v) {
        showMsg($("#mqMsg"), "Required.", "error");
        return;
      }
      if (v.length < MIN_TEXT_LEN) {
        showMsg($("#mqMsg"), `Please explain more (at least ${MIN_TEXT_LEN} characters).`, "error");
        return;
      }

      // silent heart damage
      const dmg = scoreByRules(v, q.rules);
      if (dmg > 0) {
        hearts = Math.max(0, hearts - dmg);
        renderHearts();
      }

      mainIndex++;
      endOrNext();
    };

    $("#mqChoices").appendChild(ta);
    $("#mqChoices").appendChild(btn);
    return;
  }

  // Choice question
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

function endOrNext() {
  if (mainIndex < MAIN.length) {
    renderMainQuestion();
    return;
  }

  showOnly(afterMain);

  const toGameBtn = $("#toGameBtn");
  toGameBtn.classList.add("hidden");

  if (hearts <= 0) {
    $("#afterMainTitle").textContent = "I don’t think you meant to hurt my heart…";
    $("#afterMainBody").textContent =
      "but right now, I need someone who protects it. Let’s stay friends.";
    return;
  }

  if (hearts === 1) {
    $("#afterMainTitle").textContent = "Let’s get to know each other better.";
    $("#afterMainBody").textContent =
      "But I don’t think you’re the right person for me… yet.";
    return;
  }

  $("#afterMainTitle").textContent = "Continue.";
  $("#afterMainBody").textContent = "";
  toGameBtn.classList.remove("hidden");
}

/* ======================
   GAME (HARD HOLD) — stable for desktop + mobile
====================== */
$("#toGameBtn").addEventListener("click", () => {
  showOnly(game);
});

const panel = document.querySelector(".panel");
panel.innerHTML = `
  <div class="hold-box">
    <div class="hold-progress" id="holdProgress"></div>
    <button id="holdBtn" class="hold-btn">HOLD</button>
  </div>
  <p class="note">Hold without letting go. Letting go breaks a heart.</p>
`;

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
  $("#toScrollBtn").classList.toggle("hidden", hearts < 2);
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

  // releasing early = fail
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
   SCROLL
====================== */
$("#toScrollBtn").addEventListener("click", () => {
  showOnly(scroll);
});

$("#openScroll").addEventListener("click", () => {
  $("#letterWrap").classList.remove("hidden");
  $("#toFinalBtn").classList.remove("hidden");
  typeLetter();
});

const LETTER = `
If you’re here,
you didn’t rush.

I notice how people treat me
when things take time.

If you can stay without pressure,
then maybe this is worth exploring.
`.trim();

function typeLetter() {
  const el = $("#letter");
  el.textContent = "";
  let i = 0;

  const t = setInterval(() => {
    el.textContent += LETTER[i++] || "";
    if (i >= LETTER.length) clearInterval(t);
  }, 18);
}

/* ======================
   FINAL (3-min pixel timer)
   - no wrong/right feedback
====================== */
let photoExpired = false;
let photoTimerInt = null;

$("#toFinalBtn").addEventListener("click", () => {
  showOnly(final);
  startPhotoTimer();
});

$("#photoCard").addEventListener("click", () => {
  if (photoExpired) return;
  $("#photoCard").classList.toggle("flipped");
});

function startPhotoTimer() {
  photoExpired = false;

  // insert timer UI if not present
  if (!document.querySelector("#photoTimerTrack")) {
    const track = document.createElement("div");
    track.id = "photoTimerTrack";
    track.className = "timerTrack";

    const bar = document.createElement("div");
    bar.id = "photoTimerBar";
    bar.className = "timerBar";
    track.appendChild(bar);

    const wrap = document.createElement("div");
    wrap.className = "timerWrap";
    wrap.appendChild(track);

    const help = document.createElement("p");
    help.className = "subtitle";
    help.textContent = "You don’t need to rush. You have a little time. Find it — or don’t.";
    wrap.appendChild(help);

    // put above grid
    const stack = final.querySelector(".stack");
    stack.insertBefore(wrap, $("#grid"));
  }

  const bar = $("#photoTimerBar");
  const TOTAL = 3 * 60 * 1000;
  const start = Date.now();

  function tick() {
    const now = Date.now();
    const remaining = Math.max(0, TOTAL - (now - start));
    const ratio = remaining / TOTAL;

    bar.style.transform = `scaleX(${ratio})`;

    if (remaining <= 0) {
      clearInterval(photoTimerInt);
      photoExpired = true;

      $("#grid").classList.add("hidden");
      $("#photoStage")?.classList.add("hidden");
      showMsg($("#finalMsg"), "Some things aren’t meant to be rushed.", "error");
    }
  }

  tick();
  photoTimerInt = setInterval(tick, 250);
}

/* ======================
   BOOT
====================== */
(async function boot() {
  hudOff();

  const v = await validateToken();
  if (!v.ok || v.stage !== "full") {
    showOnly(blocked);
    return;
  }

  // Start at heart instruction screen
  showOnly(personal);
})();
