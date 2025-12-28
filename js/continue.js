import { $, showMsg, getTokenFromUrl } from "./shared.js";

/* ======================
   TOKEN VALIDATION
====================== */
const token = getTokenFromUrl();

async function validateToken() {
  if (!token) return false;
  const res = await fetch(`/api/validate-token?token=${encodeURIComponent(token)}`);
  const data = await res.json().catch(() => null);
  return data && data.ok && data.stage === "continue";
}

/* ======================
   SECTIONS
====================== */
const blocked = $("#blocked");
const personal = $("#personal");
const main = $("#mainQuestions");
const afterMain = $("#afterMain");
const game = $("#game");
const scroll = $("#scroll");
const final = $("#final");

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
   HEART INSTRUCTIONS
====================== */
$("#personalBtn").addEventListener("click", () => {
  hearts = 3;
  hudOn();
  mainIndex = 0;
  renderMainQuestion();
  showOnly(main);
});

/* ======================
   QUESTIONS
====================== */
const MAIN = [
  {
    q: "When I say I’m not ready today…",
    a: [
      { t: "I respect your pace and don’t make you feel guilty.", d: 0 },
      { t: "I try to understand, but I still feel frustrated.", d: 1 },
      { t: "I take it personally and pressure you.", d: 2 }
    ]
  },
  {
    q: "When I become quiet instead of expressive…",
    a: [
      { t: "I stay present without forcing words.", d: 0 },
      { t: "I keep asking until it becomes pressure.", d: 1 },
      { t: "I pull away and make you feel alone.", d: 2 }
    ]
  }
];

let mainIndex = 0;

function renderMainQuestion() {
  const q = MAIN[mainIndex];
  $("#mqPrompt").textContent = q.q;
  $("#mqChoices").innerHTML = "";
  showMsg($("#mqMsg"), "");

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
      mainIndex < MAIN.length ? renderMainQuestion() : endQuestions();
    };

    $("#mqChoices").appendChild(btn);
  });
}

function endQuestions() {
  showOnly(afterMain);
  $("#toGameBtn").classList.toggle("hidden", hearts < 2);

  if (hearts <= 0) {
    $("#afterMainTitle").textContent = "I don’t think you meant to hurt my heart…";
    $("#afterMainBody").textContent = "But I need someone who protects it.";
    return;
  }

  if (hearts === 1) {
    $("#afterMainTitle").textContent = "Not yet.";
    $("#afterMainBody").textContent = "But thank you for trying.";
    return;
  }

  $("#afterMainTitle").textContent = "Continue.";
  $("#afterMainBody").textContent = "";
}

/* ======================
   HOLD GAME
====================== */
$("#toGameBtn").addEventListener("click", () => showOnly(game));

const holdBtn = $("#holdBtn");
const holdProgress = $("#holdProgress");

let holding = false;
let pct = 0;
let timer = null;

function startHold() {
  if (holding) return;
  holding = true;
  timer = setInterval(() => {
    pct += 1;
    holdProgress.style.width = `${pct}%`;
    if (pct >= 100) winHold();
  }, 30);
}

function stopHold() {
  if (!holding) return;
  clearInterval(timer);
  pct = 0;
  holding = false;
  holdProgress.style.width = "0%";
}

function winHold() {
  clearInterval(timer);
  showOnly(scroll);
}

holdBtn.addEventListener("mousedown", startHold);
holdBtn.addEventListener("mouseup", stopHold);
holdBtn.addEventListener("mouseleave", stopHold);
holdBtn.addEventListener("touchstart", e => { e.preventDefault(); startHold(); }, { passive: false });
holdBtn.addEventListener("touchend", e => { e.preventDefault(); stopHold(); }, { passive: false });

/* ======================
   SCROLL (LONG LETTER + ANIMATION)
====================== */
const LETTER = `
I don’t think I ever wanted a simple yes or no.

I wanted to see how you handle the parts that take time.
The parts that don’t give answers right away.
The moments where patience matters more than certainty.

I notice how people act when things slow down.
When there’s no instant reward.
When all they can do is stay — or walk away.

If you’re still here,
it means you didn’t rush.
You didn’t force an answer.
You didn’t treat this like something to win.

And that tells me more than words ever could.

This isn’t a promise.
This isn’t a rejection either.

It’s just me saying…
I see you trying to understand,
and that matters more than you think.
`.trim();

$("#openScroll").addEventListener("click", () => {
  typeLetter();
  $("#toFinalBtn").classList.remove("hidden");
});

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
   FINAL (PHOTO STAGE)
====================== */
$("#toFinalBtn").addEventListener("click", () => showOnly(final));

$("#photoCard").addEventListener("click", () => {
  $("#photoCard").classList.toggle("flipped");
});

/* ======================
   BOOT
====================== */
(async function boot() {
  const ok = await validateToken();
  if (!ok) {
    showOnly(blocked);
    return;
  }

  showOnly(personal);
})();
