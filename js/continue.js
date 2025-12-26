import { $, norm, showMsg, getTokenFromUrl } from "./shared.js";

/* ======================
   TOKEN VALIDATION
====================== */
const token = getTokenFromUrl();

async function validateToken() {
  if (!token) return false;
  try {
    const res = await fetch(`/api/validate-token?token=${encodeURIComponent(token)}`);
    const data = await res.json();
    return data?.ok === true;
  } catch {
    return false;
  }
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
    .forEach(s => s.classList.add("hidden"));
  section.classList.remove("hidden");
}

/* ======================
   HEARTS
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

/* ======================
   PERSONAL QUESTIONS
====================== */
const PERSONAL_1 = "153";
const PERSONAL_2 = "b.a.d.";

$("#personalBtn").addEventListener("click", () => {
  showMsg($("#p1Msg"), "");
  showMsg($("#p2Msg"), "");
  showMsg($("#personalMsg"), "");

  const a1 = norm($("#p1").value);
  const a2 = norm($("#p2").value);

  if (a1 !== norm(PERSONAL_1)) {
    showMsg($("#p1Msg"), "Wrong.", "error");
    return;
  }

  if (a2 !== norm(PERSONAL_2)) {
    showMsg($("#p2Msg"), "Wrong.", "error");
    return;
  }

  // explain hearts FIRST
  hearts = 3;
  renderHearts();

  $("#mqPrompt").textContent =
    "You have 3 hearts. Every answer reflects how you treat care. Lose them, and this ends.";

  mainIndex = 0;
  loadMainQuestion();
  showOnly(main);
});

/* ======================
   MAIN QUESTIONS
====================== */
const MAIN = [
  {
    q: "If I say I’m not ready today…",
    a: [
      { t: "I wait and respect your pace.", d: 0 },
      { t: "I push for clarity.", d: 1 },
      { t: "I guilt you.", d: 2 }
    ]
  },
  {
    q: "When I’m overwhelmed and quiet…",
    a: [
      { t: "I stay without pressure.", d: 0 },
      { t: "I keep asking.", d: 1 },
      { t: "I pull away.", d: 2 }
    ]
  },
  {
    q: "If distance becomes real again…",
    a: [
      { t: "I choose patience.", d: 0 },
      { t: "I complain but stay.", d: 1 },
      { t: "I resent you.", d: 2 }
    ]
  }
];

let mainIndex = 0;

function loadMainQuestion() {
  const q = MAIN[mainIndex];
  $("#mqPrompt").textContent = q.q;
  $("#mqChoices").innerHTML = "";

  q.a.forEach(choice => {
    const btn = document.createElement("div");
    btn.className = "choice";
    btn.textContent = choice.t;

    btn.onclick = () => {
      hearts = Math.max(0, hearts - choice.d);
      renderHearts();
      mainIndex++;

      if (mainIndex >= MAIN.length) {
        showOnly(afterMain);

        if (hearts < 2) {
          $("#afterMainTitle").textContent = "I don’t think this is right.";
          $("#afterMainBody").textContent =
            "I need someone who protects my heart.";
          $("#toGameBtn").classList.add("hidden");
        } else {
          $("#afterMainTitle").textContent = "You may continue.";
          $("#afterMainBody").textContent =
            "Next is patience, not speed.";
          $("#toGameBtn").classList.remove("hidden");
        }
      } else {
        loadMainQuestion();
      }
    };

    $("#mqChoices").appendChild(btn);
  });
}

$("#toGameBtn").addEventListener("click", () => {
  showOnly(game);
});

/* ======================
   GAME (HOLD = PATIENCE)
====================== */
const panel = document.querySelector(".panel");

panel.innerHTML = `
  <div class="hold-box">
    <div class="hold-progress" id="holdProgress"></div>
    <button id="holdBtn" class="hold-btn">Hold</button>
  </div>
`;

let progress = 0;
let timer = null;

const holdBtn = $("#holdBtn");
const bar = $("#holdProgress");

function resetHold() {
  clearInterval(timer);
  timer = null;
  progress = 0;
  bar.style.width = "0%";
}

function failGame() {
  hearts--;
  renderHearts();
  showOnly(afterGame);

  $("#afterGameTitle").textContent = "Too rushed.";
  $("#afterGameBody").textContent = "Patience matters.";

  $("#toScrollBtn").classList.toggle("hidden", hearts < 2);
}

function winGame() {
  showOnly(afterGame);
  $("#afterGameTitle").textContent = "You waited.";
  $("#afterGameBody").textContent = "That matters.";

  $("#toScrollBtn").classList.remove("hidden");
}

holdBtn.addEventListener("mousedown", () => {
  timer = setInterval(() => {
    progress += 2;
    bar.style.width = progress + "%";

    if (progress >= 100) {
      resetHold();
      winGame();
    }
  }, 40);
});

["mouseup", "mouseleave"].forEach(evt =>
  holdBtn.addEventListener(evt, () => {
    if (progress > 0 && progress < 100) {
      resetHold();
      failGame();
    }
  })
);

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

I will leave after college.
There may be distance again.
And even then, I may not be ready.

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
  }, 20);
}

/* ======================
   FINAL
====================== */
$("#toFinalBtn").addEventListener("click", () => {
  showOnly(final);
});

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
