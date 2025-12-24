import { $, norm, showMsg, getTokenFromUrl } from "./shared.js";

const token = getTokenFromUrl();

/* =====================
   DOM REFERENCES
===================== */

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
const hud = $("#hearts");
const heartsEl = $("#hearts");

// assets
const HEART_OK = "/assets/heart.svg";
const HEART_BROKEN = "/assets/heart-broken.svg";

// personal
const p1 = $("#p1");
const p2 = $("#p2");
const p1Msg = $("#p1Msg");
const p2Msg = $("#p2Msg");
const personalBtn = $("#personalBtn");
const personalMsg = $("#personalMsg");

// main questions
const mqPrompt = $("#mqPrompt");
const mqChoices = $("#mqChoices");
const mqMsg = $("#mqMsg");

// after main
const afterMainTitle = $("#afterMainTitle");
const afterMainBody = $("#afterMainBody");
const toGameBtn = $("#toGameBtn");

// game
const steadyCanvas = $("#steadyCanvas");
const gameStart = $("#gameStart");
const gameReset = $("#gameReset");
const gameMsg = $("#gameMsg");

// after game
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

/* =====================
   STATE
===================== */

let hearts = 3;
let mainIndex = 0;

/* =====================
   DATA
===================== */

const PERSONAL_1 = "153";
const PERSONAL_2 = "b.a.d.";

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
   HELPERS
===================== */

function showOnly(section) {
  [
    blocked,
    personal,
    mainQuestions,
    afterMain,
    game,
    afterGame,
    scroll,
    final
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
  if (!token) return null;
  try {
    const res = await fetch(
      `/api/validate-token?token=${encodeURIComponent(token)}`
    );
    return await res.json();
  } catch {
    return null;
  }
}

/* =====================
   BOOT
===================== */

(async function boot() {
  hudOff();

  const data = await validateToken();
  if (!data?.ok) {
    showOnly(blocked);
    return;
  }

  showOnly(personal);
})();
