import { $, norm, showMsg } from "./shared.js";

const nameInput = $("#nameInput");
const emailInput = $("#emailInput");
const sendBtn = $("#sendBtn");

const nameMsg = $("#nameMsg");
const emailMsg = $("#emailMsg");
const sendMsg = $("#sendMsg");

const ALLOWED_NAMES = ["rhonnyan", "nyan nyan"];
const ALLOWED_EMAIL = "202510576@gordoncollege.edu.ph";

sendBtn.addEventListener("click", async () => {
  const name = norm(nameInput.value);
  const email = norm(emailInput.value);


  showMsg(nameMsg, "");
  showMsg(emailMsg, "");
  showMsg(sendMsg, "");


  if (!name) {
    showMsg(nameMsg, "Say it.", "error");
    return;
  }

  if (!ALLOWED_NAMES.includes(name)) {
    showMsg(nameMsg, "This heart does not recognize you.", "error");
    return;
  }


  if (!email) {
    showMsg(emailMsg, "Enter your email.", "error");
    return;
  }


  if (email.endsWith("@gmail.com")) {
    showMsg(
      emailMsg,
      "If you enter @gmail.com, you will be asked to use your student email.",
      "error"
    );
    return;
  }

  if (email !== ALLOWED_EMAIL) {
    showMsg(emailMsg, "This is not the right key.", "error");
    return;
  }


  sendBtn.disabled = true;
  showMsg(sendMsg, "…");

  try {
    const response = await fetch("/api/request-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      showMsg(sendMsg, "Something went wrong.", "error");
      sendBtn.disabled = false;
      return;
    }

    showMsg(sendMsg, "Check your email to continue.", "ok");
  } catch (error) {
    showMsg(sendMsg, "Network error.", "error");
  } finally {
    sendBtn.disabled = false;
  }
});
