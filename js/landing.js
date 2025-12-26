import { $, norm } from "./shared.js";

$("#sendBtn").onclick = async () => {
  const name = norm($("#name").value);
  const email = norm($("#email").value);
  const msg = $("#msg");

  if (!name || !email) {
    msg.textContent = "Fill everything.";
    return;
  }

  if (email.endsWith("@gmail.com")) {
    msg.textContent = "Use your student email.";
    return;
  }

  msg.textContent = "Sending link…";

  const res = await fetch("/api/request-link", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email })
  });

  msg.textContent = res.ok
    ? "Check your email."
    : "Something went wrong.";
};
