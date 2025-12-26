import { $, norm, startPixelTimer } from "./shared.js";

const A1 = "153";
const A2 = "b.a.d.";
let expired = false;

startPixelTimer($("#timerBar"), 10 * 60 * 1000, () => {
  expired = true;
  $("#msg").textContent = "Let’s stay as friends.";
});

function check() {
  if (expired) return;
  if (norm($("#q1").value) === A1 && norm($("#q2").value) === A2) {
    $("#continueBtn").classList.remove("hidden");
  }
}

$("#q1").oninput = check;
$("#q2").oninput = check;

$("#continueBtn").onclick = async () => {
  $("#msg").textContent = "Sending link…";
  await fetch("/api/send-link2", { method: "POST" });
  $("#msg").textContent = "Check your email again.";
};
