import { $, norm, showMsg, getTokenFromUrl } from "./shared.js";

const token = getTokenFromUrl();

// sections
const blocked = $("#blocked");
const personal = $("#personal");
const mainQuestions = $("#mainQuestions");
const afterMain = $("#afterMain");
const game = $("#game");
const afterGame = $("#afterGame");
const scroll = $("#scroll");
const final = $("#final");

// HUD
const hud = $("#hud");
const heartsBar = $("#heartsBar");

// personal Qs
const p1 = $("#p1");
const p2 = $("#p2");
const p1Msg = $("#p1Msg");
const p2Msg = $("#p2Msg");
const personalBtn = $("#personalBtn");
const personalMsg = $("#personalMsg");

// main Qs
const mqPrompt = $("#mqPrompt");
const mqChoices = $("#mqChoices");
const mqMsg = $("#mqMsg");
const afterMainTitle = $("#afterMainTitle");
const afterMainBody = $("#afterMainBody");
const toGameBtn = $("#toGameBtn");

// game
const steadyCanvas = $("#steadyCanvas");
const gameStart = $("#gameStart");
const gameReset = $("#gameReset");
const gameMsg = $("#gameMsg");
const afterGameTitle = $("#afterGameTitle");
const afterGameBody = $("#afterGameBody");
const toScrollBtn = $("#toScrollBtn");

// scroll
const openScroll = $("#openScroll");
const letterWrap = $("#letterWrap");
const letterEl = $("#letter");
const toFinalBtn = $("#toFinalBtn");

// final
const finalTitle = $("#finalTitle");
const finalSub = $("#finalSub");
const grid = $("#grid");
const finalMsg = $("#finalMsg");
const photoStage = $("#photoStage");
const photoCard = $("#photoCard");
const scratch = $("#scratch");
const revealText = $("#revealText");
const restart = $("#restart");

// Exact personal answers
const PERSONAL_1 = "153";
const PERSONAL_2 = "b.a.d.";

// Hearts start ONLY at main questions
let hearts = 3;

/* ===== content you can edit ===== */
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

const LETTER = `
If you’re reading this,
it means you didn’t rush.

And that already matters to me.

I notice how people treat me
when things take time,
when answers aren’t immediate,
when affection isn’t guaranteed.

I value patience more than promises.
Consistency more than intensity.
Presence more than pressure.

Some parts of me open slowly —
not because I’m unsure,
but because I want what enters
to stay.

If you’re still here,
it means you didn’t treat this like a game to beat,
but like a heart to understand.

And somewhere within this moment…
my answer exists.

But it’s here.
`.trim();

/* ===== helpers ===== */
function showOnly(section){
  [blocked, personal, mainQuestions, afterMain, game, afterGame, scroll, final]
    .forEach(el => el.classList.add("hidden"));
  section.classList.remove("hidden");
}

function hudOff(){ hud.classList.add("hidden"); }
function hudOn(){
  hud.classList.remove("hidden");
  renderHearts();
}

function renderHearts(){
  heartsBar.innerHTML = "";
  for(let i=0;i<hearts;i++){
    const h = document.createElement("div");
    h.className = "pixelHeart";
    heartsBar.appendChild(h);
  }
  for(let i=hearts;i<3;i++){
    const h = document.createElement("div");
    h.className = "pixelHeart broken";
    heartsBar.appendChild(h);
  }
}

function applyOutcome(titleEl, bodyEl, continueBtnEl){
  continueBtnEl.classList.add("hidden");

  if(hearts <= 0){
    titleEl.textContent = "I don’t think you meant to hurt my heart…";
    bodyEl.textContent = "but right now, I need someone who protects it. Let’s stay friends.";
    return "end";
  }
  if(hearts === 1){
    titleEl.textContent = "Let’s get to know each other better.";
    bodyEl.textContent = "But I don’t think you’re the right person for me… yet.";
    return "maybe";
  }

  titleEl.textContent = "Continue.";
  bodyEl.textContent = "";
  continueBtnEl.classList.remove("hidden");
  return "continue";
}

async function validateToken(){
  if(!token) return false;
  try{
    const res = await fetch(`/api/validate-token?token=${encodeURIComponent(token)}`);
    const data = await res.json().catch(()=>({}));
    return !!data.ok;
  } catch {
    return false;
  }
}

/* ===== personal Qs ===== */
personalBtn.addEventListener("click", () => {
  showMsg(p1Msg, "");
  showMsg(p2Msg, "");
  showMsg(personalMsg, "");

  const a1 = norm(p1.value);
  const a2 = norm(p2.value);

  if(a1 !== norm(PERSONAL_1)){
    showMsg(p1Msg, "Wrong.", "error");
    showMsg(personalMsg, "I don’t think you meant to hurt my heart… but right now, I need someone who protects it.", "error");
    return;
  }
  if(a2 !== norm(PERSONAL_2)){
    showMsg(p2Msg, "Wrong.", "error");
    showMsg(personalMsg, "I don’t think you meant to hurt my heart… but right now, I need someone who protects it.", "error");
    return;
  }

  // Start hearts + main questions
  hearts = 3;
  hudOn();
  mainIndex = 0;
  renderMainQuestion();
  showOnly(mainQuestions);
});

/* ===== main questions ===== */
let mainIndex = 0;

function renderMainQuestion(){
  const q = MAIN[mainIndex];
  mqPrompt.textContent = q.prompt;
  mqChoices.innerHTML = "";
  showMsg(mqMsg, "");

  q.choices.forEach(c => {
    const btn = document.createElement("div");
    btn.className = "choice";
    btn.textContent = c.text;
    btn.onclick = () => {
      if(c.dmg > 0){
        hearts = Math.max(0, hearts - c.dmg);
        renderHearts();
      }
      mainIndex++;

      if(mainIndex >= MAIN.length){
        showOnly(afterMain);
        applyOutcome(afterMainTitle, afterMainBody, toGameBtn);
      } else {
        renderMainQuestion();
      }
    };
    mqChoices.appendChild(btn);
  });
}

toGameBtn.addEventListener("click", () => {
  showOnly(game);
  initSteadyGame();
});

/* ===== hard game (steady hand) ===== */
let steady = null;

function initSteadyGame(){
  const ctx = steadyCanvas.getContext("2d");
  steady = {
    ctx,
    w: steadyCanvas.width,
    h: steadyCanvas.height,
    running:false,
    t:0,
    x: 60, y: 170,
    tx: 60, ty: 170,
    r: 6,
    segs: makeTunnel()
  };

  steadyCanvas.onmousemove = (e) => {
    const r = steadyCanvas.getBoundingClientRect();
    const sx = steadyCanvas.width / r.width;
    const sy = steadyCanvas.height / r.height;
    steady.tx = (e.clientX - r.left) * sx;
    steady.ty = (e.clientY - r.top) * sy;
  };

  gameStart.onclick = () => {
    if(steady.running) return;
    steady.running = true;
    showMsg(gameMsg, "Don’t touch the walls.", "");
    tick();
  };

  gameReset.onclick = () => reset();
  reset();

  function reset(){
    steady.running = false;
    steady.t = 0;
    steady.x = 60; steady.y = 170;
    steady.tx = 60; steady.ty = 170;
    showMsg(gameMsg, "Ready.", "");
    draw(0);
  }

  function makeTunnel(){
    return [
      { x: 40,  y: 150, w: 160, h: 40 },
      { x: 190, y: 110, w: 140, h: 34 },
      { x: 320, y: 150, w: 120, h: 34 },
      { x: 430, y: 95,  w: 120, h: 34 },
      { x: 540, y: 150, w: 130, h: 34 },
      { x: 660, y: 120, w: 140, h: 36 },
      { x: 760, y: 140, w: 40,  h: 60, goal:true }
    ];
  }

  function inside(x,y,wob){
    for(const s of steady.segs){
      const yy = s.y + (s.goal ? 0 : wob * 0.35);
      const ok = x>=s.x && x<=s.x+s.w && y>=yy && y<=yy+s.h;
      if(ok) return { ok:true, goal: !!s.goal };
    }
    return { ok:false, goal:false };
  }

  function tick(){
    if(!steady.running) return;
    steady.t += 1;

    // hard: slow follow
    steady.x += (steady.tx - steady.x) * 0.12;
    steady.y += (steady.ty - steady.y) * 0.12;

    const wob = Math.sin(steady.t * 0.04) * 10;
    const hit = inside(steady.x, steady.y, wob);

    if(!hit.ok){
      steady.running = false;
      hearts = Math.max(0, hearts - 1);
      renderHearts();
      showMsg(gameMsg, "💔 Too close.", "error");

      showOnly(afterGame);
      applyOutcome(afterGameTitle, afterGameBody, toScrollBtn);
      return;
    }

    if(hit.goal){
      steady.running = false;
      showMsg(gameMsg, "You made it.", "ok");

      showOnly(afterGame);
      applyOutcome(afterGameTitle, afterGameBody, toScrollBtn);
      return;
    }

    draw(wob);
    requestAnimationFrame(tick);
  }

  function draw(wob){
    const { ctx, w, h } = steady;
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle = "rgba(18,7,23,0.55)";
    ctx.fillRect(0,0,w,h);

    for(const s of steady.segs){
      const yy = s.y + (s.goal ? 0 : wob*0.35);
      ctx.fillStyle = s.goal ? "rgba(142,58,89,0.16)" : "rgba(168,139,203,0.10)";
      ctx.fillRect(s.x, yy, s.w, s.h);

      ctx.strokeStyle = s.goal ? "rgba(142,58,89,0.35)" : "rgba(168,139,203,0.22)";
      ctx.lineWidth = 2;
      ctx.strokeRect(s.x, yy, s.w, s.h);
    }

    ctx.beginPath();
    ctx.arc(steady.x, steady.y, steady.r, 0, Math.PI*2);
    ctx.fillStyle = "rgba(237,230,238,0.92)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(steady.x, steady.y, steady.r+8, 0, Math.PI*2);
    ctx.fillStyle = "rgba(168,139,203,0.10)";
    ctx.fill();
  }
}

toScrollBtn.addEventListener("click", () => {
  // Only allow continue when hearts >= 2 (button already hidden otherwise)
  showOnly(scroll);
});

/* ===== scroll ===== */
openScroll.addEventListener("click", () => {
  openScroll.classList.add("hidden");
  letterWrap.classList.remove("hidden");
  typeLetter(LETTER);
  toFinalBtn.classList.remove("hidden");
});

function typeLetter(text){
  letterEl.textContent = "";
  let i = 0;
  const timer = setInterval(() => {
    letterEl.textContent += text[i] || "";
    i++;
    if(i >= text.length) clearInterval(timer);
  }, 14);
}

toFinalBtn.addEventListener("click", () => {
  showOnly(final);
  startFinalLevels();
});

/* ===== final 3 levels ===== */
let level = 1;
let targetIndex = 0;

function startFinalLevels(){
  photoStage.classList.add("hidden");
  revealText.classList.add("hidden");
  grid.classList.remove("hidden");

  finalTitle.textContent = "Final.";
  level = 1;
  finalSub.textContent = 'Find: "my"';
  showMsg(finalMsg, "");

  buildGrid();
}

function buildGrid(){
  grid.innerHTML = "";
  const size = 25; // 5x5
  targetIndex = Math.floor(Math.random() * size);

  for(let i=0;i<size;i++){
    const t = document.createElement("div");
    t.className = "tile";
    t.textContent = "…";
    t.onclick = () => onTile(i, t);
    grid.appendChild(t);
  }
}

function onTile(i, el){
  if(i !== targetIndex){
    showMsg(finalMsg, "Wrong.", "error");
    return;
  }

  el.classList.add("found");

  if(level === 1){
    el.textContent = "my";
    level = 2;
    finalSub.textContent = 'Find: "answer is"';
    showMsg(finalMsg, "Continue.", "ok");
    setTimeout(buildGrid, 450);
    return;
  }

  if(level === 2){
    el.textContent = "answer is";
    level = 3;
    finalSub.textContent = "Find our photo.";
    showMsg(finalMsg, "Continue.", "ok");
    setTimeout(buildGrid, 450);
    return;
  }

  // Level 3 success -> photo stage
  el.textContent = "OUR PHOTO";
  showMsg(finalMsg, "Flip it.", "ok");

  setTimeout(() => {
    grid.classList.add("hidden");
    photoStage.classList.remove("hidden");
    initScratch();
  }, 600);
}

// flip card
photoCard.addEventListener("click", () => {
  photoCard.classList.toggle("flipped");
});

// scratch reveal
function initScratch(){
  const ctx = scratch.getContext("2d");
  ctx.clearRect(0,0,scratch.width, scratch.height);

  ctx.fillStyle = "rgba(18,7,23,0.92)";
  ctx.fillRect(0,0,scratch.width, scratch.height);

  ctx.fillStyle = "rgba(168,139,203,0.12)";
  ctx.font = "18px ui-monospace, Menlo, Consolas, monospace";
  ctx.fillText("SCRATCH", 20, 36);

  let scratching = false;
  let scratched = 0;

  function scratchAt(x,y){
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x,y,18,0,Math.PI*2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    scratched += 1;
    if(scratched > 180){
      revealText.classList.remove("hidden");
    }
  }

  function getXY(e){
    const r = scratch.getBoundingClientRect();
    const sx = scratch.width / r.width;
    const sy = scratch.height / r.height;
    return {
      x: (e.clientX - r.left) * sx,
      y: (e.clientY - r.top) * sy
    };
  }

  scratch.addEventListener("mousedown", () => scratching = true);
  window.addEventListener("mouseup", () => scratching = false);

  scratch.addEventListener("mousemove", (e) => {
    if(!scratching) return;
    const {x,y} = getXY(e);
    scratchAt(x,y);
  });

  // mobile
  scratch.addEventListener("touchstart", () => scratching = true, { passive:true });
  window.addEventListener("touchend", () => scratching = false, { passive:true });
  scratch.addEventListener("touchmove", (e) => {
    if(!scratching) return;
    const t = e.touches[0];
    const fake = { clientX: t.clientX, clientY: t.clientY };
    const {x,y} = getXY(fake);
    scratchAt(x,y);
  }, { passive:true });
}

restart.addEventListener("click", () => window.location.reload());

/* ===== boot ===== */
(async function boot(){
  hudOff();
  const ok = await validateToken();
  if(!ok){
    showOnly(blocked);
    return;
  }
  showOnly(personal);
})();
