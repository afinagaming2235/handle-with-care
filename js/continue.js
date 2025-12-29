import { $, showMsg, getTokenFromUrl } from "./shared.js";

/* ======================
   TOKEN CHECK
====================== */
(async function () {
  const token = getTokenFromUrl();
  if (!token) return showOnly($("#blocked"));

  const res = await fetch(`/api/validate-token?token=${encodeURIComponent(token)}`);
  const data = await res.json().catch(() => null);

  if (!data || !data.ok || data.stage !== "continue")
    return showOnly($("#blocked"));

  showOnly($("#personal"));
})();

/* ======================
   SECTIONS
====================== */
const sections = [
  "blocked","personal","mainQuestions",
  "afterMain","game","scroll","final"
].map(id => $(`#${id}`));

function showOnly(el) {
  sections.forEach(s => s.classList.add("hidden"));
  el.classList.remove("hidden");
}

/* ======================
   HEARTS
====================== */
let hearts = 3;
const heartsWrap = $("#hearts");

function renderHearts() {
  heartsWrap.innerHTML = "";
  for (let i = 0; i < 3; i++) {
    const img = document.createElement("img");
    img.src = i < hearts ? "/assets/heart.svg" : "/assets/heart-broken.svg";
    img.className = "heart";
    heartsWrap.appendChild(img);
  }
}

$("#personalBtn").onclick = () => {
  heartsWrap.classList.remove("hidden");
  renderHearts();
  index = 0;
  renderQuestion();
  showOnly($("#mainQuestions"));
};

/* ======================
   QUESTIONS
====================== */
const allAnswers = [];
const MIN = 80, MAX = 200;

const HURT = /you owe|after all|stay for me|don’t leave|if you love me|force/i;

const MAIN = [
  { type:"choice", q:"When I say I’m not ready today…",
    a:[
      {t:"I respect your pace.",d:0},
      {t:"I struggle but stay.",d:1},
      {t:"I pressure you.",d:2}
    ]},
  { type:"choice", q:"When I become quiet…",
    a:[
      {t:"I stay present.",d:0},
      {t:"I push.",d:1},
      {t:"I withdraw.",d:2}
    ]},
  { type:"text", q:"I will be leaving after college. How do you feel?" },
  { type:"text", q:"If I asked you to find someone else…" },
  { type:"text", q:"I’m hard to handle. How would you stay?" }
];

let index = 0;

function renderQuestion() {
  const q = MAIN[index];
  $("#mqPrompt").textContent = q.q;
  $("#mqChoices").innerHTML = "";
  showMsg($("#mqMsg"),"");

  if (q.type === "choice") {
    q.a.forEach(c => {
      const d = document.createElement("div");
      d.className = "choice";
      d.textContent = c.t;
      d.onclick = () => {
        hearts = Math.max(0, hearts - c.d);
        renderHearts();
        allAnswers.push({q:q.q,a:c.t});
        next();
      };
      $("#mqChoices").appendChild(d);
    });
    return;
  }

  const ta = document.createElement("textarea");
  ta.className = "input";
  ta.rows = 6;

  const btn = document.createElement("button");
  btn.className = "btn glow";
  btn.textContent = "Continue";

  btn.onclick = () => {
    const text = ta.value.trim();
    const wc = text.split(/\s+/).length;
    if (wc < MIN || wc > MAX)
      return showMsg($("#mqMsg"),`80–200 words required.`,"error");

    if (HURT.test(text)) {
      hearts = Math.max(0, hearts - 1);
      renderHearts();
    }

    allAnswers.push({q:q.q,a:text});
    next();
  };

  $("#mqChoices").append(ta,btn);
}

function next() {
  index++;
  index < MAIN.length ? renderQuestion() : afterQuestions();
}

function afterQuestions() {
  showOnly($("#afterMain"));
  $("#afterMainTitle").textContent =
    hearts > 0 ? "You didn’t rush." : "Some answers hurt.";
  $("#toGameBtn").classList.toggle("hidden", hearts <= 0);
}

/* ======================
   HOLD GAME
====================== */
$("#toGameBtn").onclick = () => showOnly($("#game"));

let pct = 0, timer;
$("#holdBtn").onmousedown = () => {
  timer = setInterval(() => {
    pct += 1;
    $("#holdProgress").style.width = pct + "%";
    if (pct >= 100) {
      clearInterval(timer);
      showOnly($("#scroll"));
    }
  }, 30);
};
$("#holdBtn").onmouseup = () => clearInterval(timer);

/* ======================
   SCROLL LETTER (LONG VERSION)
====================== */
const LETTER = `
I didn’t want a yes.
I didn’t want a no.

I wanted to see how you speak
when the answer isn’t obvious.

Some people rush.
Some people pressure.
Some people stay only if it’s easy.

If you’re here,
it means you didn’t force your way through.

You stayed.
You waited.
You listened.

That already tells me something.
`.trim();

$("#openScroll").onclick = () => {
  const el = $("#letter");
  el.textContent = "";
  let i = 0;
  const t = setInterval(() => {
    el.textContent += LETTER[i++] || "";
    if (i >= LETTER.length) clearInterval(t);
  }, 18);
  $("#toFinalBtn").classList.remove("hidden");
};

$("#toFinalBtn").onclick = () => startFinal();

/* ======================
   FINAL CARD GAME
====================== */
function startFinal() {
  showOnly($("#final"));
  startTimer();
  buildGrid();
}

let level = 0;
const words = ["my","answer is",""];

function buildGrid() {
  const grid = $("#cardGrid");
  grid.innerHTML = "";
  for (let i=0;i<15;i++) {
    const t = document.createElement("div");
    t.className = "tile";
    t.textContent = i===Math.floor(Math.random()*15) ? words[level] : "";
    t.onclick = () => {
      if (!t.textContent) return;
      level++;
      level<3 ? buildGrid() : revealPhoto();
    };
    grid.appendChild(t);
  }
}

/* ======================
   TIMER (NO HEARTS)
====================== */
function startTimer() {
  const TOTAL = 180000;
  const start = Date.now();
  const bar = $("#photoTimerBar");

  const i = setInterval(() => {
    const r = Math.max(0, TOTAL - (Date.now()-start));
    bar.style.transform = `scaleX(${r/TOTAL})`;
    if (r<=0) {
      clearInterval(i);
      showMsg($("#finalMsg"),"Time ran out.","error");
    }
  },200);
}

/* ======================
   SCRATCH
====================== */
function revealPhoto() {
  $("#cardGrid").classList.add("hidden");
  $("#photoStage").classList.remove("hidden");

  const c = $("#scratch");
  const ctx = c.getContext("2d");
  c.width = 360;
  c.height = 240;

  ctx.fillStyle = "#120717";
  ctx.fillRect(0,0,c.width,c.height);

  c.onmousemove = e => {
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(e.offsetX,e.offsetY,18,0,Math.PI*2);
    ctx.fill();
  };
}
