import { $, norm, showMsg, getTokenFromUrl } from "./shared.js";


const token = getTokenFromUrl();


const blocked = $("#blocked");
const personal = $("#personal");
const mainQuestions = $("#mainQuestions");
const afterMain = $("#afterMain");
const game = $("#game");
const afterGame = $("#afterGame");
const scroll = $("#scroll");
const final = $("#final");


const hud = $("#hud");
const heartsEl = $("#hearts");

const HEART_OK = "/assets/heart.svg";
const HEART_BROKEN = "/assets/heart-broken.svg";

let hearts = 3;


const p1 = $("#p1");
const p2 = $("#p2");
const p1Msg = $("#p1Msg");
const p2Msg = $("#p2Msg");
const personalBtn = $("#personalBtn");
const personalMsg = $("#personalMsg");

const PERSONAL_1 = "153";
const PERSONAL_2 = "b.a.d.";


const mqPrompt = $("#mqPrompt");
const mqChoices = $("#mqChoices");
const mqMsg = $("#mqMsg");
const afterMainTitle = $("#afterMainTitle");
const afterMainBody = $("#afterMainBody");
const toGameBtn = $("#toGameBtn");

const MAIN = [
  {
    prompt: "If I say I’m not ready today…",
    choices: [
      { text: "I wait and respect your pace.", dmg: 0 },
      { text: "I push a little.", dmg: 1 },
      { text: "I make you feel guilty.", dmg: 2 }
    ]
  },
  {
    prompt: "When I go quiet…",
    choices: [
      { text: "I stay without pressure.", dmg: 0 },
      { text: "I keep asking.", dmg: 1 },
      { text: "I pull away to punish.", dmg: 2 }
    ]
  },
  {
    prompt: "If distance happens again…",
    choices: [
      { text: "I stay consistent.", dmg: 0 },
      { text: "I struggle silently.", dmg: 1 },
      { text: "I demand control.", dmg: 2 }
    ]
  }
];

let mainIndex = 0;


const steadyCanvas = $("#steadyCanvas");
const gameStart = $("#gameStart");
const gameReset = $("#gameReset");
const gameMsg = $("#gameMsg");

const afterGameTitle = $("#afterGameTitle");
const afterGameBody = $("#afterGameBody");
const toScrollBtn = $("#toScrollBtn");


const openScroll = $("#openScroll");
const letterWrap = $("#letterWrap");
const letterEl = $("#letter");
const toFinalBtn = $("#toFinalBtn");


const finalTitle = $("#finalTitle");
const finalSub = $("#finalSub");
const grid = $("#grid");
const finalMsg = $("#finalMsg");
const photoStage = $("#photoStage");
const photoCard = $("#photoCard");
const scratch = $("#scratch");
const revealText = $("#revealText");
const restart = $("#restart");


const LETTER = `
If you’re reading this,
it means you didn’t rush.

I value patience over promises.
Consistency over intensity.

If you’re still here,
it means you treated this
like a heart —
not a challenge.

And that already matters.
`.trim();


function showOnly(section) {
  [blocked, personal, mainQuestions, afterMain, game, afterGame, scroll, final]
    .forEach(s => s.classList.add("hidden"));
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

function applyOutcome(titleEl, bodyEl, btn) {
  btn.classList.add("hidden");

  if (hearts <= 0) {
    titleEl.textContent = "I don’t feel safe.";
    bodyEl.textContent = "I need someone who protects my heart.";
    return;
  }

  if (hearts === 1) {
    titleEl.textContent = "Not yet.";
    bodyEl.textContent = "You’re not ready for this.";
    return;
  }

  btn.classList.remove("hidden");
}


async function validateToken() {
  if (!token) return false;
  const res = await fetch(`/api/validate-token?token=${encodeURIComponent(token)}`);
  const data = await res.json().catch(() => ({}));
  return !!data.ok;
}


personalBtn.onclick = () => {
  showMsg(p1Msg, "");
  showMsg(p2Msg, "");
  showMsg(personalMsg, "");

  if (norm(p1.value) !== norm(PERSONAL_1) || norm(p2.value) !== norm(PERSONAL_2)) {
    showMsg(personalMsg, "This was personal. And it matters.", "error");
    return;
  }

  hearts = 3;
  hudOn();
  mainIndex = 0;
  renderMainQuestion();
  showOnly(mainQuestions);
};


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

toGameBtn.onclick = () => {
  showOnly(game);
  initSteadyGame();
};


function initSteadyGame() {
  const ctx = steadyCanvas.getContext("2d");
  let running = false;
  let x = 60, y = 160;
  let tx = 60, ty = 160;

  const tunnel = [
    { x: 40, y: 140, w: 160, h: 40 },
    { x: 220, y: 120, w: 140, h: 36 },
    { x: 380, y: 140, w: 140, h: 36 },
    { x: 540, y: 120, w: 140, h: 36 },
    { x: 720, y: 140, w: 40, h: 60, goal: true }
  ];

  steadyCanvas.onmousemove = e => {
    const r = steadyCanvas.getBoundingClientRect();
    tx = (e.clientX - r.left) * (steadyCanvas.width / r.width);
    ty = (e.clientY - r.top) * (steadyCanvas.height / r.height);
  };

  gameStart.onclick = () => {
    running = true;
    tick();
  };

  gameReset.onclick = () => reset();

  function reset() {
    running = false;
    x = tx = 60;
    y = ty = 160;
    draw();
  }

  function inside(px, py) {
    return tunnel.some(t =>
      px >= t.x && px <= t.x + t.w &&
      py >= t.y && py <= t.y + t.h
    );
  }

  function tick() {
    if (!running) return;

    x += (tx - x) * 0.12;
    y += (ty - y) * 0.12;

    if (!inside(x, y)) {
      running = false;
      hearts--;
      renderHearts();
      showOnly(afterGame);
      applyOutcome(afterGameTitle, afterGameBody, toScrollBtn);
      return;
    }

    draw();
    requestAnimationFrame(tick);
  }

  function draw() {
    ctx.clearRect(0, 0, steadyCanvas.width, steadyCanvas.height);
    tunnel.forEach(t => {
      ctx.fillStyle = t.goal ? "rgba(140,60,90,.3)" : "rgba(200,160,220,.15)";
      ctx.fillRect(t.x, t.y, t.w, t.h);
    });
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
  }

  reset();
}

toScrollBtn.onclick = () => showOnly(scroll);


openScroll.onclick = () => {
  openScroll.classList.add("hidden");
  letterWrap.classList.remove("hidden");
  typeLetter(LETTER);
  toFinalBtn.classList.remove("hidden");
};

function typeLetter(text) {
  letterEl.textContent = "";
  let i = 0;
  const t = setInterval(() => {
    letterEl.textContent += text[i++] || "";
    if (i >= text.length) clearInterval(t);
  }, 14);
}

toFinalBtn.onclick = () => {
  showOnly(final);
};


(async function boot() {
  hudOff();
  if (!(await validateToken())) {
    showOnly(blocked);
    return;
  }
  showOnly(personal);
})();
