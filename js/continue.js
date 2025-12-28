import { $, showMsg, getTokenFromUrl } from "./shared.js";

/* ======================
   TOKEN
====================== */
const token = getTokenFromUrl();

/* ======================
   SECTIONS
====================== */
const blocked   = $("#blocked");
const personal  = $("#personal");
const main      = $("#mainQuestions");
const afterMain = $("#afterMain");
const game      = $("#game");
const scroll    = $("#scroll");
const final     = $("#final");

function showOnly(section) {
  [blocked, personal, main, afterMain, game, scroll, final]
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

function renderHearts() {
  heartsWrap.innerHTML = "";
  for (let i = 0; i < 3; i++) {
    const img = document.createElement("img");
    img.src = i < hearts ? HEART_OK : HEART_BROKEN;
    img.className = "heart";
    heartsWrap.appendChild(img);
  }
}

function hudOn() {
  heartsWrap.classList.remove("hidden");
  renderHearts();
}

/* ======================
   SCORING RULES
====================== */
const MIN_TEXT_LEN = 80;

function scoreByRules(answer, rules) {
  const a = answer.toLowerCase();
  if (rules.red.some(r => r.test(a))) return 2;
  if (rules.yellow.some(r => r.test(a))) return 1;
  return 0;
}

const RULES_LEAVING = {
  red: [/don'?t\s+leave|stay\s+here|owe\s+me/i],
  yellow: [/hard|struggle|not\s+sure/i],
  green: [/respect|support|future|dream/i]
};

const RULES_FIND = {
  red: [/won'?t\s+accept|force|belong/i],
  yellow: [/beg|wait\s+forever/i],
  green: [/respect|let\s+you\s+go|accept/i]
};

const RULES_HANDLE = {
  red: [/control|own|punish/i],
  yellow: [/try\s+my\s+best|adjust/i],
  green: [/communicate|patience|boundaries/i]
};

/* ======================
   QUESTIONS
====================== */
const QUESTIONS = [
  {
    type: "choice",
    q: "When I say I’m not ready today…",
    a: [
      { t: "I respect your pace.", d: 0 },
      { t: "I feel frustrated.", d: 1 },
      { t: "I pressure you.", d: 2 }
    ]
  },
  {
    type: "text",
    q: "I will be leaving after college. How do you feel?",
    rules: RULES_LEAVING
  },
  {
    type: "choice",
    q: "If I’m not allowed a boyfriend yet…",
    a: [
      { t: "I respect it.", d: 0 },
      { t: "I struggle quietly.", d: 1 },
      { t: "Rules shouldn’t apply.", d: 2 }
    ]
  },
  {
    type: "text",
    q: "If I asked you to find someone else…",
    rules: RULES_FIND
  },
  {
    type: "text",
    q: "I’m hard to handle. How would you stay?",
    rules: RULES_HANDLE
  }
];

let index = 0;

function renderQuestion() {
  const q = QUESTIONS[index];
  $("#mqPrompt").textContent = q.q;
  $("#mqChoices").innerHTML = "";
  showMsg($("#mqMsg"), "");

  if (q.type === "text") {
    const ta = document.createElement("textarea");
    ta.className = "input";
    ta.rows = 5;

    const btn = document.createElement("button");
    btn.className = "btn glow";
    btn.textContent = "Continue";

    btn.onclick = () => {
      const v = ta.value.trim();
      if (v.length < MIN_TEXT_LEN) {
        showMsg($("#mqMsg"), "Please explain more.", "error");
        return;
      }
      hearts = Math.max(0, hearts - scoreByRules(v, q.rules));
      renderHearts();
      index++;
      next();
    };

    $("#mqChoices").append(ta, btn);
    return;
  }

  q.a.forEach(c => {
    const div = document.createElement("div");
    div.className = "choice";
    div.textContent = c.t;
    div.onclick = () => {
      hearts = Math.max(0, hearts - c.d);
      renderHearts();
      index++;
      next();
    };
    $("#mqChoices").appendChild(div);
  });
}

function next() {
  if (index < QUESTIONS.length) {
    renderQuestion();
    return;
  }

  showOnly(afterMain);
  const btn = $("#toGameBtn");

  if (hearts <= 1) return;

  $("#afterMainTitle").textContent = "Continue.";
  btn.classList.remove("hidden");
}

/* ======================
   GAME
====================== */
$("#toGameBtn").onclick = () => {
  showOnly(game);
};

let holding = false;
let progress = 0;
let timer;

const bar = $("#holdProgress");
const holdBtn = $("#holdBtn");

holdBtn.onmousedown = start;
holdBtn.onmouseup = stop;
holdBtn.ontouchstart = e => { e.preventDefault(); start(); };
holdBtn.ontouchend = e => { e.preventDefault(); stop(); };

function start() {
  if (holding) return;
  holding = true;
  timer = setInterval(() => {
    progress += 1;
    bar.style.width = progress + "%";
    if (progress >= 100) {
      clearInterval(timer);
      showOnly(scroll);
    }
  }, 30);
}

function stop() {
  if (!holding) return;
  clearInterval(timer);
  holding = false;
  progress = 0;
  bar.style.width = "0%";
}

/* ======================
   SCROLL
====================== */
$("#openScroll").onclick = () => {
  $("#toFinalBtn").classList.remove("hidden");
};

$("#toFinalBtn").onclick = () => {
  showOnly(final);
  startPhotoTimer();
};

/* ======================
   FINAL TIMER
====================== */
function startPhotoTimer() {
  const bar = $("#photoTimerBar");
  const total = 3 * 60 * 1000;
  const start = Date.now();

  const t = setInterval(() => {
    const left = Math.max(0, total - (Date.now() - start));
    bar.style.transform = `scaleX(${left / total})`;
    if (left <= 0) {
      clearInterval(t);
      showMsg($("#finalMsg"), "Some things aren’t meant to be rushed.", "error");
    }
  }, 200);
}

/* ======================
   BOOT
====================== */
(async function () {
  if (!token) return showOnly(blocked);

  const res = await fetch(`/api/validate-token?token=${encodeURIComponent(token)}`);
  const data = await res.json();

  if (!data.ok || data.stage !== "continue") {
    showOnly(blocked);
    return;
  }

  hudOn();
  showOnly(personal);

  $("#personalBtn").onclick = () => {
    index = 0;
    renderQuestion();
    showOnly(main);
  };
})();
